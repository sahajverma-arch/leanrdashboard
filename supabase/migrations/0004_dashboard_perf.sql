-- 0004: performance + filters.
-- 1) Materialize coaches so views stop recomputing the coach-name union every query.
-- 2) Add SQL aggregation functions so the app fetches small results, not 24k rows.

drop view if exists csat, sales, clients, coaches cascade;
drop materialized view if exists mv_coaches cascade;

-- Materialized coach map (id <-> name), refreshed by the sync.
create materialized view mv_coaches as
with names as (
  select lower(trim(name)) k, name orig from raw_team where coalesce(trim(name),'') <> ''
  union all select lower(trim(current_exercise_coach)), current_exercise_coach from raw_clients where coalesce(trim(current_exercise_coach),'') <> ''
  union all select lower(trim(current_dietitian_name)), current_dietitian_name from raw_clients where coalesce(trim(current_dietitian_name),'') <> ''
  union all select lower(trim(coach_name)), coach_name from raw_csat where coalesce(trim(coach_name),'') <> ''
  union all select lower(trim(currentexercisecoach)), currentexercisecoach from raw_overall_sales where coalesce(trim(currentexercisecoach),'') <> ''
),
distinct_names as (select k, min(orig) name from names group by k),
ranked as (select k, name, dense_rank() over (order by k)::bigint id from distinct_names),
team as (select distinct lower(trim(name)) k, designation from raw_team)
select r.id, r.name, t.designation as role, t.designation as team, 'active'::text as status, r.k as name_key
from ranked r left join team t on t.k = r.k;

create unique index mv_coaches_id_idx on mv_coaches (id);
create index mv_coaches_name_key_idx on mv_coaches (name_key);
grant select on mv_coaches to authenticated;

-- Typed views over the raw tables, joining the materialized coach map (fast).
create view coaches with (security_invoker = on) as
  select id, name, role, team, status, name_key from mv_coaches
  where (auth.jwt() ->> 'email') like '%@fitelo.co';

create view clients with (security_invoker = on) as
select
  safe_bigint(c.customer_code) as id,
  c.name,
  co.id as coach_id,
  c.current_plan as plan,
  lower(nullif(trim(c.state),'')) as status,
  safe_date(c.current_plan_start_date) as start_date,
  safe_date(c.current_plan_end_date) as end_date,
  safe_numeric(c.total_weight_loss) as weight_lost_kg
from raw_clients c
left join mv_coaches co on co.name_key = lower(trim(c.current_exercise_coach));

create view sales with (security_invoker = on) as
select
  row_number() over () as id,
  safe_date(s.saledate) as sale_date,
  safe_bigint(s.cutomerid) as client_id,
  co.id as coach_id,
  s.planname as plan_name,
  coalesce(safe_numeric(s.amount), 0) as amount,
  lower(nullif(trim(s.saletypewithextension),'')) as sale_type
from raw_overall_sales s
left join mv_coaches co on co.name_key = lower(trim(s.currentexercisecoach));

create view csat with (security_invoker = on) as
select
  row_number() over () as id,
  safe_date(c.rating_date) as rating_date,
  safe_bigint(c.code) as client_id,
  co.id as coach_id,
  safe_numeric(c.rating) as rating,
  lower(nullif(trim(c.category),'')) as category
from raw_csat c
left join mv_coaches co on co.name_key = lower(trim(c.coach_name))
where coalesce(safe_numeric(c.rating), 0) > 0;

grant select on coaches, clients, sales, csat to authenticated;

-- Refresh the coach map after a sync (called by the pipeline).
create or replace function refresh_dashboard() returns void
language plpgsql security definer as $$
begin
  refresh materialized view mv_coaches;
end $$;
grant execute on function refresh_dashboard() to authenticated, service_role;

-- CSAT aggregates in SQL with filters (avoids shipping ~24k rows to the app).
create or replace function csat_stats(
  p_start date default null,
  p_end date default null,
  p_coach_id bigint default null
) returns jsonb
language sql stable security invoker as $$
  with f as (
    select c.rating, c.category, c.rating_date, c.coach_id
    from csat c
    where (p_start is null or c.rating_date >= p_start)
      and (p_end is null or c.rating_date <= p_end)
      and (p_coach_id is null or c.coach_id = p_coach_id)
  )
  select jsonb_build_object(
    'count', (select count(*) from f),
    'avg', (select coalesce(round(avg(rating), 2), 0) from f),
    'happy', (select count(*) from f where rating >= 4),
    'detractors', (select count(*) from f where rating <= 2),
    'byCoach', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'value', v, 'n', n) order by v desc), '[]'::jsonb)
                from (select co.id, co.name, round(avg(f.rating), 2) v, count(*) n
                      from f join mv_coaches co on co.id = f.coach_id
                      group by co.id, co.name) t),
    'byCategory', (select coalesce(jsonb_agg(jsonb_build_object('name', category, 'value', v) order by v desc), '[]'::jsonb)
                   from (select category, round(avg(rating), 2) v from f where category is not null group by category) t),
    'byMonth', (select coalesce(jsonb_agg(jsonb_build_object('name', m, 'value', v) order by m), '[]'::jsonb)
                from (select to_char(rating_date, 'YYYY-MM') m, round(avg(rating), 2) v from f where rating_date is not null group by 1) t),
    'distribution', (select coalesce(jsonb_agg(jsonb_build_object('name', star || '★', 'value', c) order by star), '[]'::jsonb)
                     from (select round(rating)::int star, count(*) c from f where rating between 1 and 5 group by 1) t)
  )
$$;
grant execute on function csat_stats(date, date, bigint) to authenticated;

-- Distinct values for the filter dropdowns.
create or replace function filter_options() returns jsonb
language sql stable security invoker as $$
  select jsonb_build_object(
    'coaches', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name), '[]'::jsonb)
                from mv_coaches
                where id in (select coach_id from clients union select coach_id from sales)),
    'plans', (select coalesce(jsonb_agg(distinct plan order by plan), '[]'::jsonb) from clients where plan is not null),
    'statuses', (select coalesce(jsonb_agg(distinct status order by status), '[]'::jsonb) from clients where status is not null)
  )
$$;
grant execute on function filter_options() to authenticated;

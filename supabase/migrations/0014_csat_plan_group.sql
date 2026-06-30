-- 0014: bifurcate CSAT by plan group (Learn Basic / Learn Adv).
-- The CSAT sheet's "Plan Name" column maps to two tiers, same rule as the
-- Clients tab: Leanr Basic + Performance CORE -> 'Learn Basic';
-- Leanr Advance + Performance PRO -> 'Learn Adv'; anything else -> 'Other'.
--   1) plan_group(text): shared classifier (mirrors lib/dashboard planGroup()).
--   2) csat view gains a plan_group column (derived from raw_csat.plan_name).
--   3) csat_stats gains a 'byGroup' breakdown (count/avg/happy/detractors).

-- Shared plan-group classifier. 'basic'/'core' checked first so the precedence
-- matches the JS helper exactly.
create or replace function plan_group(p text) returns text
language sql immutable as $$
  select case
    when lower(coalesce(p, '')) like '%basic%' or lower(coalesce(p, '')) like '%core%'
      then 'Learn Basic'
    when lower(coalesce(p, '')) like '%advance%' or lower(coalesce(p, '')) like '%pro%'
      then 'Learn Adv'
    else 'Other'
  end
$$;

-- Append plan_group to the csat view (existing columns unchanged, so CREATE OR
-- REPLACE is allowed).
create or replace view csat with (security_invoker = on) as
select
  row_number() over () as id,
  safe_date(c.rating_date) as rating_date,
  safe_bigint(c.code) as client_id,
  co.id as coach_id,
  safe_numeric(c.rating) as rating,
  lower(nullif(trim(c.category),'')) as category,
  plan_group(c.plan_name) as plan_group
from raw_csat c
left join mv_coaches co on co.name_key = lower(trim(c.coach_name))
where coalesce(safe_numeric(c.rating), 0) > 0;

grant select on csat to authenticated;

-- Rebuild csat_stats keeping the 0013 thresholds (happy >= 5, detractors <= 3)
-- and adding a per-plan-group breakdown keyed by group name.
create or replace function csat_stats(
  p_start date default null,
  p_end date default null,
  p_coach_id bigint default null
) returns jsonb
language sql stable security invoker as $$
  with f as (
    select c.rating, c.category, c.rating_date, c.coach_id, c.plan_group
    from csat c
    where (p_start is null or c.rating_date >= p_start)
      and (p_end is null or c.rating_date <= p_end)
      and (p_coach_id is null or c.coach_id = p_coach_id)
  )
  select jsonb_build_object(
    'count', (select count(*) from f),
    'avg', (select coalesce(round(avg(rating), 2), 0) from f),
    'happy', (select count(*) from f where rating >= 5),
    'detractors', (select count(*) from f where rating <= 3),
    'byCoach', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'value', v, 'n', n) order by v desc), '[]'::jsonb)
                from (select co.id, co.name, round(avg(f.rating), 2) v, count(*) n
                      from f join mv_coaches co on co.id = f.coach_id
                      group by co.id, co.name) t),
    'byCategory', (select coalesce(jsonb_agg(jsonb_build_object('name', category, 'value', v) order by v desc), '[]'::jsonb)
                   from (select category, round(avg(rating), 2) v from f where category is not null group by category) t),
    'byMonth', (select coalesce(jsonb_agg(jsonb_build_object('name', m, 'value', v) order by m), '[]'::jsonb)
                from (select to_char(rating_date, 'YYYY-MM') m, round(avg(rating), 2) v from f where rating_date is not null group by 1) t),
    'distribution', (select coalesce(jsonb_agg(jsonb_build_object('name', star || '★', 'value', c) order by star), '[]'::jsonb)
                     from (select round(rating)::int star, count(*) c from f where rating between 1 and 5 group by 1) t),
    'byGroup', (select coalesce(jsonb_object_agg(plan_group, jsonb_build_object(
                         'count', n, 'avg', a, 'happy', h, 'detractors', d)), '{}'::jsonb)
                from (select plan_group,
                             count(*) n,
                             coalesce(round(avg(rating), 2), 0) a,
                             count(*) filter (where rating >= 5) h,
                             count(*) filter (where rating <= 3) d
                      from f group by plan_group) t)
  )
$$;
grant execute on function csat_stats(date, date, bigint) to authenticated;

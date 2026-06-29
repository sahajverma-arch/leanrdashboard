-- 0013: redefine the Happy / Detractors CSAT KPI thresholds.
-- Happy now counts only the top rating (5); Detractors now counts 1-3
-- (previously Happy was 4-5 and Detractors was 1-2). 4 is the lone neutral.
-- Only the happy/detractors lines change; the rest of csat_stats is unchanged.

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
                     from (select round(rating)::int star, count(*) c from f where rating between 1 and 5 group by 1) t)
  )
$$;
grant execute on function csat_stats(date, date, bigint) to authenticated;

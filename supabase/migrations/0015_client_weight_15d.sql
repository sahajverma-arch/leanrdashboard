-- 0015: Expose 15-day weight loss on the clients view.
-- Powers the Overview "Avg weight lost (15d)" KPI. Source column in the Clients
-- sheet is AC-adjacent "Weight_loss_in_Last_15_Days" (raw_clients.weight_loss_in_last_15_days).
-- Appends one column to the view (create-or-replace allows add-at-end), so the
-- existing columns/order are unchanged.

create or replace view clients with (security_invoker = on) as
select
  safe_bigint(c.customer_code) as id,
  c.name,
  co.id as coach_id,
  c.current_plan as plan,
  lower(nullif(trim(c.state),'')) as status,
  safe_date(c.current_plan_start_date) as start_date,
  safe_date(c.current_plan_end_date) as end_date,
  safe_numeric(c.total_weight_loss) as weight_lost_kg,
  safe_numeric(c.weight_loss_in_last_15_days) as weight_lost_15d_kg
from raw_clients c
left join mv_coaches co on co.name_key = lower(trim(c.current_exercise_coach));

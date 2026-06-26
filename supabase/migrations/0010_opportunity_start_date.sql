-- 0010: store the plan start date on each opportunity row so the Opportunity
-- page can filter by month (basis = Start Date, i.e. when the current plan began).
-- Kept as text like the other raw_* columns; the month is parsed in the app.
alter table raw_coach_opportunity add column if not exists start_date text;

-- 0007: store the monthly total sale revenue (₹) for the LEANR team section.
-- Comes from the "Total / Sale" cell of each month block in the pivot sheet.
alter table raw_sales_leanr_team add column if not exists sale numeric;

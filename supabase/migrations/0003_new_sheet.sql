-- 0003: switch data source to the new "Leaner Dashboard" sheet.
-- Overall Sales grew 13 -> 38 columns; add the new ones so the sync can write.
-- (clients/csat headers are unchanged.) Team tab no longer exists, so clear it.

truncate raw_team;

alter table raw_overall_sales add column if not exists cutomerid text;
alter table raw_overall_sales add column if not exists customerid text;
alter table raw_overall_sales add column if not exists orderid text;
alter table raw_overall_sales add column if not exists customername text;
alter table raw_overall_sales add column if not exists planname text;
alter table raw_overall_sales add column if not exists ordertype text;
alter table raw_overall_sales add column if not exists amount text;
alter table raw_overall_sales add column if not exists actualowner text;
alter table raw_overall_sales add column if not exists actual_owner_employee_code text;
alter table raw_overall_sales add column if not exists actualownerdept text;
alter table raw_overall_sales add column if not exists type text;
alter table raw_overall_sales add column if not exists saledate text;
alter table raw_overall_sales add column if not exists type_mapping text;
alter table raw_overall_sales add column if not exists dietitiancoach text;
alter table raw_overall_sales add column if not exists exercisecoach text;
alter table raw_overall_sales add column if not exists previousplanname text;
alter table raw_overall_sales add column if not exists previoussaledate text;
alter table raw_overall_sales add column if not exists actualownercontribution text;
alter table raw_overall_sales add column if not exists actualownercontributionamount text;
alter table raw_overall_sales add column if not exists dietitiancontribution text;
alter table raw_overall_sales add column if not exists dietitiancontributionamount text;
alter table raw_overall_sales add column if not exists exercisecontribution text;
alter table raw_overall_sales add column if not exists exercisecontributionamount text;
alter table raw_overall_sales add column if not exists startdate text;
alter table raw_overall_sales add column if not exists enddate text;
alter table raw_overall_sales add column if not exists state text;
alter table raw_overall_sales add column if not exists currentdietitian text;
alter table raw_overall_sales add column if not exists currentmindcoach text;
alter table raw_overall_sales add column if not exists currentexercisecoach text;
alter table raw_overall_sales add column if not exists totalservicedays text;
alter table raw_overall_sales add column if not exists utiliseddays text;
alter table raw_overall_sales add column if not exists remainingdays text;
alter table raw_overall_sales add column if not exists saletypewithextension text;
alter table raw_overall_sales add column if not exists referred_by_employeename text;
alter table raw_overall_sales add column if not exists referred_by_employeecode text;
alter table raw_overall_sales add column if not exists leadtype text;
alter table raw_overall_sales add column if not exists referredbyclient text;
alter table raw_overall_sales add column if not exists referedempdep text;

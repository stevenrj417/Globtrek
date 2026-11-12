-- Property-specific stay pricing in 14-day periods.
--
-- Builds on public.price_observations (202611120001): every row there is a
-- price a provider actually quoted. Nothing modeled is ever written to it.
-- This migration only adds columns, a function, a view and a queue table.
--
-- Rollback (safe; drops nothing that existed before):
--   drop view if exists public.hotel_period_stats;
--   drop function if exists public.stay_period(date);
--   drop table if exists public.stay_price_refresh_queue;
--   alter table public.price_observations
--     drop column if exists nights, drop column if exists total_price,
--     drop column if exists taxes_and_fees, drop column if exists refundable,
--     drop column if exists meal_plan, drop column if exists rate_conditions;

alter table public.price_observations
  add column if not exists nights integer check (nights is null or nights between 1 and 90),
  add column if not exists total_price numeric(12, 2) check (total_price is null or total_price > 0),
  add column if not exists taxes_and_fees numeric(12, 2) check (taxes_and_fees is null or taxes_and_fees >= 0),
  add column if not exists refundable boolean,
  add column if not exists meal_plan text,
  add column if not exists rate_conditions jsonb;

create index if not exists price_observations_stay_period on public.price_observations (item_id, travel_date) where kind = 'stay';

-- 1–26: period 1 is Jan 1–14, period 26 starts on day 351 and takes the
-- leftover days of the year. Matches app/lib/pricing/stayPeriods.js.
create or replace function public.stay_period(d date) returns integer
language sql immutable as $$
  select least(26, ((extract(doy from d)::integer - 1) / 14) + 1)
$$;

-- Per property, comparable room (occupancy, room type, refundability),
-- stay year and period: robust summary of observed nightly prices, with how
-- far ahead of the stay each price was seen. Three samples minimum.
create or replace view public.hotel_period_stats as
select item_id,
       destination_id,
       currency,
       occupancy,
       coalesce(room_type, 'standard') as room_type,
       refundable,
       extract(year from travel_date)::integer as stay_year,
       public.stay_period(travel_date) as period,
       count(*) as samples,
       round(avg(price)) as mean,
       round(percentile_cont(0.5) within group (order by price)::numeric) as median,
       round(percentile_cont(0.1) within group (order by price)::numeric) as p10,
       round(percentile_cont(0.25) within group (order by price)::numeric) as p25,
       round(percentile_cont(0.75) within group (order by price)::numeric) as p75,
       round(percentile_cont(0.9) within group (order by price)::numeric) as p90,
       min(price) as low,
       max(price) as high,
       min(observed_at) as observed_from,
       max(observed_at) as observed_to,
       round(avg(travel_date - observed_at)) as mean_days_ahead
from public.price_observations
where kind = 'stay' and travel_date is not null and unit = 'per_night'
group by item_id, destination_id, currency, occupancy, coalesce(room_type, 'standard'), refundable, extract(year from travel_date), public.stay_period(travel_date)
having count(*) >= 3;

-- Exact stays to price, most useful first (see app/lib/pricing/stayRefresh.js).
create table if not exists public.stay_price_refresh_queue (
  id bigserial primary key,
  item_id text not null,
  destination_id text,
  check_in date not null,
  check_out date not null check (check_out > check_in),
  adults integer not null default 2 check (adults between 1 and 30),
  rooms integer not null default 1 check (rooms between 1 and 30),
  priority integer not null default 0,
  reason text not null,
  next_attempt_at timestamptz not null default now(),
  attempts integer not null default 0,
  last_status text,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  unique (item_id, check_in, check_out, adults, rooms)
);

create index if not exists stay_price_refresh_due on public.stay_price_refresh_queue (next_attempt_at, priority desc);

alter table public.stay_price_refresh_queue enable row level security;
revoke all on public.hotel_period_stats, public.stay_price_refresh_queue from anon, authenticated;
grant select on public.hotel_period_stats to service_role;
grant select, insert, update, delete on public.stay_price_refresh_queue to service_role;
grant usage, select on sequence public.stay_price_refresh_queue_id_seq to service_role;

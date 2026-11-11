-- Observed prices for specific items (routes, properties, tours, restaurants).
-- observed_at is the day a price was seen; travel_date is the day it prices.
-- Written only by server jobs (service role); nothing is readable publicly.
create table if not exists public.price_observations (
  id bigserial primary key,
  kind text not null check (kind in ('flight', 'stay', 'activity', 'restaurant', 'esim')),
  item_id text not null,
  destination_id text,
  provider text not null,
  source text,
  observed_at date not null,
  travel_date date,
  travel_end date,
  price numeric(12, 2) not null check (price > 0),
  currency char(3) not null,
  unit text not null,
  taxes_included boolean,
  occupancy integer,
  room_type text,
  conditions jsonb,
  -- observationKey() in app/lib/pricing/observations.js
  dedupe_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists price_observations_item on public.price_observations (kind, item_id, travel_date);

alter table public.price_observations enable row level security;

-- Per item, half-month ('03a', '03b') and month ('03') of travel: observations
-- from the last 400 days only.
create or replace view public.price_period_stats as
with recent as (
  select kind, item_id, currency, price, observed_at, travel_date,
         to_char(travel_date, 'MM') as month,
         to_char(travel_date, 'MM') || case when extract(day from travel_date) <= 15 then 'a' else 'b' end as half
  from public.price_observations
  where travel_date is not null and observed_at >= current_date - 400
)
select kind, item_id, currency, period, count(*) as samples,
       round(avg(price)) as average, round(percentile_cont(0.5) within group (order by price)::numeric) as median,
       min(price) as low, max(price) as high, min(observed_at) as observed_from, max(observed_at) as observed_to
from (select *, half as period from recent union all select *, month as period from recent) periods
group by kind, item_id, currency, period
having count(*) >= 3;

revoke all on public.price_observations, public.price_period_stats from anon, authenticated;
grant select, insert on public.price_observations to service_role;
grant usage, select on sequence public.price_observations_id_seq to service_role;
grant select on public.price_period_stats to service_role;

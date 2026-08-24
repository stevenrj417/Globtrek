create table if not exists public.cruise_catalog (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_cruise_id text not null,
  provider_offer_id text,
  name text not null,
  cruise_line text not null,
  ship_name text not null,
  cruise_type text not null check (cruise_type in ('ocean', 'river', 'expedition')),
  region text not null,
  duration_nights smallint not null check (duration_nights between 1 and 180),
  departure_date date not null,
  return_date date not null,
  departure_port jsonb not null,
  arrival_port jsonb not null,
  sea_days smallint not null default 0 check (sea_days >= 0),
  starting_price numeric not null check (starting_price > 0),
  currency text not null,
  price_basis text not null default 'per_person_double_occupancy',
  price_is_live boolean not null default false,
  price_verified_at timestamptz not null,
  cabin_information jsonb not null default '[]'::jsonb,
  description text,
  image_urls text[] not null default '{}',
  image_attribution jsonb not null default '[]'::jsonb,
  match_tags text[] not null default '{}',
  style_scores jsonb not null default '{}'::jsonb,
  provider_url text not null,
  affiliate_url text not null,
  affiliate_url_verified boolean not null default false,
  source_payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null,
  identity_verified boolean not null default false,
  itinerary_verified boolean not null default false,
  recommendation_ready boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_cruise_id, departure_date),
  check (return_date > departure_date),
  check (jsonb_typeof(departure_port) = 'object'),
  check (jsonb_typeof(arrival_port) = 'object'),
  check (jsonb_typeof(cabin_information) in ('array', 'object')),
  check (not recommendation_ready or (
    active and identity_verified and itinerary_verified and affiliate_url_verified
    and cardinality(image_urls) >= 1
  ))
);

create table if not exists public.cruise_itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  cruise_id uuid not null references public.cruise_catalog(id) on delete cascade,
  day_number smallint not null check (day_number >= 1),
  sequence_number smallint not null check (sequence_number >= 1),
  stop_type text not null check (stop_type in ('port', 'sea_day')),
  port_name text,
  country text,
  latitude numeric,
  longitude numeric,
  arrival_time timestamptz,
  departure_time timestamptz,
  place_id text,
  description text,
  image_url text,
  source text not null,
  verified_at timestamptz not null,
  unique (cruise_id, sequence_number),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180),
  check (stop_type = 'sea_day' or (port_name is not null and country is not null and latitude is not null and longitude is not null))
);

create table if not exists public.cruise_outbound_events (
  id uuid primary key default gen_random_uuid(),
  cruise_id uuid not null references public.cruise_catalog(id) on delete restrict,
  click_id uuid not null default gen_random_uuid() unique,
  placement text not null,
  provider text not null,
  occurred_at timestamptz not null default now(),
  referrer_host text,
  user_agent_family text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.cruise_conversion_events (
  id uuid primary key default gen_random_uuid(),
  cruise_id uuid references public.cruise_catalog(id) on delete set null,
  provider text not null,
  provider_order_id text not null,
  click_id uuid,
  sail_date date,
  sale_amount numeric,
  commission_amount numeric,
  currency text,
  occurred_at timestamptz not null,
  imported_at timestamptz not null default now(),
  source text not null,
  unique (provider, provider_order_id)
);

create index if not exists cruise_catalog_ready_idx on public.cruise_catalog (recommendation_ready, active, departure_date);
create index if not exists cruise_catalog_match_idx on public.cruise_catalog using gin (match_tags);
create index if not exists cruise_itinerary_cruise_idx on public.cruise_itinerary_stops (cruise_id, sequence_number);
create index if not exists cruise_outbound_cruise_idx on public.cruise_outbound_events (cruise_id, occurred_at desc);

alter table public.cruise_catalog enable row level security;
alter table public.cruise_itinerary_stops enable row level security;
alter table public.cruise_outbound_events enable row level security;
alter table public.cruise_conversion_events enable row level security;

revoke all on public.cruise_catalog, public.cruise_itinerary_stops, public.cruise_outbound_events, public.cruise_conversion_events from anon, authenticated;

comment on table public.cruise_catalog is 'Verified provider-backed cruise sailings. Editorial route concepts never belong in this table.';
comment on column public.cruise_catalog.source_payload is 'Server-only provider evidence. The public recommendation API returns a sanitized cruise model.';
comment on column public.cruise_catalog.affiliate_url is 'Exact provider sailing deep link with CJ attribution. Never guessed or constructed from a cruise name.';
comment on column public.cruise_catalog.starting_price is 'Provider-supplied starting fare using price_basis; never a GlobTrek estimate.';
comment on table public.cruise_conversion_events is 'Server-only CJ conversion imports. Client activity never creates conversion records.';

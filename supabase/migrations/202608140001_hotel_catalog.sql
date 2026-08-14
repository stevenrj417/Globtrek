create table if not exists public.travel_destinations (
  id text primary key,
  city text not null,
  region text,
  country text not null,
  currency text not null default 'USD',
  recognition_score smallint check (recognition_score between 0 and 100),
  cost_profile jsonb not null default '{}'::jsonb,
  cost_source text,
  cost_confidence numeric check (cost_confidence between 0 and 1),
  cost_last_updated date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hotel_catalog (
  id uuid primary key default gen_random_uuid(),
  destination_id text not null references public.travel_destinations(id) on delete restrict,
  name text not null,
  normalized_name text not null,
  city text not null,
  region text,
  country text not null,
  latitude numeric,
  longitude numeric,
  booking_com_property_url text,
  cj_tracking_url text,
  provider text not null,
  provider_property_id text,
  typical_nightly_low numeric,
  typical_nightly_high numeric,
  currency text,
  price_confidence numeric check (price_confidence between 0 and 1),
  price_last_checked timestamptz,
  price_source text,
  description text,
  star_rating numeric,
  review_rating numeric,
  luxury_score smallint check (luxury_score between 0 and 100),
  relaxation_score smallint check (relaxation_score between 0 and 100),
  design_score smallint check (design_score between 0 and 100),
  nightlife_score smallint check (nightlife_score between 0 and 100),
  local_feel_score smallint check (local_feel_score between 0 and 100),
  family_score smallint check (family_score between 0 and 100),
  romantic_score smallint check (romantic_score between 0 and 100),
  centrality_score smallint check (centrality_score between 0 and 100),
  value_score smallint check (value_score between 0 and 100),
  style_tags text[] not null default '{}',
  amenity_tags text[] not null default '{}',
  image_url text,
  image_source text,
  image_license_metadata jsonb,
  verified_at timestamptz,
  verification_source text,
  review_status text not null default 'needs_review' check (review_status in ('verified', 'needs_review', 'rejected')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180),
  check (typical_nightly_low is null or typical_nightly_low >= 0),
  check (typical_nightly_high is null or typical_nightly_high >= typical_nightly_low),
  unique (destination_id, normalized_name, provider)
);

create index if not exists hotel_catalog_destination_active_idx on public.hotel_catalog (destination_id, active);
create index if not exists hotel_catalog_price_idx on public.hotel_catalog (destination_id, typical_nightly_low, typical_nightly_high) where active;
create index if not exists hotel_catalog_style_tags_idx on public.hotel_catalog using gin (style_tags);

create table if not exists public.hotel_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  submitted_count integer not null default 0,
  imported_count integer not null default 0,
  duplicate_count integer not null default 0,
  invalid_count integer not null default 0,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.travel_destinations enable row level security;
alter table public.hotel_catalog enable row level security;
alter table public.hotel_import_batches enable row level security;

create policy "Public can read destination cost profiles" on public.travel_destinations for select using (true);
create policy "Public can read active reviewed hotels" on public.hotel_catalog for select using (active and review_status <> 'rejected');

grant select on public.travel_destinations to anon, authenticated;
grant select on public.hotel_catalog to anon, authenticated;
revoke all on public.hotel_import_batches from anon, authenticated;
revoke insert, update, delete on public.travel_destinations from anon, authenticated;
revoke insert, update, delete on public.hotel_catalog from anon, authenticated;

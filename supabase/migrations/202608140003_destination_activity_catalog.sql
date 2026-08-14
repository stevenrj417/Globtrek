alter table public.travel_destinations
  add column if not exists region text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists nearest_airport text,
  add column if not exists knownness_score smallint check (knownness_score between 0 and 100),
  add column if not exists unknownness_score smallint check (unknownness_score between 0 and 100),
  add column if not exists cost_level text check (cost_level in ('affordable', 'moderate', 'upscale', 'luxury')),
  add column if not exists seasonality jsonb not null default '{}'::jsonb,
  add column if not exists climate_profile jsonb not null default '{}'::jsonb,
  add column if not exists trip_length_fit jsonb not null default '{}'::jsonb,
  add column if not exists accessibility_profile jsonb not null default '{}'::jsonb,
  add column if not exists traveler_type_tags text[] not null default '{}',
  add column if not exists interest_tags text[] not null default '{}',
  add column if not exists primary_image_url text,
  add column if not exists image_source text,
  add column if not exists image_license_metadata jsonb,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_source text,
  add column if not exists recommendation_ready boolean not null default false,
  add column if not exists active boolean not null default true;

update public.travel_destinations
set knownness_score = recognition_score,
    unknownness_score = 100 - recognition_score
where knownness_score is null and recognition_score is not null;

update public.travel_destinations destination
set recommendation_ready = true
where exists (select 1 from public.hotel_catalog hotel where hotel.destination_id = destination.id and hotel.active);

create table if not exists public.destination_images (
  id uuid primary key default gen_random_uuid(),
  destination_id text not null references public.travel_destinations(id) on delete cascade,
  image_url text not null,
  source_page_url text not null,
  source_name text not null,
  author text,
  license_name text not null,
  license_url text,
  attribution_text text,
  width integer,
  height integer,
  is_hero boolean not null default false,
  verified_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (destination_id, image_url)
);

create unique index if not exists destination_images_one_hero_idx on public.destination_images (destination_id) where is_hero and active;

create table if not exists public.activity_catalog (
  id uuid primary key default gen_random_uuid(),
  destination_id text not null references public.travel_destinations(id) on delete restrict,
  name text not null,
  normalized_name text not null,
  category text not null,
  description text,
  location text,
  latitude numeric,
  longitude numeric,
  estimated_cost_low numeric,
  estimated_cost_high numeric,
  currency text,
  price_source text,
  price_confidence numeric check (price_confidence between 0 and 1),
  price_last_checked timestamptz,
  duration_minutes integer,
  recommended_time_of_day text[],
  seasonality jsonb not null default '{}'::jsonb,
  relaxation_score smallint check (relaxation_score between 0 and 100),
  adventure_score smallint check (adventure_score between 0 and 100),
  local_feel_score smallint check (local_feel_score between 0 and 100),
  iconic_score smallint check (iconic_score between 0 and 100),
  luxury_score smallint check (luxury_score between 0 and 100),
  family_score smallint check (family_score between 0 and 100),
  nightlife_score smallint check (nightlife_score between 0 and 100),
  booking_url text,
  provider text,
  provider_id text,
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
  check (estimated_cost_low is null or estimated_cost_low >= 0),
  check (estimated_cost_high is null or estimated_cost_high >= estimated_cost_low),
  unique (destination_id, normalized_name, provider)
);

create index if not exists activity_catalog_destination_active_idx on public.activity_catalog (destination_id, active);
create index if not exists activity_catalog_category_idx on public.activity_catalog (destination_id, category) where active;

alter table public.destination_images enable row level security;
alter table public.activity_catalog enable row level security;

create policy "Public can read licensed destination images" on public.destination_images for select using (active);
create policy "Public can read active reviewed activities" on public.activity_catalog for select using (active and review_status <> 'rejected');

grant select on public.destination_images to anon, authenticated;
grant select on public.activity_catalog to anon, authenticated;
revoke insert, update, delete on public.destination_images from anon, authenticated;
revoke insert, update, delete on public.activity_catalog from anon, authenticated;

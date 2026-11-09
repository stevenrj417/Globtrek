-- Booking.com property catalog imported from GlobTrek's CJ product feeds.
--
-- Property details only: names, photos, rooms, amenities, address, coordinates,
-- catalog flags and the CJ click link. The feed carries no prices, date-specific
-- availability, rate plans, taxes or guest reviews, so this table has no price
-- columns. Catalog flags (free cancellation, Wi-Fi, breakfast) mean Booking.com
-- lists the option on some rates; they are not the terms of a specific booking.
--
-- Separate from public.hotel_catalog: curated records are untouched. Rows are
-- never deleted by the importer; records missing from a destination's latest
-- successful import are marked inactive with a reason.

create table if not exists public.cj_catalog_import_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'succeeded', 'partial', 'failed')),
  dry_run boolean not null default false,
  trigger text not null default 'manual' check (trigger in ('manual', 'cron', 'script')),
  destinations_attempted integer not null default 0,
  destinations_succeeded integer not null default 0,
  records_seen integer not null default 0,
  records_upserted integer not null default 0,
  records_deactivated integer not null default 0,
  error_summary jsonb not null default '[]'::jsonb,
  feed_versions jsonb not null default '[]'::jsonb
);

create table if not exists public.cj_catalog_properties (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'booking.com',
  provider_property_id text not null,
  destination_id text not null,
  cj_ad_id text not null,
  feed_name text,
  feed_updated_at timestamptz,
  product_updated_at timestamptz,
  name text not null,
  category text,
  star_rating numeric(2, 1) check (star_rating is null or (star_rating >= 0 and star_rating <= 5)),
  description text,
  booking_url text not null check (booking_url like 'https://www.booking.com/hotel/%'),
  cj_click_url text not null check (cj_click_url like 'https://%'),
  cj_tracking_base_url text not null check (cj_tracking_base_url like 'https://%'),
  street_address text,
  city text,
  province_state text,
  postal_code text,
  country text,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  image_url text,
  additional_images text[] not null default '{}',
  amenities text[] not null default '{}',
  accessibility text[] not null default '{}',
  dining text,
  room_types text[] not null default '{}',
  has_dorm_beds boolean not null default false,
  beds integer,
  bedrooms integer,
  bathrooms numeric(4, 1),
  beds_description text,
  max_guests integer,
  catalog_free_cancellation boolean,
  catalog_free_wifi boolean,
  catalog_free_breakfast boolean,
  near_airport text,
  budget_score numeric(5, 1) not null default 0,
  first_imported_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_import_run_id uuid references public.cj_catalog_import_runs(id) on delete set null,
  active boolean not null default true,
  deactivated_at timestamptz,
  deactivation_reason text,
  updated_at timestamptz not null default now(),
  unique (provider, provider_property_id, destination_id)
);

create index if not exists cj_catalog_properties_destination_active_idx
  on public.cj_catalog_properties (destination_id, active, budget_score desc);

create or replace function public.touch_cj_catalog_properties() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cj_catalog_properties_touch on public.cj_catalog_properties;
create trigger cj_catalog_properties_touch before update on public.cj_catalog_properties
  for each row execute function public.touch_cj_catalog_properties();

-- Public, non-sensitive listing data: anyone may read active rows. Only the
-- service role (the importer) writes. Import runs are private.
alter table public.cj_catalog_properties enable row level security;
alter table public.cj_catalog_import_runs enable row level security;

drop policy if exists "Active catalog properties are public" on public.cj_catalog_properties;
create policy "Active catalog properties are public" on public.cj_catalog_properties
  for select using (active);

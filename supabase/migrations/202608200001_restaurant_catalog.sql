create table if not exists public.restaurant_catalog (
  id uuid primary key default gen_random_uuid(),
  destination_id text not null,
  name text not null,
  description text,
  cuisine text[] not null default '{}',
  neighborhood text,
  price_level smallint check (price_level between 1 and 4),
  latitude numeric,
  longitude numeric,
  image_url text,
  provider text not null default 'opentable' check (provider = 'opentable'),
  provider_id text,
  opentable_restaurant_id bigint unique,
  booking_url text,
  editorial_score smallint not null default 50 check (editorial_score between 0 and 100),
  verification_source text not null,
  verified_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (destination_id, name)
);

alter table public.restaurant_catalog enable row level security;
create policy "Public can read active restaurants" on public.restaurant_catalog for select using (active = true);
create index if not exists restaurant_catalog_destination_idx on public.restaurant_catalog (destination_id, active, editorial_score desc);

comment on column public.restaurant_catalog.opentable_restaurant_id is 'Official OpenTable RID obtained through approved Directory API data; never inferred or scraped.';
comment on column public.restaurant_catalog.booking_url is 'Official OpenTable booking URL obtained from Directory or Consumer API data.';

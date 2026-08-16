alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists currency text not null default 'USD',
  add column if not exists home_airport text,
  add column if not exists travel_preferences jsonb not null default '{}'::jsonb;

alter table public.saved_trips
  add column if not exists public_slug text,
  add column if not exists is_public boolean not null default false;

create unique index if not exists saved_trips_public_slug_idx
  on public.saved_trips (public_slug) where public_slug is not null;

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('hotel', 'destination')),
  item_key text not null,
  title text not null,
  subtitle text,
  image_url text,
  item_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_key)
);

create table if not exists public.recent_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('hotel', 'destination')),
  item_key text not null,
  title text not null,
  subtitle text,
  image_url text,
  item_data jsonb not null default '{}'::jsonb,
  viewed_at timestamptz not null default now(),
  unique (user_id, item_type, item_key)
);

create index if not exists saved_items_user_updated_idx on public.saved_items (user_id, updated_at desc);
create index if not exists recent_views_user_viewed_idx on public.recent_views (user_id, viewed_at desc);

alter table public.saved_items enable row level security;
alter table public.recent_views enable row level security;

create policy "Users can manage their saved items" on public.saved_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their recent views" on public.recent_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.saved_items from anon;
revoke all on public.recent_views from anon;
grant select, insert, update, delete on public.saved_items to authenticated;
grant select, insert, update, delete on public.recent_views to authenticated;

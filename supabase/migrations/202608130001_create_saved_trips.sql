create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_trip_key text not null,
  destination_name text not null,
  destination_country text,
  destination_airport text,
  start_date date,
  end_date date,
  travelers integer not null default 1 check (travelers between 1 and 30),
  trip_data jsonb not null default '{}'::jsonb,
  booking_references jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_trip_key)
);

create index if not exists saved_trips_user_updated_idx on public.saved_trips (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.saved_trips enable row level security;

create policy "Users can read their profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can delete their profile" on public.profiles for delete using (auth.uid() = id);

create policy "Users can read their trips" on public.saved_trips for select using (auth.uid() = user_id);
create policy "Users can insert their trips" on public.saved_trips for insert with check (auth.uid() = user_id);
create policy "Users can update their trips" on public.saved_trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their trips" on public.saved_trips for delete using (auth.uid() = user_id);

revoke all on public.profiles from anon;
revoke all on public.saved_trips from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_trips to authenticated;

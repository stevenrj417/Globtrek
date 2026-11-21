-- Saved picks for "any place" search: per Google place ID and budget, the chosen
-- Google place IDs (dinners, things to do), distances GlobTrek computed, and the
-- Booking.com listings (from GlobTrek's CJ feed). No Google names, ratings,
-- photos or coordinates are stored (Google Maps Platform Terms 3.2.3). Only the
-- server (service role) reads or writes this table.
create table if not exists public.place_picks (
  place_id text not null check (char_length(place_id) between 5 and 300),
  budget text not null check (budget in ('budget', 'mid', 'comfort')),
  picks jsonb not null,
  computed_at timestamptz not null default now(),
  refresh_after timestamptz not null,
  primary key (place_id, budget)
);

alter table public.place_picks enable row level security;
revoke all on public.place_picks from anon, authenticated;

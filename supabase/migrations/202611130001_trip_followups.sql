-- Check-in emails after someone emails or books a trip: one row per address
-- and destination. `step` counts the follow-ups already sent (0-6); the cron
-- sends the next one when next_send_at passes. Signed-out requests start as
-- 'pending' until the recipient confirms from the first email.
create table if not exists public.trip_followups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  trip_key text not null,
  destination_name text not null,
  model jsonb not null,
  view_url text,
  step integer not null default 0 check (step between 0 and 6),
  next_send_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'done', 'stopped')),
  source text not null check (source in ('email', 'book')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, trip_key)
);

create index if not exists trip_followups_due_idx on public.trip_followups (status, next_send_at);
alter table public.trip_followups enable row level security;
revoke all on public.trip_followups from anon, authenticated;

alter table public.email_sends drop constraint if exists email_sends_email_type_check;
alter table public.email_sends add constraint email_sends_email_type_check check (email_type in ('welcome', 'trip', 'monthly', 'arrival', 'followup'));

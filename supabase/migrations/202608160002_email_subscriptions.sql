create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  marketing_consent boolean not null default false,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed', 'bounced', 'complained')),
  unsubscribe_token_hash text not null,
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  last_welcome_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email),
  unique (unsubscribe_token_hash)
);

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  email_type text not null check (email_type in ('welcome', 'trip', 'monthly')),
  provider_message_id text,
  idempotency_key text not null unique,
  sent_at timestamptz not null default now()
);

create index if not exists email_subscribers_marketing_idx on public.email_subscribers (status, marketing_consent);
alter table public.email_subscribers enable row level security;
alter table public.email_sends enable row level security;
revoke all on public.email_subscribers from anon, authenticated;
revoke all on public.email_sends from anon, authenticated;

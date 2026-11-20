-- Feedback from the results page ("Was this a good match?") and the /feedback
-- page. No account, IP address or contact details are stored; messages are
-- scrubbed of emails and phone numbers before they are written.
create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('great_match', 'not_for_me', 'something_wrong', 'site')),
  topic text,
  page text,
  result_id text,
  destination_id text,
  algorithm_version text,
  reasons text[] not null default '{}',
  message text check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists site_feedback_created_idx on public.site_feedback (created_at desc);
alter table public.site_feedback enable row level security;
revoke all on public.site_feedback from anon, authenticated;

alter table public.recent_views drop constraint if exists recent_views_item_type_check;
alter table public.recent_views add constraint recent_views_item_type_check check (item_type in ('hotel', 'destination', 'trip'));

create table if not exists public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  search_key text not null,
  destination_id text,
  title text not null,
  search_data jsonb not null default '{}'::jsonb,
  searched_at timestamptz not null default now(),
  unique (user_id, search_key)
);
create index if not exists recent_searches_user_searched_idx on public.recent_searches (user_id, searched_at desc);
alter table public.recent_searches enable row level security;
create policy "Users can manage their recent searches" on public.recent_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.recent_searches from anon;
grant select, insert, update, delete on public.recent_searches to authenticated;

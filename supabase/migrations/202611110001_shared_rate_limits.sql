-- Shared request limits for public API routes (all server instances count
-- together). Keys are "route:hash" where the hash is a salted SHA-256 of the
-- client IP, so no address is stored. Only the service role may call it.

create table if not exists public.rate_limit_hits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

alter table public.rate_limit_hits enable row level security;
-- No policies: anon and authenticated users can't read or write it.

create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  total integer;
begin
  if p_key is null or length(p_key) > 120 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit request';
  end if;
  insert into public.rate_limit_hits (key, window_start, hits)
  values (p_key, current_window, 1)
  on conflict (key, window_start) do update set hits = public.rate_limit_hits.hits + 1
  returning hits into total;
  -- Occasional cleanup of finished windows.
  if random() < 0.01 then
    delete from public.rate_limit_hits where window_start < now() - interval '1 day';
  end if;
  return total;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer) to service_role;

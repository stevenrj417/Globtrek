alter table public.hotel_catalog
  add column if not exists google_place_id text,
  add column if not exists google_place_match_confidence numeric check (google_place_match_confidence between 0 and 1),
  add column if not exists google_place_matched_at timestamptz,
  add column if not exists google_place_verified boolean not null default false,
  add column if not exists google_place_match_evidence jsonb not null default '{}'::jsonb,
  add column if not exists google_place_photo_status text not null default 'not_checked' check (google_place_photo_status in ('not_checked','available','missing','error')),
  add column if not exists google_place_photo_checked_at timestamptz,
  add column if not exists google_place_error_code text,
  add column if not exists google_place_attempt_count integer not null default 0 check (google_place_attempt_count >= 0);

create unique index if not exists hotel_catalog_verified_google_place_unique_idx
  on public.hotel_catalog (google_place_id)
  where google_place_verified and active and google_place_id is not null;

create index if not exists hotel_catalog_google_places_queue_idx
  on public.hotel_catalog (google_place_verified, google_place_attempt_count, updated_at)
  where active and review_status <> 'rejected';

comment on column public.hotel_catalog.google_place_id is 'Durable Google Place ID. Photo resource names and other cache-restricted Places content must not be persisted.';
comment on column public.hotel_catalog.google_place_match_evidence is 'Globtrek-derived numeric match evidence only; no cached Google Places names, addresses, coordinates, or photo resource names.';

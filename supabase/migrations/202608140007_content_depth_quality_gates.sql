alter table public.hotel_catalog
  add column if not exists energy_score smallint check (energy_score between 0 and 100);

alter table public.activity_catalog
  add column if not exists energy_score smallint check (energy_score between 0 and 100);

create or replace view public.catalog_destination_coverage with (security_invoker = true) as
select d.id, d.city, d.country, d.knownness_score, d.unknownness_score, d.cost_level,
  d.verified_at, d.recommendation_ready,
  count(distinct h.id) filter (where h.active and h.review_status <> 'rejected') as hotel_count,
  count(distinct a.id) filter (where a.active and a.review_status <> 'rejected') as activity_count,
  count(distinct i.id) filter (where i.active) as image_count,
  count(distinct h.id) filter (
    where h.active and h.review_status <> 'rejected'
      and h.booking_com_property_url is not null and h.cj_tracking_url is not null
  ) as affiliate_hotel_count,
  count(distinct h.id) filter (
    where h.active and h.review_status <> 'rejected'
      and h.typical_nightly_low is not null and h.typical_nightly_high is not null
  ) as priced_hotel_count,
  count(distinct h.id) filter (
    where h.active and h.review_status <> 'rejected'
      and h.image_url is not null and h.image_source is not null
  ) as photographed_hotel_count,
  count(distinct a.id) filter (
    where a.active and a.review_status <> 'rejected' and a.booking_url is not null
  ) as bookable_activity_count,
  (
    d.verified_at is not null
    and d.verification_source is not null
    and d.latitude is not null and d.longitude is not null
    and d.primary_image_url is not null
    and d.cost_profile <> '{}'::jsonb
    and d.seasonality <> '{}'::jsonb
    and count(distinct h.id) filter (where h.active and h.review_status <> 'rejected') >= 9
    and count(distinct a.id) filter (where a.active and a.review_status <> 'rejected') >= 12
  ) as readiness_eligible
from public.travel_destinations d
left join public.hotel_catalog h on h.destination_id = d.id
left join public.activity_catalog a on a.destination_id = d.id
left join public.destination_images i on i.destination_id = d.id
where d.active
group by d.id;

drop view if exists public.catalog_health_summary;

create view public.catalog_health_summary with (security_invoker = true) as
select
  count(*) as total_destinations,
  count(*) filter (where recommendation_ready) as recommendation_ready_destinations,
  count(*) filter (where readiness_eligible) as readiness_eligible_destinations,
  count(*) filter (where recommendation_ready and not readiness_eligible) as readiness_gate_violations,
  count(*) filter (where hotel_count = 0) as destinations_with_0_hotels,
  count(*) filter (where hotel_count between 1 and 3) as destinations_with_1_3_hotels,
  count(*) filter (where hotel_count between 4 and 8) as destinations_with_4_8_hotels,
  count(*) filter (where hotel_count >= 9) as destinations_with_9_plus_hotels,
  count(*) filter (where activity_count = 0) as destinations_with_0_activities,
  count(*) filter (where activity_count between 1 and 5) as destinations_with_1_5_activities,
  count(*) filter (where activity_count between 6 and 11) as destinations_with_6_11_activities,
  count(*) filter (where activity_count >= 12) as destinations_with_12_plus_activities,
  count(*) filter (where image_count = 0) as destinations_missing_images,
  count(*) filter (where image_count >= 3) as destinations_with_3_plus_images,
  sum(affiliate_hotel_count) as hotels_with_affiliate_links,
  sum(priced_hotel_count) as hotels_with_price_estimates,
  sum(photographed_hotel_count) as hotels_with_property_photos,
  sum(bookable_activity_count) as activities_with_booking_links
from public.catalog_destination_coverage;

grant select on public.catalog_destination_coverage, public.catalog_health_summary to authenticated;
revoke all on public.catalog_destination_coverage, public.catalog_health_summary from anon;

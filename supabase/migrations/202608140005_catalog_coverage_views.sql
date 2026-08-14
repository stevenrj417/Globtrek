create or replace view public.catalog_destination_coverage with (security_invoker = true) as
select d.id, d.city, d.country, d.knownness_score, d.unknownness_score, d.cost_level, d.verified_at,
  d.recommendation_ready,
  count(distinct h.id) filter (where h.active and h.review_status <> 'rejected') as hotel_count,
  count(distinct a.id) filter (where a.active and a.review_status <> 'rejected') as activity_count,
  count(distinct i.id) filter (where i.active) as image_count
from public.travel_destinations d
left join public.hotel_catalog h on h.destination_id = d.id
left join public.activity_catalog a on a.destination_id = d.id
left join public.destination_images i on i.destination_id = d.id
where d.active
group by d.id;

create or replace view public.catalog_health_summary with (security_invoker = true) as
select
  count(*) as total_destinations,
  count(*) filter (where hotel_count = 0) as destinations_with_0_hotels,
  count(*) filter (where hotel_count between 1 and 5) as destinations_with_1_5_hotels,
  count(*) filter (where hotel_count between 6 and 11) as destinations_with_6_11_hotels,
  count(*) filter (where hotel_count >= 12) as destinations_with_12_plus_hotels,
  count(*) filter (where activity_count = 0) as destinations_with_0_activities,
  count(*) filter (where activity_count between 1 and 9) as destinations_with_1_9_activities,
  count(*) filter (where activity_count between 10 and 19) as destinations_with_10_19_activities,
  count(*) filter (where activity_count >= 20) as destinations_with_20_plus_activities,
  count(*) filter (where image_count = 0) as destinations_missing_images,
  count(*) filter (where recommendation_ready) as recommendation_ready_destinations
from public.catalog_destination_coverage;

grant select on public.catalog_destination_coverage, public.catalog_health_summary to authenticated;
revoke all on public.catalog_destination_coverage, public.catalog_health_summary from anon;

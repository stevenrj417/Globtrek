create or replace view public.destination_hotel_coverage as
select
  destination.id as destination_id,
  destination.city,
  count(hotel.id) filter (where hotel.active) as total_hotels,
  count(hotel.id) filter (where hotel.active and hotel.review_status = 'verified' and hotel.recommendation_ready) as recommendation_ready_hotels,
  count(hotel.id) filter (where hotel.active and hotel.photo_count >= 3) as hotels_with_three_photos,
  count(hotel.id) filter (where hotel.active and hotel.photo_count >= 5) as hotels_with_five_photos,
  count(hotel.id) filter (where hotel.active and hotel.provider_link_verified) as hotels_with_verified_provider_links,
  greatest(0, 9 - count(hotel.id) filter (where hotel.active and hotel.review_status = 'verified' and hotel.recommendation_ready)) as recommendation_ready_shortfall
from public.travel_destinations destination
left join public.hotel_catalog hotel on hotel.destination_id = destination.id
where destination.active
group by destination.id, destination.city;

create or replace view public.hotel_matrix_coverage as
with matrix(price_tier, vibe_tier) as (
  values ('value'::text, 'calm'::text), ('value', 'balanced'), ('value', 'energetic'),
         ('midrange', 'calm'), ('midrange', 'balanced'), ('midrange', 'energetic'),
         ('premium', 'calm'), ('premium', 'balanced'), ('premium', 'energetic')
), classified as (
  select destination_id, price_tier,
    case
      when coalesce(calm_score, relaxation_score, 0) >= 70 and coalesce(calm_score, relaxation_score, 0) > greatest(coalesce(energy_score, 0), coalesce(social_score, 0)) then 'calm'
      when greatest(coalesce(energy_score, 0), coalesce(social_score, 0)) >= 70 and greatest(coalesce(energy_score, 0), coalesce(social_score, 0)) > coalesce(calm_score, relaxation_score, 0) then 'energetic'
      else 'balanced'
    end as vibe_tier
  from public.hotel_catalog
  where active and review_status = 'verified' and recommendation_ready
)
select destination.id as destination_id, matrix.price_tier, matrix.vibe_tier,
  count(classified.destination_id) as ready_count,
  1 as target_count,
  greatest(0, 1 - count(classified.destination_id)) as shortfall
from public.travel_destinations destination
cross join matrix
left join classified on classified.destination_id = destination.id and classified.price_tier = matrix.price_tier and classified.vibe_tier = matrix.vibe_tier
where destination.active
group by destination.id, matrix.price_tier, matrix.vibe_tier;

grant select on public.destination_hotel_coverage to anon, authenticated;
grant select on public.hotel_matrix_coverage to anon, authenticated;

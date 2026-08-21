alter table public.travel_destinations
  add column if not exists canonical_name text,
  add column if not exists destination_type text check (destination_type in ('city','island','region','country','route','nature_area','resort_area','multi_stop')),
  add column if not exists primary_airport_codes text[] not null default '{}',
  add column if not exists hotel_search_centers jsonb not null default '[]'::jsonb,
  add column if not exists hotel_search_aliases text[] not null default '{}',
  add column if not exists nearby_hotel_areas text[] not null default '{}',
  add column if not exists exclude_hotel_areas text[] not null default '{}',
  add column if not exists hotel_search_radius_km numeric check (hotel_search_radius_km > 0),
  add column if not exists hotel_neighborhood_profiles jsonb not null default '[]'::jsonb,
  add column if not exists typical_cost_level text check (typical_cost_level in ('value','moderate','expensive','very_expensive')),
  add column if not exists supports_value boolean,
  add column if not exists supports_midrange boolean,
  add column if not exists supports_premium boolean,
  add column if not exists cost_flexibility smallint check (cost_flexibility between 0 and 100),
  add column if not exists cost_model_review_status text not null default 'baseline_requires_editorial_review',
  add column if not exists production_ready boolean not null default false;

alter table public.hotel_catalog
  add column if not exists neighborhood text,
  add column if not exists property_type text,
  add column if not exists price_tier text check (price_tier in ('value','midrange','premium')),
  add column if not exists calm_score smallint check (calm_score between 0 and 100),
  add column if not exists social_score smallint check (social_score between 0 and 100),
  add column if not exists business_score smallint check (business_score between 0 and 100),
  add column if not exists review_count integer check (review_count >= 0),
  add column if not exists google_place_id text,
  add column if not exists identity_confidence numeric check (identity_confidence between 0 and 1),
  add column if not exists location_confidence numeric check (location_confidence between 0 and 1),
  add column if not exists provider_link_verified boolean not null default false,
  add column if not exists photo_count integer not null default 0 check (photo_count >= 0),
  add column if not exists data_completeness_score smallint not null default 0 check (data_completeness_score between 0 and 100),
  add column if not exists recommendation_ready boolean not null default false;

create index if not exists hotel_catalog_recommendation_pool_idx
  on public.hotel_catalog (destination_id, price_tier, recommendation_ready)
  where active and review_status = 'verified';

update public.travel_destinations set active = false, production_ready = false
where id = 'marrakesh-32e08';

insert into public.travel_destinations
  (id, city, canonical_name, region, country, currency, recognition_score, knownness_score, unknownness_score, latitude, longitude, nearest_airport, primary_airport_codes, cost_level, cost_profile, cost_source, cost_confidence, cost_last_updated, seasonality, climate_profile, trip_length_fit, accessibility_profile, traveler_type_tags, interest_tags, aliases, search_terms, primary_image_url, image_source, image_license_metadata, verified_at, verification_source, destination_type, hotel_search_centers, hotel_search_aliases, hotel_search_radius_km, typical_cost_level, supports_value, supports_midrange, supports_premium, cost_flexibility, cost_model_review_status, recommendation_ready, production_ready, active)
select 'wadi-musa-67402','Wadi Musa','Wadi Musa','Ma''an Governorate','Jordan','USD',42,42,58,30.32,35.47833333,'AQJ',array['AQJ'],'moderate',
  '{"typicalHotelNightLow":110,"typicalHotelNightHigh":260,"foodDailyLow":45,"foodDailyHigh":100,"activitiesDailyLow":20,"activitiesDailyHigh":80,"transportDailyLow":12,"transportDailyHigh":45,"source":"globtrek_editorial_cost_tier_v1","confidence":0.3,"lastUpdated":"2026-08-21"}'::jsonb,
  'globtrek_editorial_cost_tier_v1',0.3,'2026-08-21','{"hemisphere":"northern","source":"hemisphere_baseline","confidence":0.35,"note":"Destination-specific weather and events require editorial review."}'::jsonb,'{"zone":"warm_temperate","source":"latitude_zone_model","confidence":0.42}'::jsonb,'{"minimumNights":3,"typicalNights":7,"maximumNights":14,"confidence":0.35}'::jsonb,'{"nearestAirport":"AQJ","transferDetailsVerified":false}'::jsonb,array['couple','family','solo'],array['culture','history','architecture','hiking'],array['Wadi Mousa','Petra gateway'],array['Wadi Musa','Petra','Ma''an Governorate','Jordan'],
  'https://upload.wikimedia.org/wikipedia/commons/7/78/Wadi_Musa%2C_Jordan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original','Wikimedia Commons',
  '{"imageUrl":"https://upload.wikimedia.org/wikipedia/commons/7/78/Wadi_Musa%2C_Jordan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original","sourcePageUrl":"https://commons.wikimedia.org/wiki/File:Wadi_Musa,_Jordan.jpg","sourceName":"Wikimedia Commons","author":"Bernard Gagnon","licenseName":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0","attributionText":"Own work","width":2442,"height":1587,"verifiedAt":"2026-08-21T18:27:59.057Z","isHero":true}'::jsonb,
  now(),'https://en.wikipedia.org/wiki/Wadi_Musa','city','["Wadi Musa"]'::jsonb,array['Wadi Mousa','Petra gateway','Wadi Musa'],15,'moderate',true,true,true,80,'baseline_requires_editorial_review',false,true,true
on conflict (id) do update set active = true, production_ready = excluded.production_ready, updated_at = now();

update public.travel_destinations set
  canonical_name = coalesce(canonical_name, city),
  destination_type = coalesce(destination_type, 'city'),
  primary_airport_codes = case when cardinality(primary_airport_codes) = 0 and nearest_airport is not null then array[nearest_airport] else primary_airport_codes end,
  hotel_search_centers = case when hotel_search_centers = '[]'::jsonb then jsonb_build_array(city) else hotel_search_centers end,
  hotel_search_aliases = case when cardinality(hotel_search_aliases) = 0 then aliases || array[city] else hotel_search_aliases end,
  hotel_search_radius_km = coalesce(hotel_search_radius_km, 15),
  typical_cost_level = coalesce(typical_cost_level, case cost_level when 'affordable' then 'value' when 'moderate' then 'moderate' when 'upscale' then 'expensive' when 'luxury' then 'very_expensive' end),
  supports_value = coalesce(supports_value, cost_level is distinct from 'luxury'),
  supports_midrange = coalesce(supports_midrange, true),
  supports_premium = coalesce(supports_premium, true),
  cost_flexibility = coalesce(cost_flexibility, case cost_level when 'luxury' then 35 when 'upscale' then 65 else 80 end),
  production_ready = active and primary_image_url is not null and nearest_airport is not null
where active;

insert into public.destination_images (destination_id,image_url,source_page_url,source_name,author,license_name,license_url,attribution_text,width,height,is_hero,verified_at,active)
values ('wadi-musa-67402','https://upload.wikimedia.org/wikipedia/commons/7/78/Wadi_Musa%2C_Jordan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original','https://commons.wikimedia.org/wiki/File:Wadi_Musa,_Jordan.jpg','Wikimedia Commons','Bernard Gagnon','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0','Own work',2442,1587,true,'2026-08-21T18:27:59.057Z',true)
on conflict (destination_id,image_url) do update set active = true, is_hero = true, verified_at = excluded.verified_at;

update public.travel_destinations set destination_type = 'island', hotel_search_radius_km = 60 where upper(city) in
  ('BALI','MALDIVES','MAUI','SÃO MIGUEL ISLAND','YAKUSHIMA','JEJU ISLAND','MENORCA','ISLE OF SKYE','SEYCHELLES','BORA BORA','GALÁPAGOS ISLANDS','PORTO SANTO','TENERIFE','LANZAROTE','SARDINIA','CRETE','MAURITIUS','NOSY BE');
update public.travel_destinations set destination_type = 'region', hotel_search_radius_km = 90 where upper(city) in
  ('PROVENCE','AMALFI COAST','PATAGONIA','NEW ZEALAND SOUTH ISLAND','LOFOTEN','LAKE COMO','NORMANDY','CAPPADOCIA');
update public.travel_destinations set destination_type = 'country', hotel_search_radius_km = 250 where upper(city) in ('COSTA RICA','FIJI');
update public.travel_destinations set destination_type = 'route', hotel_search_radius_km = 50 where upper(city) = 'ICELAND RING ROAD';
update public.travel_destinations set destination_type = 'nature_area', hotel_search_radius_km = 80 where upper(city) in ('BANFF','ATACAMA DESERT','SERENGETI NATIONAL PARK','SOSSUSVLEI','METEORA');
update public.travel_destinations set destination_type = 'resort_area', hotel_search_radius_km = 35 where upper(city) in
  ('TULUM','CANCÚN','PHUKET','ST. BARTS','ASPEN','PALM SPRINGS','PUERTO VALLARTA','MONTEGO BAY','PUNTA DEL ESTE','CHAMONIX','INTERLAKEN','ZERMATT','ALULA');
update public.travel_destinations set destination_type = 'multi_stop', hotel_search_radius_km = 80 where upper(city) in ('NAIROBI & THE MAASAI MARA','TAHITI & MOOREA','VICTORIA FALLS');

update public.travel_destinations set hotel_search_centers = case upper(city)
  when 'AMALFI COAST' then '["Positano","Amalfi","Ravello","Praiano"]'::jsonb
  when 'BALI' then '["Ubud","Seminyak","Canggu","Nusa Dua","Uluwatu"]'::jsonb
  when 'BANFF' then '["Banff","Lake Louise","Canmore"]'::jsonb
  when 'COSTA RICA' then '["Arenal","Papagayo Peninsula","Manuel Antonio","Osa Peninsula","Nicoya Peninsula"]'::jsonb
  when 'ICELAND RING ROAD' then '["Reykjavík","Vík","Höfn","Egilsstaðir","Akureyri","Mývatn"]'::jsonb
  when 'MALDIVES' then '["North Malé Atoll","South Malé Atoll","Baa Atoll","Ari Atoll","Laamu Atoll"]'::jsonb
  when 'MAUI' then '["Wailea","Kāʻanapali","Kapalua","Lāhainā","Hāna"]'::jsonb
  when 'NAIROBI & THE MAASAI MARA' then '["Nairobi","Maasai Mara National Reserve","Mara North Conservancy","Olare Motorogi Conservancy"]'::jsonb
  when 'NEW ZEALAND SOUTH ISLAND' then '["Queenstown","Wānaka","Christchurch","Aoraki / Mount Cook","Te Anau"]'::jsonb
  when 'PATAGONIA' then '["El Calafate","El Chaltén","Puerto Natales","Torres del Paine"]'::jsonb
  when 'PROVENCE' then '["Avignon","Aix-en-Provence","Gordes","Saint-Rémy-de-Provence","Luberon"]'::jsonb
  when 'SERENGETI NATIONAL PARK' then '["Central Serengeti","Northern Serengeti","Western Corridor","Ngorongoro gateway"]'::jsonb
  when 'TAHITI & MOOREA' then '["Papeete","Punaauia","Teva I Uta","Maharepa","Haapiti"]'::jsonb
  when 'VICTORIA FALLS' then '["Victoria Falls, Zimbabwe","Livingstone, Zambia"]'::jsonb
  else hotel_search_centers end
where active;

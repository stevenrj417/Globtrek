insert into public.activity_catalog (
  destination_id, name, normalized_name, category, location, provider,
  verified_at, verification_source, review_status, active
) values
('KIX','Kiyomizu-dera Temple','kiyomizu dera temple','culture','Higashiyama, Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/destinations/kiyomizudera-temple/','verified',true),
('KIX','Fushimi Inari Taisha Shrine','fushimi inari taisha shrine','culture','Fushimi, Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/destinations/fushimi-inaritaisha-shrine/','verified',true),
('KIX','Nijo-jo Castle','nijo jo castle','architecture','Central Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/destinations/nijojo-castle/','verified',true),
('KIX','Kyoto Imperial Palace','kyoto imperial palace','culture','Kyoto Gyoen, Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/destinations/kyoto-imperial-palace/','verified',true),
('KIX','Kyoto Nishiki Food Market','kyoto nishiki food market','food','Central Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/destinations/kyoto-nishiki-food-market/','verified',true),
('KIX','Kyoto Trail: Higashiyama Course','kyoto trail higashiyama course','nature','Eastern Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/destinations/the-kyoto-trail-higashiyama-course/','verified',true),
('KIX','Gion and Kiyomizu Walking District','gion and kiyomizu walking district','local','Gion and Higashiyama, Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/areas/gion-kiyomizu/','verified',true),
('KIX','Saga and Arashiyama','saga and arashiyama','nature','Western Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/getting-around/','verified',true),
('KIX','Kinkaku-ji and Kinugasa','kinkaku ji and kinugasa','architecture','Northern Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/getting-around/','verified',true),
('KIX','Ginkaku-ji and Philosopher''s Path','ginkaku ji and philosopher s path','culture','Eastern Kyoto','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/getting-around/','verified',true),
('KIX','Kyoto Tea Ceremony Experience','kyoto tea ceremony experience','food','Kyoto City','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/experiences/','verified',true),
('KIX','Kyoto Culinary Experience','kyoto culinary experience','food','Kyoto City','editorial','2026-08-16T00:00:00Z','https://kyoto.travel/en/food-and-drink/','verified',true)
on conflict (destination_id, normalized_name, provider) do update set
  category = excluded.category,
  location = excluded.location,
  verified_at = excluded.verified_at,
  verification_source = excluded.verification_source,
  review_status = excluded.review_status,
  active = excluded.active,
  updated_at = now();

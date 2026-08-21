import { readFile, writeFile } from "node:fs/promises";
import { normalizeName } from "./catalog-tools.mjs";

const q = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const a = (values) => `array[${(values || []).map(q).join(",")}]::text[]`;
const report = JSON.parse(await readFile(process.argv[2] || "scripts/hotels/google-place-details.json", "utf8"));
const statements = report.records.map((item) => `update public.hotel_catalog set latitude=${item.latitude},longitude=${item.longitude},google_place_id=${q(item.googlePlaceId)},identity_confidence=${item.identityConfidence},location_confidence=${item.locationConfidence},provider_link_verified=${item.providerLinkVerified},photo_count=${item.photoCount},review_rating=${item.rating ?? "null"},review_count=${item.reviewCount ?? "null"},amenity_tags=${a(item.amenityTags)},property_type=${q(item.propertyType)},data_completeness_score=${item.dataCompletenessScore},recommendation_ready=${item.recommendationReady},review_status=${q(item.recommendationReady ? "verified" : "needs_review")},verified_at=${q(item.verifiedAt)},verification_source=${q(item.verificationSource)},updated_at=now() where destination_id=${q(item.hotel.destinationId)} and normalized_name=${q(normalizeName(item.hotel.name))} and provider=${q(item.hotel.provider)};`);
const output = process.argv[3] || "supabase/migrations/202608210002_verified_hotel_intelligence.sql";
await writeFile(output, `${statements.join("\n")}\n`);
console.log(JSON.stringify({ updates: statements.length, recommendationReady: report.records.filter((item) => item.recommendationReady).length, output }, null, 2));

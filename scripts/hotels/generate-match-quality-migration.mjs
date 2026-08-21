import { readFile, writeFile } from "node:fs/promises";
import { normalizeName } from "./catalog-tools.mjs";

const q = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const report = JSON.parse(await readFile(process.argv[2] || "scripts/hotels/google-places-results.json", "utf8"));
const statements = report.results.map((item) => {
  const providerLinkVerified = Boolean(item.hotel.bookingComPropertyUrl);
  const completeness = (item.verified ? 20 : 0) + (providerLinkVerified ? 20 : 0) + (item.usablePhotoCount >= 3 ? 15 : item.usablePhotoCount ? 8 : 0);
  return `update public.hotel_catalog set google_place_id=${q(item.verified ? item.googlePlaceId : null)},identity_confidence=${item.confidence ?? "null"},provider_link_verified=${providerLinkVerified},photo_count=${item.usablePhotoCount || 0},data_completeness_score=${completeness},recommendation_ready=false,updated_at=now() where destination_id=${q(item.hotel.destinationId)} and normalized_name=${q(normalizeName(item.hotel.name))} and provider=${q(item.hotel.provider)};`;
});
const output = process.argv[3] || "supabase/migrations/202608210002_hotel_match_quality_baseline.sql";
await writeFile(output, `${statements.join("\n")}\n`);
console.log(JSON.stringify({ updates: statements.length, verifiedMatches: report.results.filter((item) => item.verified).length, recommendationReady: 0, output }, null, 2));

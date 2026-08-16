import { readFile, writeFile } from "node:fs/promises";

const q = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const j = (value) => `${q(JSON.stringify(value || {}))}::jsonb`;
const input = process.argv[2] || "scripts/hotels/google-places-results.json";
const output = process.argv[3] || "supabase/migrations/202608150002_google_places_hotel_matches.sql";
const report = JSON.parse(await readFile(input, "utf8"));

const statements = report.results.map((result) => {
  const verified = result.verified && result.googlePlaceId;
  return `update public.hotel_catalog set google_place_id=${q(verified ? result.googlePlaceId : null)},google_place_match_confidence=${result.confidence == null ? "null" : Number(result.confidence)},google_place_matched_at=${q(result.checkedAt)},google_place_verified=${verified ? "true" : "false"},google_place_match_evidence=${j(result.evidence)},google_place_photo_status=${q(result.photoStatus)},google_place_photo_checked_at=${q(result.checkedAt)},google_place_error_code=${q(result.errorCode)},google_place_attempt_count=google_place_attempt_count+1,updated_at=now() where destination_id=${q(result.hotel.destinationId)} and normalized_name=${q(result.hotel.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())} and provider=${q(result.hotel.provider)};`;
});

await writeFile(output, `${statements.join("\n")}\n`);
console.log(JSON.stringify({ updates: statements.length, verified: report.summary.matched, output }, null, 2));

import { readFile } from "node:fs/promises";
import { normalizeName } from "./catalog-tools.mjs";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }

await loadEnvironment(option("--env", ".env.production.local"));
const apply = process.argv.includes("--apply");
const report = JSON.parse(await readFile(option("--input", "scripts/hotels/google-candidate-audit.json"), "utf8"));
const root = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
const existing = [];
for (let offset = 0; ; offset += 1000) {
  const existingResponse = await fetch(`${root}/hotel_catalog?select=id,destination_id,normalized_name,provider,google_place_id&offset=${offset}&limit=1000`, { headers });
  if (!existingResponse.ok) throw new Error(`existing_catalog_${existingResponse.status}`);
  const page = await existingResponse.json();
  existing.push(...page);
  if (page.length < 1000) break;
}
const existingPlaceIds = new Set(existing.map((item) => item.google_place_id).filter(Boolean));
const existingKeys = new Set(existing.map((item) => `${item.destination_id}|${item.normalized_name}|${item.provider}`));
const candidates = report.accepted.filter((item) => !existingPlaceIds.has(item.googlePlaceId) && !existingKeys.has(`${item.destinationId}|${normalizeName(item.name)}|google_places`));
const deduplicated = new Map();
for (const item of candidates) {
  const key = `${item.destinationId}|${normalizeName(item.name)}|google_places`;
  const current = deduplicated.get(key);
  if (!current || Number(item.rating || 0) * Math.log10(Math.max(1, Number(item.reviewCount || 0))) > Number(current.rating || 0) * Math.log10(Math.max(1, Number(current.reviewCount || 0)))) deduplicated.set(key, item);
}
const rows = [...deduplicated.values()].map((item) => ({
  destination_id: item.destinationId, name: item.name, normalized_name: normalizeName(item.name), city: item.city, country: item.country,
  latitude: item.latitude, longitude: item.longitude, neighborhood: item.searchCenter || null, property_type: item.primaryType || "hotel",
  provider: "google_places", provider_property_id: item.googlePlaceId, booking_com_property_url: null, cj_tracking_url: null,
  review_rating: item.rating, review_count: item.reviewCount, google_place_id: item.googlePlaceId, google_place_match_confidence: 1,
  google_place_matched_at: item.verifiedAt, google_place_verified: true, google_place_match_evidence: { source: "google_places_text_search", searchCenter: item.searchCenter, distanceMeters: item.distanceMeters },
  google_place_photo_status: item.photoCount > 0 ? "available" : "missing", google_place_photo_checked_at: item.verifiedAt,
  identity_confidence: 1, location_confidence: item.locationConfidence, provider_link_verified: false, photo_count: item.photoCount,
  data_completeness_score: 65, recommendation_ready: false, review_status: "needs_review", verified_at: item.verifiedAt,
  verification_source: item.verificationSource, active: true,
}));
const summary = { audited: report.accepted.length, existingCatalogRows: existing.length, existingPlaceIdsSkipped: report.accepted.filter((item) => existingPlaceIds.has(item.googlePlaceId)).length, normalizedNameCollisionsSkipped: candidates.length - rows.length, newRows: rows.length, applied: 0, dryRun: !apply };
if (apply) {
  for (let index = 0; index < rows.length; index += 100) {
    const batch = rows.slice(index, index + 100);
    const response = await fetch(`${root}/hotel_catalog?on_conflict=destination_id,normalized_name,provider`, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(batch) });
    if (!response.ok) throw new Error(`hotel_import_${response.status}:${(await response.text()).slice(0, 300)}`);
    summary.applied += batch.length;
    console.log(`${summary.applied}/${rows.length}`);
  }
}
console.log(JSON.stringify(summary, null, 2));

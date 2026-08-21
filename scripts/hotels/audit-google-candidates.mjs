import { readFile, writeFile } from "node:fs/promises";
import { distanceMeters } from "../../app/lib/google-places/GooglePlacesHotelProvider.js";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
function normalize(value) { return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }

const COUNTRY_ALIASES = {
  "united states": ["united states", "usa", "us"], "united kingdom": ["united kingdom", "uk", "england", "scotland", "wales", "northern ireland"],
  "united arab emirates": ["united arab emirates", "uae"], "south korea": ["south korea", "republic of korea", "korea"], "czech republic": ["czech republic", "czechia"],
  "ivory coast": ["ivory coast", "cote d ivoire"], "laos": ["laos", "lao people s democratic republic"], "bolivia": ["bolivia", "plurinational state of bolivia"],
  "tanzania": ["tanzania", "united republic of tanzania"], "russia": ["russia", "russian federation"], "vatican city": ["vatican city", "vatican"],
  "turkey": ["turkey", "turkiye"], "china": ["china", "hong kong"], "france": ["france", "st barthelemy", "saint barthelemy"],
  "argentina chile": ["argentina", "chile"],
};
const BROAD_TYPES = new Set(["country", "route", "region", "multi_stop", "island", "nature_area"]);
const TYPE_PRIORITY = { city: 6, resort_area: 5, nature_area: 4, island: 3, multi_stop: 2, route: 1, region: 1, country: 0 };

function countryMatches(record) {
  const address = ` ${normalize(record.address)} `;
  const country = normalize(record.country);
  return (COUNTRY_ALIASES[country] || [country]).some((alias) => address.includes(normalize(alias)));
}

await loadEnvironment(option("--env", ".env.production.local"));
const input = JSON.parse(await readFile(option("--input", "scripts/hotels/google-discovered-candidates.json"), "utf8"));
const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/travel_destinations?select=id,city,country,latitude,longitude,destination_type,hotel_search_radius_km&active=eq.true`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } });
if (!response.ok) throw new Error(`destination_catalog_${response.status}`);
const destinations = new Map((await response.json()).map((item) => [item.id, item]));
const duplicateGroups = new Map();
for (const record of input.records) { if (!duplicateGroups.has(record.googlePlaceId)) duplicateGroups.set(record.googlePlaceId, []); duplicateGroups.get(record.googlePlaceId).push(record); }
const duplicateOwner = new Map([...duplicateGroups].map(([placeId, records]) => [placeId, [...records].sort((a, b) => Number(countryMatches(b)) - Number(countryMatches(a)) || (TYPE_PRIORITY[destinations.get(b.destinationId)?.destination_type] || 0) - (TYPE_PRIORITY[destinations.get(a.destinationId)?.destination_type] || 0))[0].destinationId]));
const report = { generatedAt: new Date().toISOString(), sourceRecords: input.records.length, accepted: [], rejected: [] };
for (const record of input.records) {
  const destination = destinations.get(record.destinationId);
  const distance = destination ? distanceMeters(destination, record) : null;
  const radiusKm = Math.max(30, Number(destination?.hotel_search_radius_km || 30));
  const reasons = [];
  if (!destination) reasons.push("destination_missing");
  if (!countryMatches(record) && (distance == null || distance > radiusKm * 1000)) reasons.push("country_mismatch");
  if (duplicateOwner.get(record.googlePlaceId) !== record.destinationId) reasons.push("duplicate_place_assigned_to_narrower_destination");
  if (distance != null && !BROAD_TYPES.has(destination?.destination_type) && distance > radiusKm * 1000) reasons.push("outside_search_radius");
  if (!record.googlePlaceVerified || !record.googlePlaceId) reasons.push("identity_unverified");
  const audited = { ...record, distanceMeters: distance == null ? null : Math.round(distance), locationConfidence: distance != null ? (distance <= radiusKm * 1000 ? 1 : 0) : 0.85, identityConfidence: 1 };
  (reasons.length ? report.rejected : report.accepted).push(reasons.length ? { ...audited, reasons } : audited);
}
report.summary = { accepted: report.accepted.length, rejected: report.rejected.length, destinationsWithAcceptedHotels: new Set(report.accepted.map((item) => item.destinationId)).size, duplicateAssociationsRejected: report.rejected.filter((item) => item.reasons.includes("duplicate_place_assigned_to_narrower_destination")).length, countryMismatches: report.rejected.filter((item) => item.reasons.includes("country_mismatch")).length, radiusMismatches: report.rejected.filter((item) => item.reasons.includes("outside_search_radius")).length };
await writeFile(option("--output", "scripts/hotels/google-candidate-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));

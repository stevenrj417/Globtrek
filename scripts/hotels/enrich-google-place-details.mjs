import { readFile, writeFile } from "node:fs/promises";
import { GooglePlacesHotelProvider } from "../../app/lib/google-places/GooglePlacesHotelProvider.js";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }

function amenities(place) {
  const values = [];
  if (place.allowsDogs === true) values.push("pet-friendly");
  if (place.goodForChildren === true) values.push("family-friendly");
  if (place.servesBreakfast === true) values.push("breakfast");
  if (place.servesBrunch === true) values.push("brunch");
  if (place.servesLunch === true) values.push("lunch");
  if (place.servesDinner === true) values.push("dinner");
  if (place.accessibilityOptions?.wheelchairAccessibleEntrance === true) values.push("wheelchair-accessible entrance");
  if (place.accessibilityOptions?.wheelchairAccessibleParking === true) values.push("wheelchair-accessible parking");
  if (place.parkingOptions?.freeParkingLot === true) values.push("free parking");
  if (place.parkingOptions?.paidParkingLot === true || place.parkingOptions?.paidGarageParking === true) values.push("paid parking");
  if (place.parkingOptions?.valetParking === true) values.push("valet parking");
  return [...new Set(values)];
}

function enrich(match, place) {
  const photoCount = Math.min(5, Array.isArray(place.photos) ? place.photos.length : 0);
  const amenityTags = amenities(place);
  const rating = Number.isFinite(Number(place.rating)) ? Number(place.rating) : null;
  const reviewCount = Number.isInteger(place.userRatingCount) ? place.userRatingCount : null;
  const latitude = Number.isFinite(Number(place.location?.latitude)) ? Number(place.location.latitude) : null;
  const longitude = Number.isFinite(Number(place.location?.longitude)) ? Number(place.location.longitude) : null;
  const providerLinkVerified = Boolean(match.hotel.bookingComPropertyUrl);
  const dataCompletenessScore = (match.confidence >= 0.82 ? 20 : 0) + (latitude != null && longitude != null ? 20 : 0) + (providerLinkVerified ? 20 : 0) + (photoCount >= 3 ? 15 : photoCount ? 8 : 0) + (rating != null && reviewCount != null ? 15 : 0) + (amenityTags.length ? 10 : 0);
  const recommendationReady = match.verified === true && match.confidence >= 0.82 && latitude != null && longitude != null && providerLinkVerified && photoCount >= 1 && dataCompletenessScore >= 70;
  return { key: match.key, hotel: match.hotel, googlePlaceId: match.googlePlaceId, identityConfidence: match.confidence, locationConfidence: 1, latitude, longitude, formattedAddress: place.formattedAddress || null, rating, reviewCount, amenityTags, propertyType: (place.types || []).find((type) => ["hotel", "resort_hotel", "motel", "bed_and_breakfast", "guest_house", "hostel"].includes(type)) || "lodging", photoCount, providerLinkVerified, dataCompletenessScore, recommendationReady, verifiedAt: new Date().toISOString(), verificationSource: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${match.googlePlaceId}` };
}

await loadEnvironment(option("--env", ".env.production.local"));
const matches = JSON.parse(await readFile(option("--input", "scripts/hotels/google-places-results.json"), "utf8")).results.filter((item) => item.verified && item.googlePlaceId);
const output = option("--output", "scripts/hotels/google-place-details.json");
let report = { generatedAt: null, records: [], failures: [] };
if (process.argv.includes("--resume")) { try { report = JSON.parse(await readFile(output, "utf8")); } catch {} }
const completed = new Set([...report.records, ...report.failures].map((item) => item.key));
const provider = new GooglePlacesHotelProvider();
const limit = Math.max(1, Number(option("--limit", matches.length)));
for (const match of matches.filter((item) => !completed.has(item.key)).slice(0, limit)) {
  try { report.records.push(enrich(match, await provider.getPlaceIntelligence(match.googlePlaceId))); }
  catch (error) { report.failures.push({ key: match.key, hotel: match.hotel, error: error.code || error.message, status: error.status || null, detail: error.message }); }
  report.generatedAt = new Date().toISOString();
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${report.records.length + report.failures.length}/${matches.length} ${report.records.at(-1)?.hotel?.name || report.failures.at(-1)?.hotel?.name}`);
}
console.log(JSON.stringify({ matchedSource: matches.length, enriched: report.records.length, recommendationReady: report.records.filter((item) => item.recommendationReady).length, failures: report.failures.length, output }, null, 2));

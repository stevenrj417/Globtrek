import { readFile, writeFile } from "node:fs/promises";
import { destinations } from "../../app/data/destinations.js";
import { hotelCatalog } from "../../app/data/hotels.js";
import { GooglePlacesHotelProvider } from "../../app/lib/google-places/GooglePlacesHotelProvider.js";
import { normalizeName } from "./catalog-tools.mjs";

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function loadLocalEnvironment(path = ".env.production.local") {
  try {
    const text = await readFile(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      const value = match[2].trim().replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = value.replaceAll("\\n", "\n");
    }
  } catch {}
}

function sourceRecords() {
  const destinationMap = new Map(destinations.map((destination) => [destination.city, destination]));
  return Object.entries(hotelCatalog).flatMap(([city, hotels]) => {
    const destination = destinationMap.get(city);
    if (!destination) return [];
    return hotels.map((hotel) => ({
      destinationId: destination.airport,
      name: typeof hotel === "string" ? hotel : hotel.name,
      city: destination.city,
      country: destination.country,
      bookingComPropertyUrl: typeof hotel === "string" ? null : hotel.bookingUrl,
      provider: "booking_com_cj",
    }));
  });
}

function recordKey(record) { return `${record.destinationId}|${normalizeName(record.name)}|${record.provider}`; }

export async function processGooglePlacesBatch({ records, provider, prior = [], limit = records.length, delayMs = 125, onProgress = () => {} }) {
  const completed = new Map(prior.map((result) => [result.key, result]));
  const usedPlaceIds = new Map(prior.filter((result) => result.verified && result.googlePlaceId).map((result) => [result.googlePlaceId, result.key]));
  const queue = records.filter((record) => !completed.has(recordKey(record))).slice(0, limit);
  let apiFailures = 0;
  let duplicatePlaceIds = 0;
  for (let index = 0; index < queue.length; index += 1) {
    const hotel = queue[index];
    const key = recordKey(hotel);
    const checkedAt = new Date().toISOString();
    let result;
    try {
      const match = await provider.matchHotel(hotel);
      if (match.verified && usedPlaceIds.has(match.placeId) && usedPlaceIds.get(match.placeId) !== key) {
        duplicatePlaceIds += 1;
        result = { key, hotel, status: "duplicate_place_id", verified: false, needsReview: true, googlePlaceId: null, confidence: match.confidence, evidence: match.evidence, photoStatus: "not_checked", usablePhotoCount: 0, attributionRequired: false, errorCode: "duplicate_google_place_id", checkedAt };
      } else if (match.verified) {
        const manifest = await provider.getPhotoManifest(match.placeId, { limit: 5, maxWidthPx: 1800 });
        usedPlaceIds.set(match.placeId, key);
        result = { key, hotel, status: "matched", verified: true, needsReview: false, googlePlaceId: match.placeId, confidence: match.confidence, evidence: match.evidence, photoStatus: manifest.photos.length ? "available" : "missing", usablePhotoCount: manifest.photos.length, attributionRequired: manifest.photos.some((photo) => photo.authorAttributions?.length), errorCode: null, checkedAt };
      } else {
        result = { key, hotel, status: match.status, verified: false, needsReview: true, googlePlaceId: null, confidence: match.confidence ?? null, evidence: match.evidence || {}, photoStatus: "not_checked", usablePhotoCount: 0, attributionRequired: false, errorCode: match.status, checkedAt };
      }
    } catch (error) {
      apiFailures += 1;
      result = { key, hotel, status: "api_failure", verified: false, needsReview: true, googlePlaceId: null, confidence: null, evidence: {}, photoStatus: "error", usablePhotoCount: 0, attributionRequired: false, errorCode: error.code || "google_places_error", checkedAt };
    }
    completed.set(key, result);
    onProgress({ completed: index + 1, queued: queue.length, result });
    if (delayMs > 0 && index < queue.length - 1) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  const results = [...completed.values()];
  return {
    results,
    summary: {
      sourceHotels: records.length,
      processed: results.length,
      matched: results.filter((result) => result.verified).length,
      rejectedOrLowConfidence: results.filter((result) => !result.verified && result.status !== "api_failure").length,
      withPhotos: results.filter((result) => result.usablePhotoCount > 0).length,
      withThreePhotos: results.filter((result) => result.usablePhotoCount >= 3).length,
      withoutPhotos: results.filter((result) => result.verified && result.usablePhotoCount === 0).length,
      requiringReview: results.filter((result) => result.needsReview).length,
      apiFailures,
      duplicatePlaceIds,
    },
  };
}

if (process.argv[1]?.endsWith("google-places-match.mjs")) {
  await loadLocalEnvironment(option("--env", ".env.production.local"));
  const output = option("--output", "scripts/hotels/google-places-results.json");
  const limit = Number(option("--limit", Number.MAX_SAFE_INTEGER));
  const delayMs = Number(option("--delay", 125));
  const only = option("--only");
  const resume = process.argv.includes("--resume");
  let records = sourceRecords();
  if (only) records = records.filter((record) => normalizeName(record.name).includes(normalizeName(only)));
  let prior = [];
  if (resume) { try { prior = JSON.parse(await readFile(output, "utf8")).results || []; } catch {} }
  const report = await processGooglePlacesBatch({ records, provider: new GooglePlacesHotelProvider(), prior, limit, delayMs, onProgress: ({ completed, queued, result }) => console.log(`${completed}/${queued} ${result.status} ${result.hotel.name}`) });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary, null, 2));
}

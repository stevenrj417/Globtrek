// Curate verified activities and restaurants per destination from Google Places.
//
// Usage: node scripts/activities/curate-places.mjs [--destinations id,id] [--force]
// Writes app/data/curatedPlaces.json. Only places Google lists as OPERATIONAL are
// kept, with their place ID, rating and review count as returned on the run date.
// Photos are not stored; the site fetches them per place at request time.
// Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the environment or .env.local.
import { readFile, writeFile } from "node:fs/promises";

try {
  const text = await readFile(new URL("../../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {}

const { destinations } = await import("../../app/data/destinations.js");
const { LAUNCH_SET, launchActivities } = await import("../../app/data/launchSet.js");
const { GooglePlacesDiscoveryProvider } = await import("../../app/lib/google-places/GooglePlacesDiscoveryProvider.js");

const ACTIVITY_TYPES = new Set(["tourist_attraction", "museum", "art_gallery", "park", "national_park", "historical_landmark", "cultural_landmark", "beach", "hiking_area", "market", "ski_resort", "lake", "scenic_spot", "observation_deck", "church", "place_of_worship", "zoo", "aquarium", "botanical_garden"]);
const RESTAURANT_TYPES = new Set(["restaurant", "cafe", "bakery", "bar", "meal_takeaway"]);
const args = process.argv.slice(2);
const only = args.includes("--destinations") ? args[args.indexOf("--destinations") + 1].split(",") : null;
const force = args.includes("--force");
const fileUrl = new URL("../../app/data/curatedPlaces.json", import.meta.url);
const file = JSON.parse(await readFile(fileUrl, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const provider = new GooglePlacesDiscoveryProvider();

const targets = destinations.filter((destination) => (only ? only.includes(destination.id) : (LAUNCH_SET.includes(destination.id) || ["curated_budget", "curated_mountain"].includes(destination.catalogStatus))));
// Keep places a traveler can actually visit near the destination: no tour
// operators, agencies or visitor centers, and nothing more than 40 km out.
const NOT_A_PLACE = /\b(tour agency|travel agency|visitor center|lodging|hotel)\b/i;
const OPERATOR_NAME = /\b(operador|receptivo|tours?|agency|travel)\b/i;
function km(a, b) {
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(b[0] - a[0]); const dLon = rad(b[1] - a[1]);
  return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2));
}
export function visitable(destination, item) {
  if (NOT_A_PLACE.test(item.category) || OPERATOR_NAME.test(item.name)) return false;
  if (!Number.isFinite(destination.latitude) || !Number.isFinite(item.latitude)) return true;
  return km([destination.latitude, destination.longitude], [item.latitude, item.longitude]) <= 40;
}
const place = (destination, item, kind) => ({
  id: `google:${item.id}`,
  googlePlaceId: item.id,
  destinationId: destination.id,
  name: item.displayName?.text?.trim(),
  category: (item.primaryType || item.types?.find((type) => !["point_of_interest", "establishment"].includes(type)) || kind).replaceAll("_", " "),
  location: item.formattedAddress || null,
  latitude: item.location?.latitude ?? null,
  longitude: item.location?.longitude ?? null,
  rating: item.rating ?? null,
  reviewCount: item.userRatingCount ?? null,
  priceLevel: item.priceLevel || null,
  googleMapsUrl: item.googleMapsUri || null,
  websiteUrl: item.websiteUri || null,
  businessStatus: item.businessStatus || "OPERATIONAL",
  provider: "google_places",
  verifiedAt: today,
});

// Launch cities whose catalog records predate coordinates, and search names for
// destinations whose catalog name is a region rather than a town.
const CENTERS = { HAN: [21.0285, 105.8542], BKK: [13.7563, 100.5018], LIS: [38.7223, -9.1393], MEX: [19.4326, -99.1332] };
const SEARCH_NAME = { FTE: "El Calafate", "dolomites-mtn": "Cortina d'Ampezzo", "kazbegi-mtn": "Stepantsminda" };

for (const raw of targets) {
  const destination = CENTERS[raw.id] ? { ...raw, latitude: CENTERS[raw.id][0], longitude: CENTERS[raw.id][1] } : raw;
  if (!force && file.places[destination.id]?.activities?.length >= 4) { console.log(`skip ${destination.id}`); continue; }
  const city = SEARCH_NAME[destination.id] || destination.city.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const query = async (textQuery, includedType, allowedTypes, limit) => {
    const results = await provider.searchNearby(destination, { textQuery, includedType, limit, allowedTypes });
    return results.filter((item) => (item.userRatingCount || 0) >= 50);
  };
  try {
    const activities = launchActivities(destination.id).length ? [] : (await query(`top attractions and things to do in ${city}, ${destination.country}`, "tourist_attraction", ACTIVITY_TYPES, 12)).sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0)).map((item) => place(destination, item, "attraction")).filter((item) => visitable(destination, item)).slice(0, 8);
    const restaurants = (await query(`popular local restaurants in ${city}, ${destination.country}`, "restaurant", RESTAURANT_TYPES, 8)).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4).map((item) => place(destination, item, "restaurant"));
    file.places[destination.id] = { activities, restaurants, checkedAt: today };
    console.log(`${destination.id.padEnd(26)} ${activities.length} activities, ${restaurants.length} restaurants`);
  } catch (error) {
    console.log(`${destination.id.padEnd(26)} failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
}
file.checkedAt = today;
await writeFile(fileUrl, `${JSON.stringify(file, null, 1)}\n`);

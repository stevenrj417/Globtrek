// Cheap dinner spots and things to do around each guide's area, from Google
// Places: two text searches per area, kept only when OPERATIONAL, with enough
// reviews, and inside the area. Writes app/data/guidePlaces.json.
//   node scripts/guides/collect-guide-places.mjs [--only slug,slug] [--force] [--splurge]
// --splurge adds one search per saved area for nicer dinners (Google's $$$ and
// $$$$ price levels, or a per-person range from $30) without redoing the rest.
// Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the environment or .env.local.
import { readFile, writeFile } from "node:fs/promises";

for (const line of (await readFile(new URL("../../.env.local", import.meta.url), "utf8").catch(() => "")).split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const { GUIDES, GUIDE_CENTERS } = await import("../../app/data/guides.js");
const { destinations } = await import("../../app/data/destinations.js");
const { GUIDE_TOWNS } = await import("../../app/data/guideTowns.js");
const { GooglePlacesDiscoveryProvider } = await import("../../app/lib/google-places/GooglePlacesDiscoveryProvider.js");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const force = args.includes("--force");
const splurge = args.includes("--splurge");
const fileUrl = new URL("../../app/data/guidePlaces.json", import.meta.url);
const file = JSON.parse(await readFile(fileUrl, "utf8").catch(() => '{"areas":{}}'));
const today = new Date().toISOString().slice(0, 10);
const provider = new GooglePlacesDiscoveryProvider();

const RESTAURANT_TYPES = new Set(["restaurant", "cafe", "bakery", "bar", "meal_takeaway", "food_court"]);
const ACTIVITY_TYPES = new Set(["tourist_attraction", "museum", "art_gallery", "park", "national_park", "historical_landmark", "cultural_landmark", "beach", "hiking_area", "market", "lake", "scenic_spot", "observation_deck", "church", "place_of_worship", "zoo", "aquarium", "botanical_garden", "state_park", "plaza"]);
const NOT_A_PLACE = /\b(tour agency|travel agency|lodging|hotel|service|rental)\b/i;
const OPERATOR = /\b(tours?|agency|travel|charters?|excursions?)\b/i;
const EXPENSIVE = new Set(["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"]);

export function areaKey(guide) {
  return `${guide.destinationId}:${guide.area?.name || "all"}`;
}

function km(a, b) {
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude); const dLon = rad(b.longitude - a.longitude);
  return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2));
}

const place = (item, kind) => ({
  googlePlaceId: item.id,
  name: item.displayName?.text?.trim(),
  kind,
  category: (item.primaryType || item.types?.find((type) => !["point_of_interest", "establishment", "food"].includes(type)) || kind).replaceAll("_", " "),
  address: item.formattedAddress || null,
  latitude: item.location?.latitude ?? null,
  longitude: item.location?.longitude ?? null,
  rating: item.rating ?? null,
  reviewCount: item.userRatingCount ?? null,
  priceLevel: item.priceLevel || null,
  // Google's per-person range ("$10–20"), when it shows one.
  priceRange: item.priceRange ? { low: Number(item.priceRange.startPrice?.units) || null, high: Number(item.priceRange.endPrice?.units) || null, currency: item.priceRange.startPrice?.currencyCode || null } : null,
  googleMapsUrl: item.googleMapsUri || null,
  verifiedAt: today,
});

function where(guide) {
  // Towns outside the catalog stand in with their own name and location.
  const town = guide.town ? GUIDE_TOWNS[guide.town] : null;
  const destination = town ? { id: guide.destinationId, city: town.name, country: "UNITED STATES", latitude: town.latitude, longitude: town.longitude } : destinations.find((item) => item.id === guide.destinationId);
  const center = guide.area?.latitude ? guide.area : destination.latitude != null ? destination : GUIDE_CENTERS[destination.id];
  const name = town ? `${guide.area?.name || town.name}, ${town.state}` : guide.area?.name && !guide.area.town ? `${guide.area.name}, ${guide.place}` : guide.place;
  const maxKm = guide.area?.radiusKm ? Math.max(2, guide.area.radiusKm * 1.6) : guide.area?.town ? 12 : 25;
  return { center, name, maxKm, search: { ...destination, latitude: center.latitude, longitude: center.longitude, hotelSearchRadiusKm: Math.max(5, maxKm) } };
}

async function addSplurge(key, guide) {
  const { center, name, maxKm, search } = where(guide);
  try {
    const nice = (await provider.searchNearby(search, { textQuery: `best upscale restaurants for a special dinner near ${name}`, includedType: "restaurant", limit: 12, allowedTypes: RESTAURANT_TYPES }))
      .filter((item) => item.businessStatus === "OPERATIONAL" && (item.userRatingCount || 0) >= 80)
      .map((item) => place(item, "dinner"))
      .filter((item) => (item.latitude == null || km(center, item) <= maxKm) && (EXPENSIVE.has(item.priceLevel) || (item.priceRange?.low || 0) >= 30))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
    file.areas[key].splurgeDinners = nice.slice(0, 6);
    console.log(`${key.padEnd(44)} ${nice.length} splurge dinners`);
  } catch (error) {
    console.log(`${key.padEnd(44)} failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
}

const areas = new Map();
for (const guide of GUIDES) {
  if (!guide.destinationId || (only && !only.includes(guide.slug))) continue;
  areas.set(areaKey(guide), guide);
}

for (const [key, guide] of areas) {
  if (splurge) { if (file.areas[key] && (force || !file.areas[key].splurgeDinners)) await addSplurge(key, guide); continue; }
  if (!force && file.areas[key]) { console.log(`skip ${key}`); continue; }
  // Towns outside the catalog stand in with their own name and location.
  const town = guide.town ? GUIDE_TOWNS[guide.town] : null;
  const destination = town ? { id: guide.destinationId, city: town.name, country: "UNITED STATES", latitude: town.latitude, longitude: town.longitude } : destinations.find((item) => item.id === guide.destinationId);
  const center = guide.area?.latitude ? guide.area : destination.latitude != null ? destination : GUIDE_CENTERS[destination.id];
  const name = town ? `${guide.area?.name || town.name}, ${town.state}` : guide.area?.name && !guide.area.town ? `${guide.area.name}, ${guide.place}` : guide.place;
  const maxKm = guide.area?.radiusKm ? Math.max(2, guide.area.radiusKm * 1.6) : guide.area?.town ? 12 : 25;
  const search = { ...destination, latitude: center.latitude, longitude: center.longitude, hotelSearchRadiusKm: Math.max(5, maxKm) };
  const near = (item) => item.latitude == null || km(center, item) <= maxKm;
  try {
    const eats = (await provider.searchNearby(search, { textQuery: `cheap eats and casual local restaurants near ${name}`, includedType: "restaurant", limit: 12, allowedTypes: RESTAURANT_TYPES }))
      .filter((item) => item.businessStatus === "OPERATIONAL" && (item.userRatingCount || 0) >= 80 && !EXPENSIVE.has(item.priceLevel))
      .map((item) => place(item, "dinner")).filter(near)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
    const sights = (await provider.searchNearby(search, { textQuery: `top things to do and free sights near ${name}`, includedType: "tourist_attraction", limit: 14, allowedTypes: ACTIVITY_TYPES }))
      .filter((item) => item.businessStatus === "OPERATIONAL" && (item.userRatingCount || 0) >= 100)
      .map((item) => place(item, "activity")).filter((item) => near(item) && !NOT_A_PLACE.test(item.category) && !OPERATOR.test(item.name))
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    file.areas[key] = { center: { latitude: center.latitude, longitude: center.longitude }, dinners: eats.slice(0, 8), activities: sights.slice(0, 10), checkedAt: today };
    console.log(`${key.padEnd(44)} ${eats.length} dinners, ${sights.length} things to do`);
  } catch (error) {
    console.log(`${key.padEnd(44)} failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
}

file.checkedAt = today;
await writeFile(fileUrl, `${JSON.stringify(file, null, 1)}\n`);

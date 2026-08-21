import { readFile, writeFile } from "node:fs/promises";
import { destinations } from "../../app/data/destinations.js";

async function loadEnvironment(path = ".env.production.local") {
  try {
    for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {}
}

await loadEnvironment();
const root = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const token = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!root.startsWith("https://") || !token) throw new Error("Production Supabase environment is unavailable");
const headers = { apikey: token, Authorization: `Bearer ${token}` };

async function rows(table, select, filters = "") {
  const all = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${root}/${table}?select=${encodeURIComponent(select)}${filters}`, { headers: { ...headers, Range: `${offset}-${offset + 999}`, Prefer: "count=exact" } });
    if (!response.ok) throw new Error(`${table}_${response.status}:${(await response.text()).slice(0, 160)}`);
    const page = await response.json(); all.push(...page);
    if (page.length < 1000) break;
  }
  return all;
}

const [hotels, restaurants, activities] = await Promise.all([
  rows("hotel_catalog", "id,name,destination_id,provider,active,review_status,recommendation_ready,price_tier,calm_score,energy_score,relaxation_score,identity_confidence,location_confidence,data_completeness_score,photo_count,provider_link_verified,google_place_verified,google_place_id,review_rating,review_count", "&active=eq.true"),
  rows("restaurant_catalog", "id,destination_id,active", "&active=eq.true"),
  rows("activity_catalog", "id,destination_id,active,review_status", "&active=eq.true"),
]);

function vibe(hotel) {
  const calm = Number(hotel.calm_score ?? hotel.relaxation_score ?? 50);
  const energy = Number(hotel.energy_score ?? 50);
  return calm >= energy + 10 ? "calm" : energy >= calm + 10 ? "energetic" : "balanced";
}

const destinationRows = destinations.map((destination) => {
  const id = destination.id || destination.airport;
  const inventory = hotels.filter((hotel) => hotel.destination_id === id);
  const verified = inventory.filter((hotel) => hotel.review_status === "verified");
  const classified = verified.filter((hotel) => hotel.price_tier && hotel.calm_score != null && hotel.energy_score != null);
  const ready = verified.filter((hotel) => hotel.recommendation_ready);
  const matrix = Object.fromEntries(["value", "midrange", "premium"].flatMap((tier) => ["calm", "balanced", "energetic"].map((style) => [`${tier}.${style}`, ready.filter((hotel) => hotel.price_tier === tier && vibe(hotel) === style).length])));
  return {
    destinationId: id, destination: destination.city, activeHotels: inventory.length, verifiedHotels: verified.length,
    classifiedHotels: classified.length, recommendationReadyHotels: ready.length,
    priceCoverage: Object.fromEntries(["value", "midrange", "premium"].map((tier) => [tier, ready.filter((hotel) => hotel.price_tier === tier).length])),
    vibeCoverage: Object.fromEntries(["calm", "balanced", "energetic"].map((style) => [style, ready.filter((hotel) => vibe(hotel) === style).length])),
    matrix, matrixCellShortfalls: Object.fromEntries(Object.entries(matrix).filter(([, count]) => count < 1).map(([cell, count]) => [cell, 1 - count])),
    canReturnThree: ready.length >= 3, fivePhotoHotels: verified.filter((hotel) => hotel.photo_count >= 5).length,
    verifiedProviderLinks: verified.filter((hotel) => hotel.provider_link_verified).length,
    restaurants: restaurants.filter((item) => item.destination_id === id).length,
    activities: activities.filter((item) => item.destination_id === id && item.review_status !== "rejected").length,
  };
});

const verified = hotels.filter((hotel) => hotel.review_status === "verified");
const ready = verified.filter((hotel) => hotel.recommendation_ready);
const report = {
  generatedAt: new Date().toISOString(),
  destinations: destinations.length, uniqueDestinations: new Set(destinations.map((item) => item.id || item.airport)).size,
  hotels: {
    active: hotels.length, verified: verified.length, classified: verified.filter((hotel) => hotel.price_tier && hotel.calm_score != null && hotel.energy_score != null).length,
    recommendationReady: ready.length, averageReadyPerDestination: Number((ready.length / destinations.length).toFixed(2)),
    googleIdentityVerified: hotels.filter((hotel) => hotel.google_place_verified).length,
    threePhotosActive: hotels.filter((hotel) => hotel.photo_count >= 3).length,
    fivePhotosActive: hotels.filter((hotel) => hotel.photo_count >= 5).length,
    threePhotosRecommendationReady: ready.filter((hotel) => hotel.photo_count >= 3).length,
    fivePhotosRecommendationReady: ready.filter((hotel) => hotel.photo_count >= 5).length,
    providerLinksVerified: hotels.filter((hotel) => hotel.provider_link_verified).length,
    providerCounts: Object.fromEntries([...new Set(hotels.map((hotel) => hotel.provider))].sort().map((provider) => [provider, hotels.filter((hotel) => hotel.provider === provider).length])),
    readyPriceCoverage: Object.fromEntries(["value", "midrange", "premium"].map((tier) => [tier, ready.filter((hotel) => hotel.price_tier === tier).length])),
    readyVibeCoverage: Object.fromEntries(["calm", "balanced", "energetic"].map((style) => [style, ready.filter((hotel) => vibe(hotel) === style).length])),
    destinationsAtThreeOrMore: destinationRows.filter((item) => item.recommendationReadyHotels >= 3).length,
    destinationsBelowThree: destinationRows.filter((item) => item.recommendationReadyHotels < 3).length,
    destinationsAtNineOrMore: destinationRows.filter((item) => item.recommendationReadyHotels >= 9).length,
    destinationsBelowNine: destinationRows.filter((item) => item.recommendationReadyHotels < 9).length,
    destinationsUnableToReturnThree: destinationRows.filter((item) => !item.canReturnThree).map((item) => item.destination),
    totalMatrixCellShortfalls: destinationRows.reduce((sum, item) => sum + Object.values(item.matrixCellShortfalls).reduce((cellSum, value) => cellSum + value, 0), 0),
  },
  restaurants: { active: restaurants.length, thinDestinations: destinationRows.filter((item) => item.restaurants < 6).map((item) => item.destination) },
  activities: { active: activities.filter((item) => item.review_status !== "rejected").length, thinDestinations: destinationRows.filter((item) => item.activities < 12).map((item) => item.destination) },
  perDestination: destinationRows,
};
await writeFile("scripts/hotels/production-coverage.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ generatedAt: report.generatedAt, destinations: report.destinations, hotels: report.hotels, restaurants: report.restaurants.active, activities: report.activities.active }, null, 2));

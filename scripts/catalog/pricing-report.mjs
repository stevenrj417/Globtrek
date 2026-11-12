// Catalog and pricing coverage, for the implementation report.
// Usage: node scripts/catalog/pricing-report.mjs
import { readFile } from "node:fs/promises";

const read = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const { destinations } = await import("../../app/data/destinations.js");
const { destinationReadiness } = await import("../../app/lib/recommendation/eligibility.js");
const { CHEAP_STAYS } = await import("../../app/data/cheapStays.js");
const feed = await read("../../app/data/feedStays.json");
const curated = await read("../../app/data/curatedPlaces.json");
const costs = await read("../../app/data/pricing/destinationCosts.json");

const eligible = destinations.filter((destination) => destinationReadiness(destination).eligible);
const stays = Object.values(feed.stays).flat();
const models = {};
for (const destination of destinations) models[destination.planningAverages?.model || "none"] = (models[destination.planningAverages?.model || "none"] || 0) + 1;
const missing = {};
for (const destination of destinations) for (const reason of destinationReadiness(destination).missing) (missing[reason] ||= []).push(destination.city);

console.log(JSON.stringify({
  destinations: destinations.length,
  quizReady: eligible.length,
  stays: { catalogProperties: stays.length, uniqueBookingIds: new Set(stays.map((stay) => stay.providerPropertyId)).size, destinationsWithStays: Object.keys(feed.stays).length, withObservedPrice: Object.keys(CHEAP_STAYS).length, feedHasPrices: false },
  activities: Object.values(curated.places).reduce((sum, entry) => sum + (entry.activities?.length || 0), 0),
  restaurants: Object.values(curated.places).reduce((sum, entry) => sum + (entry.restaurants?.length || 0), 0),
  restaurantPriceSamples: Object.values(costs.destinations).reduce((sum, entry) => sum + (entry.restaurants || 0), 0),
  costModels: models,
  stillMissing: missing,
}, null, 1));

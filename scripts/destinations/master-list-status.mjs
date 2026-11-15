// Where every master-list outcome stands against the import spec: photo,
// alt text, stays, activities, restaurants, costs, climate, flight data,
// quiz readiness and reachability. Writes the resumable progress file
// scripts/destinations/master-list-progress.json; re-run after any step.
//   node scripts/destinations/master-list-status.mjs
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const { destinations, destinationByOutcomeId } = await import("../../app/data/destinations.js");
const { destinationReadiness, stayCount, activityCount } = await import("../../app/lib/recommendation/eligibility.js");
const { reachability } = await import("../catalog/quiz-reachability.mjs");

const outcomes = read("app/data/destinationOutcomes.json").outcomes;
const curated = read("app/data/curatedPlaces.json").places || {};
const fares = read("app/data/pricing/fareIndex.json");
const fareAirports = new Set(Object.keys(fares.routes || fares.byDestination || fares.destinations || {}).flatMap((key) => key.split(/[-:>]/)));

const rows = outcomes.map((outcome) => {
  const destination = destinationByOutcomeId(outcome.outcomeId);
  if (!destination) return { outcomeId: outcome.outcomeId, exactMatch: outcome.exactMatch, status: "not_in_catalog" };
  const readiness = destinationReadiness(destination);
  const plan = destination.planningAverages || {};
  const restaurants = curated[destination.id]?.restaurants?.length || 0;
  const flags = [];
  if (activityCount(destination.id) < 6) flags.push("fewer than 6 verified activities");
  if (stayCount(destination.id) < 9) flags.push("fewer than 9 catalog stays");
  if (!restaurants) flags.push("no verified restaurants");
  if (!fareAirports.has(destination.airport)) flags.push("no observed fares to this airport");
  flags.push("per-property prices, ratings and photos need the Booking Demand API");
  const reach = readiness.eligible ? reachability(destination, { origin: destination.airport === "LAX" ? "JFK" : "LAX" }) : null;
  return {
    outcomeId: outcome.outcomeId,
    exactMatch: outcome.exactMatch,
    destinationId: destination.id,
    linkedBy: outcome.linkedBy,
    photo: Boolean(destination.image),
    imageAlt: Boolean(destination.imageAlt),
    stays: stayCount(destination.id),
    activities: activityCount(destination.id),
    restaurants,
    costModel: plan.model || "tier",
    climate: destination.seasonSource === "nasa_power_climate" || !/requires .*review/i.test(destination.season || ""),
    quizReady: readiness.eligible,
    missing: readiness.missing,
    reachable: reach ? reach.reachable : false,
    flags,
    status: readiness.eligible && reach?.reachable ? "quiz_ready" : "needs_data",
  };
});

const count = (test) => rows.filter(test).length;
const summary = {
  checkedAt: new Date().toISOString().slice(0, 10),
  outcomes: rows.length,
  inCatalog: count((row) => row.status !== "not_in_catalog"),
  quizReady: count((row) => row.status === "quiz_ready"),
  withPhotoAndAlt: count((row) => row.photo && row.imageAlt),
  sixPlusActivities: count((row) => row.activities >= 6),
  ninePlusStays: count((row) => row.stays >= 9),
  threePlusStays: count((row) => row.stays >= 3),
  withRestaurants: count((row) => row.restaurants > 0),
  costModels: Object.fromEntries(Object.entries(Object.groupBy(rows, (row) => row.costModel || "none")).map(([key, items]) => [key, items.length])),
  missingByCheck: Object.fromEntries(Object.entries(Object.groupBy(rows.flatMap((row) => row.missing || []), (name) => name)).map(([key, items]) => [key, items.length])),
  complete: false,
  completeNote: "No outcome is complete under the spec until verified per-property lodging (9+ with prices, ratings and photos) is available; that needs Booking Demand API access.",
};
writeFileSync(new URL("scripts/destinations/master-list-progress.json", root), `${JSON.stringify({ summary, outcomes: rows }, null, 1)}\n`);
console.log(JSON.stringify(summary, null, 1));
void destinations;

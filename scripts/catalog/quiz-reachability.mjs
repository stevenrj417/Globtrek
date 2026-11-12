// Can the quiz recommend each destination? For every destination, answer the
// quiz with its own setting and interest, a generous budget and a trip length
// it supports, and see whether it passes every filter and where it ranks.
//
// Usage: node scripts/catalog/quiz-reachability.mjs [--json]
const { destinations } = await import("../../app/data/destinations.js");
const { destinationReadiness, INTEREST_TAGS, SETTING_REQUIREMENTS } = await import("../../app/lib/recommendation/eligibility.js");
const { normalizeTravelerProfile } = await import("../../app/lib/recommendation/travelerProfile.js");
const { rankDestinations } = await import("../../app/lib/recommendation/destinationEngine.js");
const { structuredOrigin } = await import("../../app/lib/recommendation/travelArea.js");

const SETTINGS = Object.keys(SETTING_REQUIREMENTS);
const DURATIONS = [["Long Weekend", 3], ["Five Nights", 5], ["One Week", 7], ["Ten Days", 10], ["Two Weeks", 14]];

export function reachability(destination, { budget = 20000, origin = "LAX" } = {}) {
  const setting = SETTINGS.find((name) => destination.tags.includes(SETTING_REQUIREMENTS[name].tag));
  const interest = INTEREST_TAGS.find((tag) => destination.tags.includes(tag));
  const range = destination.tripLengthFit ? { min: destination.tripLengthFit.minimumNights, max: destination.tripLengthFit.maximumNights } : { min: 2, max: 14 };
  const duration = (DURATIONS.find(([, nights]) => nights >= range.min && nights <= range.max) || DURATIONS[2])[0];
  const profile = normalizeTravelerProfile({ answers: { alive: setting, luxury: interest, escape: "Balanced days", duration, hotel: "Whatever's cheapest", discovery: 50 }, exactBudget: budget, guestCount: "1", isFlexible: true, originAirport: origin, originDetails: structuredOrigin(origin), includedBudgetCategories: { flights: true, hotel: true, food: true, activities: true, transportation: true } });
  const ranked = rankDestinations(destinations, profile);
  const index = ranked.findIndex((item) => item.id === destination.id);
  return { id: destination.id, city: destination.city, setting, interest, duration, reachable: index >= 0, rank: index >= 0 ? index + 1 : null, candidates: ranked.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const eligible = destinations.filter((destination) => destinationReadiness(destination).eligible);
  const results = eligible.map((destination) => reachability(destination, { origin: ["LAX", "BUR", "LGB", "SNA"].includes(destination.airport) || /^los-angeles/.test(destination.id) ? "JFK" : "LAX" }));
  const unreachable = results.filter((item) => !item.reachable);
  const summary = { destinations: destinations.length, eligible: eligible.length, reachable: results.length - unreachable.length, topThree: results.filter((item) => item.rank && item.rank <= 3).length, unreachable };
  console.log(JSON.stringify(process.argv.includes("--json") ? { summary, results } : summary, null, 1));
}

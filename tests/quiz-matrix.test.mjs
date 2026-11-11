import assert from "node:assert/strict";
import test from "node:test";
import { destinations } from "../app/data/destinations.js";
import { rankDestinations, validateMatch } from "../app/lib/recommendation/destinationEngine.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";
import { structuredOrigin } from "../app/lib/recommendation/travelArea.js";
import { diagnoseNoMatch } from "../app/lib/recommendation/diagnoseNoMatch.js";

// Every combination of setting, interest, pace, budget, origin and group size:
// whatever the matcher returns must honor the answers, and the same answers
// must always give the same trip.
const SETTINGS = ["Ocean", "Mountains", "Cities", "Culture"];
const INTERESTS = ["Food", "Nature", "Culture", "Nightlife", "Wellness", "Shopping"];
const PACES = ["Slow mornings", "Balanced days", "Packed schedule", "Mostly relaxing", "Adventure days"];
const BUDGETS = [600, 1500, 4000, 12000];
const ORIGINS = ["LAX", "JFK", "LHR"];
const GROUPS = ["1", "4"];

const quiz = ({ setting, interest, pace, budget, origin, group }) => ({
  answers: { alive: setting, luxury: interest, escape: pace, duration: "Five Nights", hotel: "Whatever's cheapest" },
  exactBudget: budget, guestCount: group, isFlexible: true, originAirport: origin, originDetails: structuredOrigin(origin), travelAreaPreference: "anywhere",
});

const combos = [];
for (const setting of SETTINGS) for (const interest of INTERESTS) for (const pace of PACES) for (const budget of BUDGETS) for (const origin of ORIGINS) for (const group of GROUPS) combos.push({ setting, interest, pace, budget, origin, group });

test(`all ${combos.length} quiz combinations return only trips that honor the answers`, () => {
  let matched = 0;
  let interestMisses = 0;
  for (const combo of combos) {
    const profile = normalizeTravelerProfile(quiz(combo));
    const ranked = rankDestinations(destinations, profile);
    for (const trip of ranked) {
      assert.deepEqual(validateMatch(trip, profile), [], `${JSON.stringify(combo)} → ${trip.id}`);
      assert.ok(trip.tags.includes(combo.setting), `${trip.id} lacks ${combo.setting}`);
      assert.notEqual(trip.airport, combo.origin);
      assert.ok(trip.budgetPlan.budgetCheckTotal <= combo.budget, `${trip.id} over budget for ${JSON.stringify(combo)}`);
    }
    if (ranked.length) {
      matched += 1;
      const again = rankDestinations(destinations, normalizeTravelerProfile(quiz(combo)));
      assert.equal(again[0].id, ranked[0].id, "deterministic");
      if (ranked.some((trip) => trip.tags.includes(combo.interest)) && !ranked[0].tags.includes(combo.interest)) interestMisses += 1;
    } else {
      const diagnosis = diagnoseNoMatch(destinations, quiz(combo));
      assert.ok(diagnosis.options?.length, `no-match answers get ways forward: ${JSON.stringify(combo)}`);
    }
  }
  assert.ok(matched > combos.length / 3, `matched ${matched}`);
  // The interest is the strongest soft preference: when a matching trip can
  // carry it, the winner should too in nearly every case.
  assert.ok(interestMisses / matched < 0.1, `interest ignored in ${interestMisses} of ${matched}`);
});

// Representative travelers from the launch plan. Each must get a trip that fits
// what they said, or an honest "no match" with ways forward.
const traveler = (answers, extra = {}) => ({
  answers: { duration: "Five Nights", hotel: "Whatever's cheapest", escape: "Balanced days", ...answers },
  exactBudget: 2500, guestCount: "1", isFlexible: true, originAirport: "LAX", originDetails: structuredOrigin("LAX"), travelAreaPreference: "anywhere", ...extra,
});
const SCENARIOS = [
  ["budget solo traveler", traveler({ alive: "Cities", luxury: "Food", hotel: "Hostel bed" }, { exactBudget: 1200 })],
  ["luxury couple", traveler({ alive: "Ocean", luxury: "Wellness", hotel: "Private room", self: "Couple", duration: "One Week" }, { exactBudget: 12000, guestCount: "2" })],
  ["mountain adventurer", traveler({ alive: "Mountains", luxury: "Nature", escape: "Adventure days" })],
  ["beach vacationer", traveler({ alive: "Ocean", luxury: "Wellness", escape: "Mostly relaxing", duration: "One Week" }, { exactBudget: 3500 })],
  ["city explorer", traveler({ alive: "Cities", luxury: "Culture", escape: "Packed schedule" }, { originAirport: "JFK", originDetails: structuredOrigin("JFK") })],
  ["nature lover", traveler({ alive: "Mountains", luxury: "Nature", escape: "Slow mornings" }, { originAirport: "LHR", originDetails: structuredOrigin("LHR") })],
  ["family vacation", traveler({ alive: "Ocean", luxury: "Nature", self: "Family", duration: "One Week" }, { exactBudget: 9000, guestCount: "4" })],
  ["winter traveler", traveler({ alive: "Mountains", luxury: "Wellness", season: "Winter (Dec-Feb)" }, { exactBudget: 4000 })],
  ["food-focused traveler", traveler({ alive: "Culture", luxury: "Food" }, { exactBudget: 3000 })],
  ["flexible-dates traveler", traveler({ alive: "Surprise Me", luxury: "Culture", season: "Flexible dates" })],
];

for (const [name, input] of SCENARIOS) {
  test(`scenario: ${name}`, () => {
    const profile = normalizeTravelerProfile(input);
    const ranked = rankDestinations(destinations, profile);
    assert.ok(ranked.length, `${name} gets at least one trip`);
    const top = ranked[0];
    assert.deepEqual(validateMatch(top, profile), []);
    if (input.answers.alive !== "Surprise Me") assert.ok(top.tags.includes(input.answers.alive), `${top.id} is ${input.answers.alive}`);
    assert.ok(top.budgetPlan.budgetCheckTotal <= input.exactBudget);
    assert.notEqual(top.airport, input.originAirport);
    assert.equal(rankDestinations(destinations, normalizeTravelerProfile(input))[0].id, top.id, "deterministic");
  });
}

test("scenario: a very low budget gets a diagnosis instead of a trip that doesn't fit", () => {
  const input = traveler({ alive: "Ocean", luxury: "Wellness", duration: "Two Weeks" }, { exactBudget: 150, guestCount: "2" });
  assert.equal(rankDestinations(destinations, normalizeTravelerProfile(input)).length, 0);
  const diagnosis = diagnoseNoMatch(destinations, input);
  assert.ok(diagnosis.reasons.length);
  assert.equal(diagnosis.options.length, 5);
  for (const option of diagnosis.suggestions) assert.ok(rankDestinations(destinations, normalizeTravelerProfile(option.quiz)).length, `${option.id} really finds a trip`);
});

test("scenario: preferences with no exact match explain why and offer only working fixes", () => {
  const input = traveler({ alive: "Mountains", luxury: "Nightlife", duration: "Two Weeks" }, { exactBudget: 400, guestCount: "6" });
  assert.equal(rankDestinations(destinations, normalizeTravelerProfile(input)).length, 0);
  const diagnosis = diagnoseNoMatch(destinations, input);
  assert.ok(diagnosis.reasons.some((reason) => reason.id === "budget" || reason.id === "other"));
  for (const option of diagnosis.options.filter((item) => item.available && item.quiz)) assert.ok(rankDestinations(destinations, normalizeTravelerProfile(option.quiz)).length);
});

test("an origin without coordinates is placed at its airport, not at 0°, 0°", async () => {
  const { assessTravelFeasibility } = await import("../app/lib/recommendation/travelFeasibility.js");
  const profile = normalizeTravelerProfile(traveler({}, { originAirport: "JFK", originDetails: { ...structuredOrigin("JFK"), latitude: null, longitude: null } }));
  const chicago = destinations.find((item) => item.airport === "ORD");
  const innsbruck = destinations.find((item) => item.airport === "INN");
  const toChicago = assessTravelFeasibility(profile, chicago);
  assert.equal(toChicago.estimatedConnections, 0);
  assert.ok(toChicago.estimatedFlightDuration < 4, `JFK→ORD modeled at ${toChicago.estimatedFlightDuration}h`);
  assert.ok(toChicago.score > assessTravelFeasibility(profile, innsbruck).score);
});

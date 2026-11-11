import test from "node:test";
import assert from "node:assert/strict";
import { destinations } from "../app/data/destinations.js";
import { applyQuizPatch, diagnoseNoMatch } from "../app/lib/recommendation/diagnoseNoMatch.js";
import { rankDestinations } from "../app/lib/recommendation/destinationEngine.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";

const tightQuiz = {
  answers: { alive: "Cities", duration: "Five Nights" },
  exactBudget: 350,
  includedBudgetCategories: { flights: true, hotel: true, food: true, activities: true, transportation: true },
  guestCount: "1", isFlexible: true, travelAreaPreference: "anywhere",
  originAirport: "PDX", originDetails: { airportCode: "PDX", countryCode: "US", countryName: "United States", latitude: 45.59, longitude: -122.6 },
};

test("a too-small budget is explained with the closest real trip and the gap", () => {
  assert.equal(rankDestinations(destinations, normalizeTravelerProfile(tightQuiz)).length, 0, "precondition: nothing fits");
  const diagnosis = diagnoseNoMatch(destinations, tightQuiz);
  const budget = diagnosis.reasons.find((reason) => reason.id === "budget");
  assert.ok(budget, "explains the budget");
  assert.match(budget.text, /\$350 budget covers flights, lodging, food, activities, local transport for 1 traveler and 5 nights/);
  assert.match(budget.text, /closest city trip that fits your other answers is .* at about \$[\d,]+, \$[\d,]+ over/);
});

test("every suggested fix actually produces a trip", () => {
  const diagnosis = diagnoseNoMatch(destinations, tightQuiz);
  assert.ok(diagnosis.suggestions.length >= 2);
  for (const suggestion of diagnosis.suggestions) {
    assert.ok(rankDestinations(destinations, normalizeTravelerProfile(suggestion.quiz)).length > 0, suggestion.label);
    assert.match(suggestion.result, /at about \$/);
  }
});

test("quiz patches change nights through dates when dates are set", () => {
  const patched = applyQuizPatch({ ...tightQuiz, isFlexible: false, tripStart: "2027-04-12", tripEnd: "2027-04-17" }, { nights: 3, flights: false, spendStyle: "cheapest" });
  assert.equal(patched.tripEnd, "2027-04-15");
  assert.equal(patched.includedBudgetCategories.flights, false);
  assert.equal(patched.answers.spendStyle, "cheapest");
  assert.equal(normalizeTravelerProfile(patched).tripLength, 3);
});

test("no-match offers exactly the five required options, in order", () => {
  const diagnosis = diagnoseNoMatch(destinations, tightQuiz);
  assert.deepEqual(diagnosis.options.map((option) => option.id), ["budget", "flights", "shorter", "lodging", "closest"]);
  assert.match(diagnosis.options[0].label, /^Increase my budget/);
  assert.equal(diagnosis.options[1].label, "Remove flights from my budget");
  assert.match(diagnosis.options[2].label, /^Shorten my trip/);
  assert.match(diagnosis.options[3].label, /^Change accommodation/);
  assert.equal(diagnosis.options[4].label, "Show the closest match anyway");
});

test("the closest match is a real over-budget trip of the chosen setting", () => {
  const diagnosis = diagnoseNoMatch(destinations, tightQuiz);
  const closest = destinations.find((item) => (item.id || item.airport) === diagnosis.closest.id);
  assert.ok(closest.tags.includes("Cities"));
  assert.ok(diagnosis.closest.total > 350);
  assert.match(diagnosis.options[4].href, /^\/results\?destination=/);
  assert.match(diagnosis.options[4].result, /over budget by about \$/);
});

test("the budget option raises the budget to the closest trip and finds it", () => {
  const diagnosis = diagnoseNoMatch(destinations, tightQuiz);
  const option = diagnosis.options[0];
  assert.equal(option.available, true);
  assert.ok(option.patch.budget >= diagnosis.closest.total);
  assert.ok(rankDestinations(destinations, normalizeTravelerProfile(option.quiz)).length > 0);
});

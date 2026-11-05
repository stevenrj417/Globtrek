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

test("a too-small budget is explained with the cheapest real trip and the gap", () => {
  assert.equal(rankDestinations(destinations, normalizeTravelerProfile(tightQuiz)).length, 0, "precondition: nothing fits");
  const diagnosis = diagnoseNoMatch(destinations, tightQuiz);
  const budget = diagnosis.reasons.find((reason) => reason.id === "budget");
  assert.ok(budget, "explains the budget");
  assert.match(budget.text, /\$350 budget covers flights, lodging, food, activities, local transport for 1 traveler and 5 nights/);
  assert.match(budget.text, /cheapest trip .* is .* at about \$[\d,]+, which is \$[\d,]+ over/);
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

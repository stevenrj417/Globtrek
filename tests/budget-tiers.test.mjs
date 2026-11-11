import assert from "node:assert/strict";
import test from "node:test";
import { destinations } from "../app/data/destinations.js";
import { rankDestinations, validateMatch } from "../app/lib/recommendation/destinationEngine.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";
import { structuredOrigin } from "../app/lib/recommendation/travelArea.js";
import { diagnoseNoMatch } from "../app/lib/recommendation/diagnoseNoMatch.js";
import { buildBudgetPlan } from "../app/lib/recommendation/budgetEngine.js";

// Cheap trips at every budget the product promises to handle: whatever comes
// back fits the whole budget with every cost counted, and a budget nothing fits
// gets an explanation and the closest alternative instead of an over-budget trip.
const BUDGETS = [300, 500, 700, 1000, 1500, 2000, 5000];
const CATEGORIES = ["flights", "hotel", "food", "activities", "transportation"];

const quiz = (budget, overrides = {}) => ({
  answers: { duration: "Long Weekend", hotel: "Whatever's cheapest" },
  exactBudget: budget, guestCount: "1", isFlexible: true, originAirport: "LAX", originDetails: structuredOrigin("LAX"), travelAreaPreference: "anywhere",
  ...overrides,
});

for (const budget of BUDGETS) {
  test(`$${budget}: every trip fits the whole budget with nothing left out`, () => {
    const profile = normalizeTravelerProfile(quiz(budget));
    const ranked = rankDestinations(destinations, profile);
    for (const match of ranked) {
      const plan = match.budgetPlan;
      assert.deepEqual(validateMatch(match, profile), [], match.id);
      assert.ok(plan.budgetCheckTotal <= budget, `${match.id} costs ${plan.budgetCheckTotal}`);
      const counted = CATEGORIES.reduce((sum, key) => sum + (plan.estimates[key]?.average || 0), 0);
      assert.ok(plan.budgetCheckTotal >= counted, `${match.id} total leaves out a category`);
      for (const key of CATEGORIES) assert.ok(plan.estimates[key]?.source, `${match.id} ${key} has no source`);
    }
    if (!ranked.length) {
      const diagnosis = diagnoseNoMatch(destinations, quiz(budget));
      assert.ok(diagnosis.reasons.length > 0, "no explanation");
      if (diagnosis.closest) assert.ok(diagnosis.closest.total > budget || diagnosis.reasons.some((reason) => reason.id === "budget"));
    }
    if (budget >= 2000) assert.ok(ranked.length > 0, "nothing fits a generous budget");
  });
}

test("a traveler who asks for a private room never gets a dorm bed", () => {
  for (const destination of destinations) {
    const plan = buildBudgetPlan(normalizeTravelerProfile({ ...quiz(400), spendStyle: "cheapest", answers: { duration: "Long Weekend", hotel: "Private room" } }), destination);
    assert.notEqual(plan.lodging?.unit, "bed", destination.id);
  }
});

test("a modeled dorm rate never names a property", () => {
  let modeled = 0;
  for (const destination of destinations) {
    const plan = buildBudgetPlan(normalizeTravelerProfile({ ...quiz(400), spendStyle: "cheapest" }), destination);
    if (plan.lodging?.priceKind !== "dorm_estimate") continue;
    modeled += 1;
    assert.equal(plan.lodging.name, null, destination.id);
    assert.equal(plan.lodging.unit, "bed");
  }
  assert.ok(modeled > 0, "no destination used the modeled dorm rate");
});

test("nightly lodging bands follow the ultra-budget tiers", async () => {
  const { nightlyTier } = await import("../app/lib/recommendation/budgetEngine.js");
  assert.equal(nightlyTier(9), "under_15");
  assert.equal(nightlyTier(15), "under_25");
  assert.equal(nightlyTier(39.5), "under_40");
  assert.equal(nightlyTier(59), "under_60");
  assert.equal(nightlyTier(99), "under_100");
  assert.equal(nightlyTier(140), "100_plus");
  assert.equal(nightlyTier(0), null);
});

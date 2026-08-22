import assert from "node:assert/strict";
import test from "node:test";
import { buildDestinationPositioningBenchmarks, classificationSanity, deriveGroundedRelativeTier } from "../scripts/hotels/relative-price-tools.mjs";

const base = { destinationId: "X", sourceUrl: "https://official.example/hotel", classificationConfidence: 0.72, calmScore: 60, energyScore: 30, luxuryScore: 50, valueScore: 50, rationale: "Official hotel page" };

test("relative price promotion requires explicit official positioning", () => {
  assert.equal(deriveGroundedRelativeTier(base), null);
  assert.equal(deriveGroundedRelativeTier({ ...base, luxuryScore: 90, valueScore: 25, rationale: "No explicit luxury positioning is provided" }), null);
  assert.equal(deriveGroundedRelativeTier({ ...base, luxuryScore: 90, valueScore: 25, rationale: "Official page describes a five-star luxury hotel" }).tier, "premium");
  assert.equal(deriveGroundedRelativeTier({ ...base, luxuryScore: 20, valueScore: 85, rationale: "Official page describes an affordable hostel" }).tier, "value");
});

test("destination anchors prevent nonsensical relative positioning", () => {
  const anchors = [
    { destinationId: "X", priceTier: "value", priceConfidence: 0.8, luxuryScore: 20, valueScore: 90 },
    { destinationId: "X", priceTier: "midrange", priceConfidence: 0.8, luxuryScore: 60, valueScore: 55 },
    { destinationId: "X", priceTier: "premium", priceConfidence: 0.8, luxuryScore: 95, valueScore: 20 },
  ];
  const benchmark = buildDestinationPositioningBenchmarks(anchors).get("X");
  assert.equal(deriveGroundedRelativeTier({ ...base, luxuryScore: 40, valueScore: 35, rationale: "Luxury hotel" }, benchmark), null);
});

test("sanity checker rejects luxury/value contradictions", () => {
  assert.deepEqual(classificationSanity({ ...base, luxuryScore: 35, valueScore: 80 }, { tier: "premium" }), ["premium_positioning_conflict"]);
  assert.deepEqual(classificationSanity({ ...base, luxuryScore: 85, valueScore: 30 }, { tier: "value" }), ["value_positioning_conflict"]);
});

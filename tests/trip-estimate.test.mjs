import test from "node:test";
import assert from "node:assert/strict";
import { destinations } from "../app/data/destinations.js";
import { estimateLine, estimateTrip, formatRange } from "../app/lib/recommendation/tripEstimate.js";

test("trip estimate breakdown sums exactly to the displayed range", () => {
  for (const destination of destinations.slice(0, 60)) {
    const estimate = estimateTrip(destination, { nights: 5, travelers: 2 });
    assert.equal(estimate.breakdown.reduce((sum, item) => sum + item.low, 0), estimate.low, destination.city);
    assert.equal(estimate.breakdown.reduce((sum, item) => sum + item.high, 0), estimate.high, destination.city);
    assert.ok(estimate.low > 0 && estimate.high >= estimate.low, destination.city);
    assert.ok(!estimate.breakdown.some((item) => item.key === "flights"), "flights are excluded");
  }
});

test("estimates scale with travelers and nights", () => {
  const lisbon = destinations.find((item) => item.id === "LIS");
  const small = estimateTrip(lisbon, { nights: 5, travelers: 1 });
  const large = estimateTrip(lisbon, { nights: 7, travelers: 2 });
  assert.ok(large.low > small.low);
  assert.ok(large.high > small.high);
});

test("price formatting uses an en dash, separators and no decimals", () => {
  assert.equal(formatRange(1000, 2300), "$1,000–$2,300");
  assert.equal(formatRange(980.4, 980.4), "$980");
  const line = estimateLine({ low: 1000, high: 2300, travelers: 2, nights: 7 });
  assert.equal(line, "Est. $1,000–$2,300 · 2 travelers · 1 week · before flights");
});

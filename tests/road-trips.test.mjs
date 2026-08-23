import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { matchRoadTrips, roadTripQuestions, roadTripRoutes, selectRoadTrip } from "../app/data/roadTripRoutes.js";

const profile = { landscape: "Coastline", distance: "500 miles", kind: "Slow scenic journey", driving: "Balanced", travelers: "Couple", budget: 3_000 };

test("road-trip quiz is a distinct six-question discovery flow", () => {
  assert.deepEqual(roadTripQuestions.map((question) => question.id), ["landscape", "distance", "kind", "driving", "travelers", "budget"]);
});

test("every editorial route uses verified catalog destinations and coordinates", () => {
  assert.equal(new Set(roadTripRoutes.map((route) => route.id)).size, roadTripRoutes.length);
  for (const route of roadTripRoutes) {
    assert.ok(route.stops.length >= 2);
    for (const stop of route.stops) {
      assert.ok(stop.id);
      assert.ok(Number.isFinite(stop.latitude));
      assert.ok(Number.isFinite(stop.longitude));
      assert.ok(stop.image || stop.placeId);
    }
  }
});

test("budget protection keeps a viable route above an over-budget preference match", () => {
  const ranked = matchRoadTrips(profile);
  assert.notEqual(ranked[0].compatibility.level, "poor");
  assert.equal(selectRoadTrip(profile).id, ranked[0].id);
});

test("different landscapes can produce different primary journeys", () => {
  const coast = selectRoadTrip({ ...profile, budget: 8_000 });
  const desert = selectRoadTrip({ ...profile, landscape: "Desert", kind: "Adventure route", distance: "1,000 miles", budget: 8_000 });
  assert.notEqual(coast.id, desert.id);
});

test("road-trip landing no longer renders the route-planner form", async () => {
  const page = await readFile(new URL("../app/road-trips/page.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /ProductPlanner|fuel tank|fuelEfficiency|vehicleType/);
  assert.match(page, /Create my route/);
});

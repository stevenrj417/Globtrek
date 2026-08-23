import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { cruiseQuestions } from "../app/data/cruiseQuiz.js";
import { cruiseRoutes, selectCruise } from "../app/data/cruiseRoutes.js";
import { matchAirportPlaces } from "../app/lib/recommendation/nearestAirport.js";

const profile = { experience: "Tropical islands", mood: "Relaxed and slow", priority: "Beautiful beaches", duration: "6–8 nights", budget: 2_500, travelers: "Couple", originDetails: { airportCode: "PDX" } };

test("cruise quiz is an ocean-first seven-question flow with origin last", () => {
  assert.deepEqual(cruiseQuestions.map((question) => question.id), ["experience", "mood", "priority", "duration", "budget", "travelers", "origin"]);
});

test("cruise concepts use only verified destination identities and coordinates", () => {
  assert.equal(new Set(cruiseRoutes.map((route) => route.id)).size, cruiseRoutes.length);
  for (const route of cruiseRoutes) for (const port of route.ports) { assert.ok(port.id); assert.ok(Number.isFinite(port.latitude)); assert.ok(Number.isFinite(port.longitude)); assert.ok(port.image); }
});

test("a modest budget preserves a cruise allowance without inventing a fare", () => {
  const route = selectCruise(profile);
  assert.equal(route.id, "caribbean-island-passage");
  assert.notEqual(route.logistics.compatibility.level, "poor");
  assert.ok(route.logistics.cruiseAllowance >= 0);
  assert.equal(route.logistics.isLive, false);
});

test("ocean preference changes the route when the budget supports it", () => {
  const dramatic = selectCruise({ ...profile, experience: "Dramatic landscapes", mood: "Adventure every day", priority: "Nature and wildlife", duration: "9–14 nights", budget: 12_000 });
  assert.equal(dramatic.id, "norwegian-coast");
});

test("location lookup accepts only a confident airport identity match", () => {
  const airports = [{ code: "PDX", name: "Portland International Airport", city: "Portland", country: "US", scheduled: true }, { code: "PWM", name: "Portland International Jetport", city: "Portland", country: "US", scheduled: true }];
  assert.equal(matchAirportPlaces([{ displayName: { text: "Portland International Airport" }, formattedAddress: "Portland, Oregon" }], airports)?.code, "PDX");
  assert.equal(matchAirportPlaces([{ displayName: { text: "Aviation Museum" }, formattedAddress: "Portland, Oregon" }], airports), null);
});

test("cruise pages disclose unverified sailing data instead of rendering the old port form", async () => {
  const landing = await readFile(new URL("../app/cruises/page.jsx", import.meta.url), "utf8");
  const results = await readFile(new URL("../app/cruises/results/CruiseResults.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(landing, /ProductPlanner|Departure port/);
  assert.match(landing, /Find the ocean journey/);
  assert.match(results, /Awaiting a verified sailing|Verified sailing fare required/);
  assert.doesNotMatch(results, /\$12,000|live fare/i);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { cruiseQuestions } from "../app/data/cruiseQuiz.js";
import { cruiseRoutes, selectCruise } from "../app/data/cruiseRoutes.js";
import { matchAirportPlaces } from "../app/lib/recommendation/nearestAirport.js";
import { buildTripEmailModel } from "../app/lib/recommendation/tripSerializer.js";
import { tripEmail } from "../app/lib/email/templates.js";

const profile = { experience: "Tropical islands", mood: "Relaxed and slow", priority: "Beautiful beaches", duration: "6–8 nights", budget: 2_500, travelers: "Couple", originDetails: { airportCode: "PDX" } };

test("cruise quiz is an ocean-first seven-question flow with origin last", () => {
  assert.deepEqual(cruiseQuestions.map((question) => question.id), ["experience", "mood", "priority", "duration", "budget", "travelers", "origin"]);
});

test("cruise concepts use only verified destination identities and coordinates", () => {
  assert.equal(new Set(cruiseRoutes.map((route) => route.id)).size, cruiseRoutes.length);
  for (const route of cruiseRoutes) for (const port of route.ports) { assert.ok(port.id); assert.ok(Number.isFinite(port.latitude)); assert.ok(Number.isFinite(port.longitude)); assert.ok(port.image || port.placeId); }
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
  assert.ok(["norwegian-coast", "alaska-inside-passage"].includes(dramatic.id));
});

test("location lookup accepts only a confident airport identity match", () => {
  const airports = [{ code: "PDX", name: "Portland International Airport", city: "Portland", country: "US", scheduled: true }, { code: "PWM", name: "Portland International Jetport", city: "Portland", country: "US", scheduled: true }];
  assert.equal(matchAirportPlaces([{ displayName: { text: "Portland International Airport" }, formattedAddress: "Portland, Oregon" }], airports)?.code, "PDX");
  assert.equal(matchAirportPlaces([{ displayName: { text: "Aviation Museum" }, formattedAddress: "Portland, Oregon" }], airports), null);
});

test("cruise pages disclose unverified sailing data instead of rendering the old port form", async () => {
  const landing = await readFile(new URL("../app/cruises/page.jsx", import.meta.url), "utf8");
  const quiz = await readFile(new URL("../app/cruises/quiz/CruiseQuiz.jsx", import.meta.url), "utf8");
  const results = await readFile(new URL("../app/cruises/results/CruiseResults.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(landing, /ProductPlanner|Departure port/);
  assert.match(landing, /It’s the journey that counts/);
  assert.match(quiz, /advance\(nextAnswers\)/);
  assert.doesNotMatch(quiz, />Continue</);
  assert.match(quiz, /\$2K–\$4K/);
  assert.match(results, /Ship selection pending|Verified sailing fare required/);
  assert.match(results, /introMapMounted \? <CruiseMap/);
  assert.match(results, /Charting your journey/);
  assert.match(results, /journeyRevealed \? "opacity-100" : "opacity-0"/);
  assert.match(results, /Book your journey/);
  assert.match(results, /EmailTripButton/);
  assert.doesNotMatch(results, /bg-\[#171714\]/);
  assert.doesNotMatch(results, /\$12,000|live fare/i);
});

test("cruise proposal email preserves ports, duration, flight state, and truthful ship status", () => {
  const saved = { destination: { city: "Caribbean Island Passage" }, travelerProfile: { travelers: 2 }, itinerary: { days: [{ location: "Miami", title: "Begin in Miami", morning: "Arrive.", afternoon: "Explore.", evening: "Stay near port." }] }, journey: { type: "cruise", title: "Caribbean Island Passage", duration: "6–8 nights", ports: [{ name: "Miami", country: "United States" }, { name: "Nassau", country: "Bahamas" }], ship: null, flight: { origin: "Portland", destination: "Miami", providerStatus: "Live itinerary not connected" }, cruiseProviderStatus: "Verified sailing provider not connected" } };
  const html = tripEmail({ model: buildTripEmailModel(saved), viewUrl: null });
  assert.match(html, /Miami, United States → Nassau, Bahamas/);
  assert.match(html, /Your 6–8 nights Globtrek journey/);
  assert.match(html, /Port 01 · Miami/);
  assert.doesNotMatch(html, /1 days in Caribbean/);
  assert.match(html, /Pending verified sailing inventory/);
  assert.match(html, /Portland → Miami/);
});

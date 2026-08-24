import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { cruiseQuestions } from "../app/data/cruiseQuiz.js";
import { cruiseRoutes, selectCruise } from "../app/data/cruiseRoutes.js";
import { normalizeCruiseRecord, rankCruises } from "../app/lib/cruises/catalog.js";
import { matchAirportPlaces } from "../app/lib/recommendation/nearestAirport.js";
import { buildTripEmailModel } from "../app/lib/recommendation/tripSerializer.js";
import { tripEmail } from "../app/lib/email/templates.js";

const profile = { experience: "Tropical islands", mood: "Relaxed and slow", priority: "Beautiful beaches", duration: "6–8 nights", budget: 2_500, travelers: "Couple", originDetails: { airportCode: "PDX" } };
const verifiedSailingRow = {
  id: "00000000-0000-4000-8000-000000000001", provider: "cruisedirect_cj", provider_cruise_id: "verified-provider-id", name: "Provider Sailing", cruise_line: "Verified Line", ship_name: "Verified Ship", cruise_type: "ocean", region: "Caribbean", duration_nights: 7,
  departure_date: "2026-12-01", return_date: "2026-12-08", departure_port: { name: "Miami", country: "United States", latitude: 25.778, longitude: -80.177, placeId: "verified-miami" }, arrival_port: { name: "Miami", country: "United States", latitude: 25.778, longitude: -80.177, placeId: "verified-miami" }, sea_days: 2,
  starting_price: 1200, currency: "USD", price_basis: "per_person_double_occupancy", price_is_live: true, price_verified_at: "2026-08-24T00:00:00Z", cabin_information: [{ type: "Balcony", status: "provider supplied" }], description: "Provider supplied description.", image_urls: ["https://images.unsplash.com/photo-verified"], match_tags: ["Caribbean", "beaches"], style_scores: { luxury: 75, relaxation: 92, food: 70 }, provider_url: "https://www.cruisedirect.com/exact-sailing", affiliate_url: "https://www.kqzyfj.com/click-verified", affiliate_url_verified: true, identity_verified: true, itinerary_verified: true, recommendation_ready: true, active: true,
  cruise_itinerary_stops: [
    { day_number: 1, sequence_number: 1, stop_type: "port", port_name: "Miami", country: "United States", latitude: 25.778, longitude: -80.177, place_id: "verified-miami" },
    { day_number: 2, sequence_number: 2, stop_type: "sea_day" },
    { day_number: 3, sequence_number: 3, stop_type: "port", port_name: "Nassau", country: "Bahamas", latitude: 25.044, longitude: -77.35, place_id: "verified-nassau" },
    { day_number: 7, sequence_number: 4, stop_type: "port", port_name: "Miami", country: "United States", latitude: 25.778, longitude: -80.177, place_id: "verified-miami" },
  ],
};

test("cruise quiz captures style, region, water type, season, and origin last", () => {
  assert.deepEqual(cruiseQuestions.map((question) => question.id), ["experience", "mood", "priority", "region", "waterType", "season", "duration", "budget", "travelers", "origin"]);
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

test("only complete provider-backed sailings normalize into recommendation inventory", () => {
  const sailing = normalizeCruiseRecord(verifiedSailingRow);
  assert.equal(sailing.shipName, "Verified Ship");
  assert.equal(sailing.stops.length, 4);
  assert.match(sailing.affiliatePath, /^\/api\/cruises\/outbound\//);
  assert.equal(normalizeCruiseRecord({ ...verifiedSailingRow, affiliate_url_verified: false }), null);
  assert.equal(normalizeCruiseRecord({ ...verifiedSailingRow, starting_price: null }), null);
  assert.equal(normalizeCruiseRecord({ ...verifiedSailingRow, cruise_itinerary_stops: [] }), null);
});

test("cruise matching protects budget and responds to traveler style", () => {
  const relaxed = normalizeCruiseRecord(verifiedSailingRow);
  const adventure = { ...relaxed, id: "00000000-0000-4000-8000-000000000002", name: "Adventure Sailing", styleScores: { adventure: 100, relaxation: 10, nature: 90 }, startingPrice: 1300 };
  const answers = { ...profile, region: "Caribbean", waterType: "Ocean", season: "Winter", budget: 5_000 };
  assert.equal(rankCruises([adventure, relaxed], answers, () => 600)[0].id, relaxed.id);
  assert.equal(rankCruises([relaxed], { ...answers, budget: 1_500 }, () => 600).length, 0);
});

test("the cruise schema contains no fabricated sailing seeds", async () => {
  const migration = await readFile(new URL("../supabase/migrations/202608240001_cruise_inventory.sql", import.meta.url), "utf8");
  assert.match(migration, /recommendation_ready/);
  assert.match(migration, /affiliate_url_verified/);
  assert.doesNotMatch(migration, /insert into public\.cruise_catalog/i);
});

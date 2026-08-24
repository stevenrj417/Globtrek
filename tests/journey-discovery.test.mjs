import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { cruiseDiscovery, exactPlacePhotos, roadTripDiscovery } from "../app/data/journeyDiscovery.js";
import { selectCruise } from "../app/data/cruiseRoutes.js";
import { selectRoadTrip } from "../app/data/roadTripRoutes.js";
import { normalizeLocationPlace } from "../app/lib/recommendation/locationSearch.js";
import { originFromTrip } from "../app/lib/recommendation/travelArea.js";

const portland = { type: "city", placeId: "place:portland", city: "Portland", countryCode: "US", countryName: "United States", latitude: 45.5152, longitude: -122.6784, verificationSource: "google_places" };

test("every discovery card uses an allowlisted exact Google identity", () => {
  for (const item of [...roadTripDiscovery, ...cruiseDiscovery]) {
    assert.ok(item.placeId);
    assert.ok(exactPlacePhotos[item.placeId], `${item.name} must have exact-place photo metadata`);
    assert.match(exactPlacePhotos[item.placeId].sourceUrl, /^https:\/\/maps\.google\.com\//);
  }
});

test("Google location results are normalized into globally structured origins", () => {
  const origin = normalizeLocationPlace({ id: "place:paris", displayName: { text: "Paris" }, location: { latitude: 48.8566, longitude: 2.3522 }, formattedAddress: "Paris, France", types: ["locality"], addressComponents: [{ longText: "Paris", shortText: "Paris", types: ["locality"] }, { longText: "France", shortText: "FR", types: ["country"] }] });
  assert.deepEqual(origin, { type: "city", placeId: "place:paris", city: "Paris", countryCode: "FR", countryName: "France", latitude: 48.8566, longitude: 2.3522, airportCode: null, airportName: null, formattedAddress: "Paris, France", googleMapsUri: null, verificationSource: "google_places" });
  assert.equal(originFromTrip({ originDetails: origin }).countryCode, "FR");
  assert.equal(originFromTrip({ originDetails: origin }).airportCode, null);
});

test("search-selected road and cruise journeys remain exact while exposing truthful budget fit", () => {
  const road = selectRoadTrip({ requestedRouteId: "iceland-ring-road", originDetails: portland, budget: 1_000, travelers: "Couple", duration: "One week", driving: "Balanced" });
  assert.equal(road.id, "iceland-ring-road");
  assert.equal(road.compatibility.level, "poor");
  assert.equal(road.estimate.access.mode, "flight_and_rental");

  const cruise = selectCruise({ requestedRouteId: "alaska-inside-passage", originDetails: portland, budget: 1_000, travelers: "Couple", duration: "6–8 nights", mood: "Adventure every day" });
  assert.equal(cruise.id, "alaska-inside-passage");
  assert.equal(cruise.logistics.compatibility.level, "poor");
  assert.equal(cruise.logistics.isLive, false);
});

test("a selected road-trip duration changes its days and grounded estimate", () => {
  const short = selectRoadTrip({ requestedRouteId: "california-coast", originDetails: portland, budget: 20_000, travelers: "Couple", duration: "3–5 days", driving: "Balanced" });
  const long = selectRoadTrip({ requestedRouteId: "california-coast", originDetails: portland, budget: 20_000, travelers: "Couple", duration: "15+ days", driving: "Balanced" });
  assert.equal(short.days, 4);
  assert.equal(long.days, 16);
  assert.ok(long.estimate.low > short.estimate.low);
});

test("landing searches, trending cards, and homepage shortcuts open destination-specific mini quizzes", async () => {
  const [roadPage, cruisePage, homePage, roadQuiz, cruiseQuiz, quickQuiz] = await Promise.all([
    readFile(new URL("../app/road-trips/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cruises/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/road-trips/quiz/RoadTripQuiz.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cruises/quiz/CruiseQuiz.jsx", import.meta.url), "utf8"),
    readFile(new URL("../app/discover/quick/QuickTripQuiz.jsx", import.meta.url), "utf8"),
  ]);
  for (const page of [roadPage, cruisePage]) {
    assert.match(page, /JourneySearch/);
    assert.match(page, /JourneyCards/);
  }
  assert.match(roadPage, /ExactPlacePhoto/);
  assert.match(cruisePage, /cruise-hero-v2\.jpg/);
  assert.match(homePage, /\/discover\/quick\?destination=/);
  for (const quiz of [roadQuiz, cruiseQuiz]) {
    assert.match(quiz, /StartingLocationField/);
    assert.match(quiz, /requestedRouteId/);
  }
  assert.match(quickQuiz, /Leaving from/);
  assert.match(quickQuiz, /preferredDestination/);
});

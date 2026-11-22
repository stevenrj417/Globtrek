import test from "node:test";
import assert from "node:assert/strict";
import { THEMED_TRIPS, THEMED_PHOTOS, EXTRAS, PACKAGES, SEVEN_WONDERS } from "../app/data/themedTrips.js";
import { destinationFor, planSevenContinents, priceAllWonders, priceRoute } from "../app/lib/themed/price.js";
import { modeledDormNight } from "../app/lib/recommendation/budgetEngine.js";
import { buildDestinationPlanningAverages } from "../app/data/destinationPlanningAverages.js";
import { destinations } from "../app/data/destinations.js";

const options = { origin: "JFK", travelers: 2, start: "2027-04-12", style: "value" };

test("every themed trip has real stops, a photo it can use, and a price", () => {
  assert.equal(new Set(THEMED_TRIPS.map((trip) => trip.slug)).size, THEMED_TRIPS.length);
  for (const trip of THEMED_TRIPS) {
    for (const stop of trip.stops) assert.ok(stop.package ? PACKAGES[stop.package] : destinationFor(stop.id), `${trip.slug}: ${stop.id || stop.package}`);
    if (trip.photo) assert.ok(THEMED_PHOTOS[trip.photo], `${trip.slug} photo`);
    for (const key of trip.extras || []) assert.ok(EXTRAS[key], `${trip.slug} extra ${key}`);
    const priced = priceRoute(trip, options);
    assert.ok(priced.total > 0 && priced.low <= priced.total && priced.total <= priced.high, trip.slug);
    assert.equal(priced.perPerson, Math.round(priced.total / 2));
  }
});

test("stops run back to back and month-long stays are priced for every night", () => {
  const kyoto = priceRoute(THEMED_TRIPS.find((trip) => trip.slug === "a-month-in-kyoto"), options);
  assert.equal(kyoto.nights, 29);
  const egypt = priceRoute(THEMED_TRIPS.find((trip) => trip.slug === "ancient-wonders"), options);
  assert.equal(egypt.stops[0].end, egypt.stops[1].start);
  assert.equal(egypt.legs.length, 3);
});

test("the Antarctic ship is priced at operators' published fares and only in season", () => {
  const trip = priceRoute(THEMED_TRIPS.find((item) => item.slug === "the-last-continent"), { ...options, start: "2027-12-01" });
  const ship = trip.stops.find((stop) => stop.kind === "package");
  assert.equal(ship.total, PACKAGES.antarctica.perPerson.typical * 2);
  assert.equal(ship.inSeason, true);
  const july = planSevenContinents(1, { ...options, start: "2027-05-01" });
  assert.ok(july.suggestedStart, "an out-of-season ship suggests a start that sails in season");
});

test("all seven wonders include all seven entry tickets", () => {
  const trip = priceAllWonders(options);
  assert.equal(trip.extras.length, SEVEN_WONDERS.length);
  assert.equal(trip.stops.length, 7);
});

test("seven continents adds stops as the trip gets longer", () => {
  const short = planSevenContinents(1, options);
  const long = planSevenContinents(12, options);
  assert.ok(long.stops.length > short.stops.length);
  assert.ok(Math.abs(long.nights - 365) <= 2);
});

test("a modeled dorm bed never drops below $6 or 30% of a room", () => {
  assert.equal(modeledDormNight(2, 22), 7);
  assert.equal(modeledDormNight(3, 10), 6);
  assert.equal(modeledDormNight(20, 40), 20);
});

test("a local price in the wrong currency is not used (Havana)", () => {
  const havana = destinations.find((item) => item.id === "havana-c484b");
  const plan = buildDestinationPlanningAverages(havana);
  assert.notEqual(plan.model, "local_prices");
  assert.ok(plan.monthly[0].hotelNight < 200);
});

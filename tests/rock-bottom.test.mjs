import test from "node:test";
import assert from "node:assert/strict";
import { destinations } from "../app/data/destinations.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";
import { rankDestinations } from "../app/lib/recommendation/destinationEngine.js";
import { buildBudgetPlan } from "../app/lib/recommendation/budgetEngine.js";
import { estimateFlight } from "../app/lib/recommendation/travelFeasibility.js";
import { snapshotFare } from "../app/data/fareSnapshots.js";
import { LAUNCH_SET, launchHotels } from "../app/data/launchSet.js";

const origin = { airportCode: "PDX", countryCode: "US", countryName: "United States", latitude: 45.59, longitude: -122.6 };
const quiz = (extra) => ({ originDetails: origin, travelAreaPreference: "anywhere", exactBudget: 5000, answers: { exactBudget: 5000 }, ...extra });
const vegas = destinations.find((item) => item.id === "las-vegas-76868");

test("GlobTrek defaults to the rock-bottom plan", () => {
  assert.equal(normalizeTravelerProfile(quiz({})).spendStyle, "cheapest");
});

test("rock bottom prices a real hostel bed, cheap food and free activities", () => {
  const plan = buildBudgetPlan(normalizeTravelerProfile(quiz({ guestCount: "1", tripNights: 4 })), vegas);
  assert.equal(plan.lodging.type, "hostel_bed");
  assert.equal(plan.lodging.name, "Sin City Hostel");
  // No dates: priced for January, the cheapest month to fly ($50 × 1.05 a bed).
  assert.equal(plan.lodging.month, 1);
  assert.equal(plan.estimates.hotel.average, 212);
  assert.equal(plan.estimates.activities.average, 0);
  assert.equal(plan.estimates.food.average, 88);
});

test("hostel beds follow the season for the travel month", () => {
  const bed = (start, item = vegas) => buildBudgetPlan(normalizeTravelerProfile(quiz({ guestCount: "1", tripNights: 4, tripStart: start, tripEnd: start, isFlexible: false })), item).lodging.perBedNight;
  assert.equal(bed("2027-02-09"), 50);
  assert.ok(bed("2027-07-13") < bed("2027-12-14"));
  const lisbon = destinations.find((item) => item.id === "LIS");
  assert.ok(bed("2027-07-13", lisbon) > bed("2027-01-12", lisbon) * 1.5);
});

test("every launch city lists real Booking.com stays with CJ links", () => {
  for (const id of LAUNCH_SET) {
    for (const hotel of launchHotels(id)) {
      assert.match(hotel.bookingUrl, /^https:\/\/www\.booking\.com\/hotel\//, `${id} ${hotel.name}`);
      if (hotel.cjTrackingBaseUrl) assert.match(hotel.cjTrackingBaseUrl, /^https:\/\/www\.(anrdoezrs\.net|kqzyfj\.com|dpbolvw\.net|jdoqocy\.com|tkqlhce\.com)\/click-101801755-\d+$/);
      if (hotel.fromFeed) assert.ok(!hotel.starRating || hotel.starRating <= 3, `${hotel.name} is not a budget stay`);
    }
  }
});

test("a private room wins when it costs less than beds for the group", () => {
  const plan = buildBudgetPlan(normalizeTravelerProfile(quiz({ guestCount: "2", tripNights: 4 })), vegas);
  assert.equal(plan.lodging.type, "private_room");
  assert.ok(plan.lodging.perNight < 100);
});

test("asking for a hostel or a private room is respected", () => {
  const two = { guestCount: "2", tripNights: 4 };
  assert.equal(buildBudgetPlan(normalizeTravelerProfile(quiz({ ...two, answers: { hotel: "Hostel bed" } })), vegas).lodging.type, "hostel_bed");
  assert.equal(buildBudgetPlan(normalizeTravelerProfile(quiz({ guestCount: "1", tripNights: 4, answers: { hotel: "Private room" } })), vegas).lodging.type, "private_room");
});

test("flights use the real fare for the chosen month", () => {
  const december = estimateFlight(normalizeTravelerProfile(quiz({ tripStart: "2026-12-08", tripEnd: "2026-12-12" })), vegas);
  assert.equal(december.priceSource, "google_flights_snapshot");
  assert.equal(december.average, 233);
  assert.match(december.basis, /December 2026/);
  const july = estimateFlight(normalizeTravelerProfile(quiz({ tripStart: "2027-07-13", tripEnd: "2027-07-17" })), vegas);
  assert.equal(july.priceSource, "us_dot_average_fare_paid");
});

test("with no dates, the cheapest month on file is used and named", () => {
  const fare = snapshotFare("PDX", "LAS", null, true);
  assert.equal(fare.month, "2027-01");
  assert.equal(fare.cheapestMonth, true);
});

test("the cheapest trip from the traveler's airport ranks first", () => {
  const ranked = rankDestinations(destinations, normalizeTravelerProfile(quiz({ guestCount: "1", tripNights: 4, isFlexible: true })));
  const top = ranked.slice(0, 5).map((item) => item.budgetPlan.budgetCheckTotal);
  assert.ok(top[0] < 500, `cheapest trip is $${top[0]}`);
  assert.ok(Math.max(...top) < Math.min(...ranked.slice(20).map((item) => item.budgetPlan.budgetCheckTotal)));
});

test("Palm Springs is out of the launch set; every launch city leads with its hostel", () => {
  assert.ok(!LAUNCH_SET.includes("palm-springs-76868"));
  for (const id of LAUNCH_SET) assert.equal(launchHotels(id)[0].priceTier, "hostel", id);
});

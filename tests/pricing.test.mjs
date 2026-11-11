import assert from "node:assert/strict";
import test from "node:test";
import { aggregateFor, periodSummaries, toUsd, usdRate } from "../app/lib/pricing/aggregate.js";
import { dedupe, observation, travelPeriod } from "../app/lib/pricing/observations.js";
import { observedFare } from "../app/lib/pricing/observedFares.js";
import { dormOnly } from "../app/lib/recommendation/stayShortlist.js";

const NOW = Date.parse("2026-11-12T00:00:00Z");
const fare = (price, travelDate, observedAt = "2026-11-10", extra = {}) => observation({ kind: "flight", itemId: "PDX-CDG", provider: "aviasales", observedAt, travelDate, price, currency: "USD", ...extra });

test("an observation keeps the day it was seen apart from the day it prices", () => {
  const row = fare(612, "2027-06-14", "2026-11-10");
  assert.equal(row.observedAt, "2026-11-10");
  assert.equal(row.travelDate, "2027-06-14");
  assert.equal(row.unit, "per_passenger_round_trip");
  assert.equal(observation({ kind: "flight", itemId: "x", observedAt: "2026-11-10", price: 0, currency: "USD" }), null, "no zero prices");
  assert.equal(observation({ kind: "hotel", itemId: "x", observedAt: "2026-11-10", price: 5, currency: "USD" }), null, "unknown kinds are rejected");
  assert.equal(observation({ kind: "flight", itemId: "x", observedAt: "yesterday", price: 5, currency: "USD" }), null, "observation date required");
});

test("half-month travel periods split on the 15th", () => {
  assert.equal(travelPeriod("2027-06-15"), "06a");
  assert.equal(travelPeriod("2027-06-16"), "06b");
  assert.equal(travelPeriod(null), null);
});

test("the same price seen twice on one day counts once", () => {
  assert.equal(dedupe([fare(500, "2027-06-03"), fare(500, "2027-06-03"), fare(500, "2027-06-03", "2026-11-11")]).length, 2);
});

test("averages use the half-month, then the month, and never invent a price", () => {
  const early = [fare(500, "2027-06-02"), fare(520, "2027-06-05"), fare(540, "2027-06-09")];
  const biweekly = aggregateFor(early, "2027-06-12", { now: NOW });
  assert.equal(biweekly.basis, "observed_biweekly");
  assert.equal(biweekly.samples, 3);
  assert.equal(biweekly.medianUsd, 520);
  const monthly = aggregateFor([fare(500, "2027-06-02"), fare(520, "2027-06-20"), fare(540, "2027-06-28")], "2027-06-05", { now: NOW });
  assert.equal(monthly.basis, "observed_monthly");
  assert.equal(aggregateFor([fare(500, "2027-06-02")], "2027-06-05", { now: NOW }).basis, "insufficient");
  assert.equal(aggregateFor([], "2027-06-05", { now: NOW }).basis, "none");
  assert.equal(aggregateFor(early, "2027-08-05", { now: NOW }).basis, "insufficient", "June fares never price an August trip");
});

test("old observations stop counting and fresh-but-thin data is marked stale", () => {
  const old = [fare(500, "2026-06-02", "2025-06-01"), fare(520, "2026-06-05", "2025-06-01"), fare(540, "2026-06-09", "2025-06-01")];
  assert.equal(aggregateFor(old, "2027-06-05", { now: NOW }).basis, "none");
  const aging = [fare(500, "2027-06-02", "2026-09-01"), fare(520, "2027-06-05", "2026-09-01"), fare(540, "2027-06-09", "2026-09-01")];
  assert.equal(aggregateFor(aging, "2027-06-05", { now: NOW }).stale, true);
});

test("prices are converted at the rate for the day they were seen; unknown currencies are dropped", () => {
  assert.equal(usdRate("USD", "2026-11-10"), 1);
  assert.ok(usdRate("EUR", "2026-11-10") > 0.9 && usdRate("EUR", "2026-11-10") < 1.4);
  assert.ok(usdRate("VND", "2026-11-10") > 0, "currencies the ECB doesn't publish use the fallback rate");
  const euro = observation({ kind: "activity", itemId: "t", observedAt: "2026-11-10", travelDate: "2027-06-02", price: 100, currency: "EUR" });
  assert.equal(toUsd(euro), Math.round(100 * usdRate("EUR", "2026-11-10") * 100) / 100);
  const unknown = observation({ kind: "activity", itemId: "t", observedAt: "2026-11-10", travelDate: "2027-06-02", price: 100, currency: "XXX" });
  assert.equal(aggregateFor([unknown, unknown, unknown], "2027-06-02", { now: NOW }).basis, "none");
});

test("period summaries only publish periods with enough observations", () => {
  const summaries = periodSummaries([fare(500, "2027-06-02"), fare(520, "2027-06-05"), fare(540, "2027-06-09"), fare(900, "2027-07-01")], { now: NOW });
  assert.deepEqual(Object.keys(summaries).sort(), ["06", "06a"]);
});

test("observed fares match exact airports first, then metro codes, and say so", () => {
  const exact = observedFare({ origin: "LAX", destination: "HNL", departDate: "2026-12-05" });
  assert.equal(exact.route, "LAX-HNL");
  assert.equal(exact.metroDestination, null);
  assert.ok(["observed_biweekly", "observed_monthly"].includes(exact.basis));
  assert.ok(exact.samples >= 3);
  const metro = observedFare({ origin: "JFK", destination: "CDG" });
  if (metro) assert.ok(metro.metroOrigin === "NYC" || metro.metroDestination === "PAR", "a fare filed under a city code is labeled as such");
  assert.equal(observedFare({ origin: "LAX", destination: "ZZZ" }), null);
  assert.equal(observedFare({ origin: null, destination: "HNL" }), null);
});

test("a traveler who asked for a private room never gets a dorm-only place", () => {
  assert.equal(dormOnly({ dorms: true, roomTypes: ["Bed in 6-Bed Dormitory Room"] }), true);
  assert.equal(dormOnly({ priceTier: "hostel" }), true, "a hostel with unknown rooms is not assumed to have private ones");
  assert.equal(dormOnly({ dorms: true, roomTypes: ["Bed in 6-Bed Dormitory Room", "Double Room with Private Bathroom"] }), false);
  assert.equal(dormOnly({ starRating: 3, roomTypes: ["Double Room"] }), false);
});

test("the browser prices a flight from the server's observed fare, and never a stale one", async () => {
  const { estimateFlight } = await import("../app/lib/recommendation/travelFeasibility.js");
  const { normalizeTravelerProfile } = await import("../app/lib/recommendation/travelerProfile.js");
  const profile = normalizeTravelerProfile({ originAirport: "LAX", tripStart: "2026-12-03", tripEnd: "2026-12-10", isFlexible: false, guestCount: "1", answers: {} });
  const server = { route: "LAX-HNL", basis: "observed_biweekly", period: "12a", averageUsd: 443, medianUsd: 410, lowUsd: 300, highUsd: 620, samples: 14, observedFrom: "2026-11-04", observedTo: "2026-11-10", stale: false };
  const flight = estimateFlight(profile, { airport: "HNL" }, { observed: server });
  assert.equal(flight.priceSource, "aviasales_observed_biweekly");
  assert.equal(flight.average, 443);
  assert.match(flight.basis, /not a live quote/);
  const stale = estimateFlight(profile, { airport: "HNL" }, { observed: { ...server, stale: true } });
  assert.notEqual(stale.priceSource, "aviasales_observed_biweekly");
});

test("a private room with a shared bathroom is still a private room", () => {
  assert.equal(dormOnly({ dorms: true, roomTypes: ["Double Room with Shared Bathroom"] }), false);
  assert.equal(dormOnly({ dorms: true, roomTypes: ["Bed in 6-Bed Mixed Dormitory Room"] }), true);
});

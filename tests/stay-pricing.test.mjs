import test from "node:test";
import assert from "node:assert/strict";
import { hotelPeriodProfile, nightsByPeriod, periodBounds, periodOf, robustStats } from "../app/lib/pricing/stayPeriods.js";
import { demandEvents, easter } from "../app/lib/pricing/demandCalendar.js";
import { cheaperWindows, estimateStay, stayEstimateOption } from "../app/lib/pricing/stayEstimate.js";
import { availabilityBody, cheapestQuote, quoteObservation, quoteStays, validStay } from "../app/lib/pricing/bookingDemand.js";
import { planRefresh, peakWindows } from "../app/lib/pricing/stayRefresh.js";

const NOW = Date.parse("2026-11-12T00:00:00Z");
const paris = { id: "CDG", airport: "CDG", country: "FRANCE" };
const bangkok = { id: "BKK", airport: "BKK", country: "THAILAND" };
const newYork = { id: "JFK", airport: "JFK", country: "UNITED STATES" };

function stayRows(itemId, nightly, { from = "2026-07-01", days = 14, observedAt = "2026-06-01", roomType = "double", occupancy = 2 } = {}) {
  const start = Date.parse(`${from}T00:00:00Z`);
  return Array.from({ length: days }, (_, index) => ({ kind: "stay", itemId, provider: "booking.com", observedAt, travelDate: new Date(start + index * 86400000).toISOString().slice(0, 10), price: typeof nightly === "function" ? nightly(index) : nightly, currency: "USD", unit: "per_night", occupancy, roomType }));
}

test("the year splits into 26 fourteen-day periods, the last taking leftover days", () => {
  assert.deepEqual(periodOf("2026-01-01"), { year: 2026, period: 1 });
  assert.deepEqual(periodOf("2026-01-14"), { year: 2026, period: 1 });
  assert.deepEqual(periodOf("2026-01-15"), { year: 2026, period: 2 });
  assert.deepEqual(periodOf("2026-01-29"), { year: 2026, period: 3 });
  assert.deepEqual(periodOf("2026-12-31"), { year: 2026, period: 26 });
  assert.deepEqual(periodOf("2028-12-31"), { year: 2028, period: 26 });
  assert.deepEqual(periodBounds(2026, 26), { start: "2026-12-17", end: "2026-12-31" });
  assert.deepEqual(periodBounds(2026, 2), { start: "2026-01-15", end: "2026-01-28" });
});

test("a stay crossing periods is counted night by night", () => {
  assert.deepEqual(nightsByPeriod("2026-01-12", "2026-01-17"), [{ year: 2026, period: 1, nights: 3 }, { year: 2026, period: 2, nights: 2 }]);
  assert.deepEqual(nightsByPeriod("2026-12-30", "2027-01-02"), [{ year: 2026, period: 26, nights: 2 }, { year: 2027, period: 1, nights: 1 }]);
});

test("one promotional rate or one suite doesn't move the representative price", () => {
  const stats = robustStats([180, 185, 190, 182, 188, 179, 900, 40]);
  assert.equal(stats.excluded, 2);
  assert.ok(stats.median >= 180 && stats.median <= 188);
  assert.equal(stats.max, 190);
});

test("profiles belong to one property and keep room types apart", () => {
  const rows = [...stayRows("booking:1", 185, { from: "2026-01-01" }), ...stayRows("booking:1", 420, { from: "2026-01-01", roomType: "suite" }), ...stayRows("booking:1", 310)];
  const profile = hotelPeriodProfile(rows, { now: NOW });
  assert.equal(profile.rooms["2|double|any"][1].median, 185);
  assert.equal(profile.rooms["2|suite|any"][1].median, 420);
  assert.equal(profile.rooms["2|double|any"][periodOf("2026-07-05").period].median, 310);
});

test("thin data is marked insufficient, not averaged", () => {
  const profile = hotelPeriodProfile(stayRows("booking:2", 100, { days: 2 }), { now: NOW });
  const period = profile.rooms["2|double|any"][periodOf("2026-07-01").period];
  assert.equal(period.status, "insufficient");
  assert.equal(period.median, undefined);
});

test("an exact-date quote outranks the hotel's seasonal profile", () => {
  const rows = stayRows("booking:3", 200, { from: "2026-12-01", days: 30 });
  const profile = hotelPeriodProfile(rows, { now: NOW });
  const quote = { checkIn: "2026-12-06", checkOut: "2026-12-13", adults: 2, rooms: 1, total: 1050, currency: "USD", taxesIncluded: true, quotedAt: "2026-11-12" };
  const live = estimateStay({ destination: paris, checkIn: "2026-12-06", checkOut: "2026-12-13", adults: 2, quote, profile, observations: rows, today: "2026-11-12" });
  assert.equal(live.kind, "live_quote");
  assert.equal(live.total, 1050);
  const wrongDates = estimateStay({ destination: paris, checkIn: "2026-12-07", checkOut: "2026-12-14", adults: 2, quote, profile, observations: rows, today: "2026-11-12" });
  assert.equal(wrongDates.kind, "hotel_profile");
  assert.equal(wrongDates.total, 1400);
});

test("a stay over two periods blends the hotel's own period prices", () => {
  const rows = [...stayRows("booking:4", 150, { from: "2026-01-01" }), ...stayRows("booking:4", 250, { from: "2026-01-15" })];
  const estimate = estimateStay({ destination: bangkok, checkIn: "2026-01-12", checkOut: "2026-01-17", adults: 2, profile: hotelPeriodProfile(rows, { now: NOW }), observations: rows });
  assert.equal(estimate.kind, "hotel_profile");
  assert.equal(estimate.blended, true);
  assert.equal(estimate.total, 150 * 3 + 250 * 2);
});

test("holidays depend on the destination and the exact dates", () => {
  const thanksgiving = demandEvents(newYork, "2026-11-24", "2026-11-30").map((event) => event.id);
  assert.ok(thanksgiving.includes("thanksgiving"));
  assert.equal(demandEvents(bangkok, "2026-11-24", "2026-11-30").length, 0);
  assert.ok(demandEvents(bangkok, "2027-04-11", "2027-04-17").some((event) => event.id === "songkran"));
  assert.ok(demandEvents({ id: "MUC", airport: "MUC", country: "GERMANY" }, "2026-09-25", "2026-09-28").some((event) => event.id === "oktoberfest"));
  assert.equal(new Date(easter(2027)).toISOString().slice(0, 10), "2027-03-28");
});

test("event nights use the hotel's own observed price, never a flat surcharge", () => {
  const ordinary = stayRows("booking:5", 200, { from: "2026-11-15", days: 10 });
  const thanksgiving = stayRows("booking:5", 340, { from: "2026-11-25", days: 4, observedAt: "2026-10-01" });
  const rows = [...ordinary, ...thanksgiving];
  const estimate = estimateStay({ destination: newYork, checkIn: "2026-11-25", checkOut: "2026-11-28", adults: 2, profile: hotelPeriodProfile(rows, { now: NOW }), observations: rows });
  assert.equal(estimate.kind, "hotel_profile");
  assert.equal(estimate.eventNightsObserved, 3);
  assert.equal(estimate.total, 340 * 3);
  const elsewhere = estimateStay({ destination: bangkok, checkIn: "2026-11-25", checkOut: "2026-11-28", adults: 2, modeledNightly: 60 });
  assert.equal(elsewhere.kind, "modeled");
  assert.equal(elsewhere.demandNote, null);
});

test("without property data the estimate is labeled modeled, and without any it's unavailable", () => {
  assert.equal(estimateStay({ destination: paris, checkIn: "2026-12-24", checkOut: "2026-12-27", modeledNightly: 120 }).kind, "modeled");
  assert.match(estimateStay({ destination: paris, checkIn: "2026-12-24", checkOut: "2026-12-27", modeledNightly: 120 }).demandNote, /Christmas/);
  assert.equal(estimateStay({ destination: paris, checkIn: "2026-12-24", checkOut: "2026-12-27" }).kind, "unavailable");
  assert.equal(stayEstimateOption({ kind: "modeled", total: 360, nights: 3, rooms: 1 }), null);
});

test("flexible dates compare only windows priced from real data", () => {
  const rows = [...stayRows("booking:6", 120, { from: "2027-02-01", days: 14 }), ...stayRows("booking:6", 90, { from: "2027-02-15", days: 14 })];
  const windows = cheaperWindows({ destination: paris, nights: 3, from: "2027-02-01", to: "2027-03-01", profile: hotelPeriodProfile(rows, { now: NOW }), observations: rows });
  assert.ok(windows.length >= 2);
  assert.ok(windows[0].total < windows.at(-1).total);
});

const demandEntry = {
  id: 12345,
  currency: "EUR",
  deep_link_url: "https://www.booking.com/hotel/fr/example.html",
  products: [
    { id: "p1", room: 77, maximum_occupancy: { adults: 2, total: 2 }, price: { book: 600, total: 640, extra_charges: { included: [{ total_amount: 54 }], excluded: [{ total_amount: 40 }], conditional: [] } }, policies: { cancellation: { type: "free_cancellation", free_cancellation_until: "2026-12-01T00:00:00Z" }, meal_plan: { plan: "breakfast_included" } } },
    { id: "p2", room: 78, maximum_occupancy: { adults: 1, total: 1 }, price: { book: 300, total: 300 }, policies: { cancellation: { type: "non_refundable" } } },
  ],
};

test("Demand API responses become quotes for rooms that fit the party", () => {
  const quote = cheapestQuote(demandEntry, { checkIn: "2026-12-05", checkOut: "2026-12-09", adults: 2, rooms: 1, quotedAt: "2026-11-12T10:00:00Z" });
  assert.equal(quote.productId, "p1");
  assert.equal(quote.total, 640);
  assert.equal(quote.displayPrice, 600);
  assert.equal(quote.taxesAndFees, 94);
  assert.equal(quote.refundable, true);
  assert.equal(quote.mealPlan, "breakfast_included");
  const obs = quoteObservation(quote, { itemId: "booking:12345", destinationId: "CDG" });
  assert.equal(obs.price, 160);
  assert.equal(obs.unit, "per_night");
  assert.equal(obs.travelEnd, "2026-12-09");
});

test("the Demand API request matches the documented shape and limits", () => {
  const body = availabilityBody({ ids: ["1", "2"], checkIn: "2026-12-05", checkOut: "2026-12-09", adults: 2 });
  assert.deepEqual(body.accommodations, [1, 2]);
  assert.deepEqual(body.guests, { number_of_adults: 2, number_of_rooms: 1 });
  assert.deepEqual(body.booker, { country: "us", platform: "desktop" });
  assert.equal(availabilityBody({ ids: ["9"], checkIn: "2026-12-05", checkOut: "2026-12-09", adults: 1 }).accommodation, 9);
  assert.equal(validStay({ checkIn: "2026-12-05", checkOut: "2027-03-10", today: "2026-11-12" }), false);
  assert.equal(validStay({ checkIn: "2028-06-01", checkOut: "2028-06-03", today: "2026-11-12" }), false);
});

test("without credentials nothing is requested or invented", async () => {
  let called = false;
  const result = await quoteStays({ ids: ["1"], checkIn: "2026-12-05", checkOut: "2026-12-09", adults: 2, env: {}, fetchImpl: async () => { called = true; } });
  assert.deepEqual(result, { configured: false, quotes: {} });
  assert.equal(called, false);
});

test("refresh planning puts viewed stays and near dates first, and holiday weeks in the queue", () => {
  const plan = planRefresh([
    { itemId: "a", checkIn: "2027-05-01", checkOut: "2027-05-04", reason: "stale" },
    { itemId: "b", checkIn: "2026-12-01", checkOut: "2026-12-04", reason: "viewed" },
    { itemId: "c", checkIn: "2025-01-01", checkOut: "2025-01-04", reason: "viewed" },
  ], { today: "2026-11-12" });
  assert.deepEqual(plan.map((row) => row.itemId), ["b", "a"]);
  assert.ok(peakWindows(newYork, { today: "2026-11-01", horizonDays: 60 }).some((window) => window.event === "US Thanksgiving"));
});

test("islands and resorts use local prices only where budget lodging is listed", async () => {
  const { localPrices, MIN_BUDGET_STAYS } = await import("../app/data/destinationPlanningAverages.js");
  const feed = (await import("../app/data/feedStayCounts.json", { with: { type: "json" } })).default;
  const { destinations } = await import("../app/data/destinations.js");
  for (const destination of destinations.filter((item) => (item.destinationType || "city") !== "city")) {
    const local = localPrices(destination);
    if (local && destination.planningAverages.model === "local_prices") {
      assert.ok((feed.budget?.[destination.id] || 0) >= MIN_BUDGET_STAYS, destination.id);
      assert.equal(local.area, true);
      assert.equal(destination.planningAverages.confidence, 0.4);
    } else if (!local) {
      assert.notEqual(destination.planningAverages.model, "local_prices", destination.id);
    }
  }
});

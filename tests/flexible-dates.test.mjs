import test from "node:test";
import assert from "node:assert/strict";
import { spreadOverStay, suggestedDates, travelPeriod } from "../app/lib/trip/period.js";
import { buildBookingManifest } from "../app/lib/booking/manifest.js";
import { decodeBookingPage, encodeBookingPage } from "../app/lib/booking/bookPage.js";

const now = new Date("2026-11-20T12:00:00Z");
const weekday = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay();

test("flexible trips get a weekend start inside their season, the same every time", () => {
  for (const [season, months] of [["Spring (Mar-May)", [3, 4, 5]], ["Summer (Jun-Aug)", [6, 7, 8]], ["Fall (Sep-Nov)", [9, 10, 11]], ["Winter (Dec-Feb)", [12, 1, 2]]]) {
    const period = travelPeriod({ flexible: true, season }, now);
    for (const seed of ["MEX:5", "LIS:7", "HAN:3", "PDX:14"]) {
      const nights = Number(seed.split(":")[1]);
      const dates = suggestedDates({ period, pricedMonth: period.planningMonth, nights, seed }, now);
      assert.ok(months.includes(Number(dates.start.slice(5, 7))), `${season} ${dates.start}`);
      assert.ok([5, 6].includes(weekday(dates.start)), `${dates.start} is a Friday or Saturday`);
      assert.equal((Date.parse(dates.end) - Date.parse(dates.start)) / 86400000, nights);
      assert.ok(Date.parse(dates.start) >= Date.parse("2026-12-11"), "at least three weeks out");
      assert.deepEqual(suggestedDates({ period, pricedMonth: period.planningMonth, nights, seed }, now), dates);
      assert.equal(dates.suggested, true);
    }
  }
});

test("suggested stays start in the priced month and skip Christmas and New Year", () => {
  const period = travelPeriod({ flexible: true, season: "Spring (Mar-May)" }, now);
  assert.equal(suggestedDates({ period, pricedMonth: 4, nights: 5, seed: "x" }, now).start.slice(0, 7), "2027-04");
  const winter = travelPeriod({ flexible: true, season: "Winter (Dec-Feb)" }, now);
  for (const seed of "abcdefghijklmnop") {
    const { start, end } = suggestedDates({ period: winter, pricedMonth: 12, nights: 7, seed }, now);
    assert.ok(end < "2026-12-20" || start > "2027-01-02", `${start}–${end} avoids the holidays`);
  }
});

test("dinners land on evenings and activities on mornings during the stay", () => {
  assert.deepEqual(spreadOverStay(2, { start: "2027-04-09", nights: 5 }, "19:30"), ["2027-04-10T19:30", "2027-04-12T19:30"]);
  assert.deepEqual(spreadOverStay(1, { start: "2027-04-09", nights: 1 }, "19:30"), ["2027-04-09T19:30"]);
  for (const when of spreadOverStay(6, { start: "2027-04-09", nights: 3 }, "10:00")) assert.ok(when >= "2027-04-09" && when < "2027-04-12");
  assert.deepEqual(spreadOverStay(2, { start: null, nights: 3 }, "19:30"), []);
});

test("the booking page carries suggested dates, dinner times and OpenTable date and party", () => {
  const manifest = buildBookingManifest({
    destination: { city: "Lisbon", country: "Portugal" },
    dates: { start: "2027-04-09", end: "2027-04-14", suggested: true },
    travelers: { adults: 2, total: 2 },
    restaurants: [{ name: "Taberna", bookingUrl: "https://www.opentable.com/r/taberna-lisboa", reservationTime: "2027-04-10T19:30" }],
  });
  const dinner = manifest.restaurantBookings[0];
  const url = new URL(dinner.exactUrl);
  assert.equal(url.searchParams.get("dateTime"), "2027-04-10T19:30");
  assert.equal(url.searchParams.get("covers"), "2");
  const page = decodeBookingPage(encodeBookingPage(manifest));
  assert.equal(page.suggested, true);
  assert.equal(page.items[0].reservationTime, "2027-04-10T19:30");
});

import test from "node:test";
import assert from "node:assert/strict";
import { biweeklyAverages, biweeklyWindow, fareForDate, fetchGroupedPrices, groupedPricesUrl, parseGroupedPrices } from "../app/lib/flights/travelpayouts.js";

// Shape copied from the official grouped_prices response example.
const sample = { success: true, data: {
  "2027-03-02": { origin: "PDX", destination: "LAS", origin_airport: "PDX", destination_airport: "LAS", price: 158, airline: "WN", flight_number: "1234", departure_at: "2027-03-02T07:00:00-08:00", return_at: "2027-03-05T18:00:00-08:00", transfers: 0, return_transfers: 0, duration: 260, link: "/search/PDX0203LAS05031" },
  "2027-03-09": { price: 212, return_at: "2027-03-13T10:00:00-08:00", transfers: 1, return_transfers: 0, airline: "AS" },
  "2027-03-20": { price: 190, return_at: "2027-03-24T10:00:00-07:00", transfers: 0, return_transfers: 0, airline: "F9" },
  "bad-date": { price: 99 },
}, error: null };

test("grouped_prices requests use the documented parameters and header token", async () => {
  const url = new URL(groupedPricesUrl({ origin: "PDX", destination: "LAS", month: "2027-03" }));
  assert.equal(url.searchParams.get("group_by"), "departure_at");
  assert.equal(url.searchParams.get("departure_at"), "2027-03");
  assert.equal(url.searchParams.get("currency"), "usd");
  assert.equal(url.searchParams.get("market"), "us");
  assert.ok(!url.searchParams.has("token"), "token never goes in the URL");
  let headers;
  await fetchGroupedPrices({ token: "t", origin: "PDX", destination: "LAS", month: "2027-03", fetchImpl: async (_, init) => { headers = init.headers; return { ok: true, status: 200, json: async () => sample }; } });
  assert.equal(headers["X-Access-Token"], "t");
});

test("responses become clean per-date observations", () => {
  const rows = parseGroupedPrices(sample);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], { departDate: "2027-03-02", returnDate: "2027-03-05", price: 158, transfers: 0, returnTransfers: 0, airline: "WN", originAirport: "PDX", destinationAirport: "LAS" });
});

test("two-week windows average real fares and keep the cheapest", () => {
  assert.equal(biweeklyWindow("2027-01-01"), 0);
  assert.equal(biweeklyWindow("2027-01-15"), 1);
  assert.equal(biweeklyWindow("2027-12-31"), 25);
  const windows = biweeklyAverages(parseGroupedPrices(sample));
  // Mar 2 and Mar 9 fall in window 4 (Feb 26–Mar 11); Mar 20 in window 5.
  assert.deepEqual(windows.map((window) => [window.start, window.end, window.average, window.cheapest, window.samples]), [["2027-02-26", "2027-03-11", 185, 158, 2], ["2027-03-12", "2027-03-25", 190, 190, 1]]);
  const route = { windows, samples: 3 };
  assert.equal(fareForDate(route, "2027-03-10").average, 185);
  assert.equal(fareForDate(route, "2027-06-01"), null);
  assert.equal(fareForDate(route, null).yearRound, true);
});

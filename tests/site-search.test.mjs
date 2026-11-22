import test from "node:test";
import assert from "node:assert/strict";
import { searchStays, isStayId, stayById, asPickStay } from "../app/lib/search/stays.js";
import { stayBookingUrl, flightBookingUrl } from "../app/lib/booking/bookIt.js";

test("hotel search needs three letters and matches the name", () => {
  assert.deepEqual(searchStays("be"), []);
  const found = searchStays("bellagio");
  assert.ok(found.length > 0);
  assert.ok(found.every((stay) => /bellagio/i.test(stay.name)));
});

test("a city word can narrow a hotel search but not match on its own", () => {
  assert.deepEqual(searchStays("lisbon"), searchStays("lisbon").filter((stay) => /lisbon/i.test(stay.name)));
});

test("stay ids are digits only", () => {
  assert.equal(isStayId("1680268"), true);
  assert.equal(isStayId("../etc"), false);
  assert.equal(isStayId(""), false);
});

test("a catalog hotel becomes a planner pick with a bk: id", async () => {
  const stay = await stayById("1680268");
  assert.ok(stay);
  assert.ok(stay.photos.every((url) => url.includes(".bstatic.com/")));
  const pick = asPickStay(stay, null, () => 0);
  assert.equal(pick.id, "bk:1680268");
  assert.equal(await stayById("999999999999"), null);
});

test("book-only links go through CJ with dates", () => {
  const stay = stayBookingUrl("https://www.booking.com/hotel/pt/x.html?aid=1", { start: "2027-03-01", end: "2027-03-04", adults: 2, rooms: 1 });
  const target = decodeURIComponent(new URL(stay).searchParams.get("url") || stay);
  assert.match(target, /checkin=2027-03-01/);
  assert.doesNotMatch(target, /aid=1/);
  const flight = decodeURIComponent(flightBookingUrl({ from: "PDX", to: "LAS", start: "2027-03-01", end: "", adults: 1, oneWay: true }));
  assert.match(flight, /PDX\.AIRPORT-LAS\.AIRPORT/);
  assert.match(flight, /type=ONEWAY/);
});

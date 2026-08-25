import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBookingManifest,
  bookingManifestEntries,
  launchBookingManifest,
  restaurantBookingUrl,
} from "../app/lib/booking/manifest.js";

const destination = { city: "Mexico City", country: "Mexico", airport: "MEX" };
const flight = { selected: true, origin: "PDX", destination: "MEX", departureDate: "2026-03-14", returnDate: "2026-03-23", adults: 2, children: 1, cabin: "ECONOMY", preferredDeparture: "morning" };

function manifest(overrides = {}) {
  return buildBookingManifest({ tripId: "mex:current", destination, dates: { start: "2026-03-14", end: "2026-03-23" }, travelers: { adults: 2, children: 1, total: 3 }, ...overrides });
}

test("hotel-only manifest contains only the exact property action", () => {
  const result = manifest({ hotels: [{ id: "h1", name: "Casa Polanco" }], hotelExactUrls: ["https://www.booking.com/hotel/mx/casa-polanco.html"] });
  assert.deepEqual(bookingManifestEntries(result).map((item) => item.type), ["hotel"]);
  assert.match(result.hotelBookings[0].exactUrl, /booking\.com\/hotel\/mx\/casa-polanco/);
});

test("flight-only manifest transfers route, dates, party, cabin, and preference", () => {
  const result = manifest({ flight, flightDeepLink: "https://flights.booking.com/flights/PDX.AIRPORT-MEX.AIRPORT/?depart=2026-03-14&return=2026-03-23&adults=2&children=1&cabinClass=ECONOMY" });
  assert.deepEqual(bookingManifestEntries(result).map((item) => item.type), ["flight"]);
  assert.equal(result.flightBooking.preferredDeparture, "morning");
  assert.equal(result.flightBooking.children, 1);
  assert.match(result.flightBooking.deepLink, /depart=2026-03-14/);
});

test("an unselected flight never leaks into restaurant-only booking", () => {
  const result = manifest({ restaurants: [{ name: "Pujol", officialWebsiteUrl: "https://pujol.com.mx/reservations" }], flight: { ...flight, selected: false }, flightDeepLink: "https://flights.booking.com/" });
  assert.deepEqual(bookingManifestEntries(result).map((item) => item.type), ["restaurant"]);
});

test("restaurant precedence is official site, verified reservation, then exact Google place", () => {
  assert.equal(restaurantBookingUrl({ officialWebsiteUrl: "https://pujol.com.mx/", bookingUrl: "https://www.opentable.com/r/pujol" }), "https://pujol.com.mx/");
  assert.equal(restaurantBookingUrl({ bookingUrl: "https://www.opentable.com/r/pujol" }), "https://www.opentable.com/r/pujol");
  assert.match(restaurantBookingUrl({ provider: "google_places", providerId: "ChIJexact" }), /query_place_id=ChIJexact/);
});

test("hotel plus two restaurants plus flight yields four exact actions", () => {
  const result = manifest({
    hotels: [{ id: "h1", name: "Casa Polanco" }],
    hotelExactUrls: ["https://www.booking.com/hotel/mx/casa-polanco.html"],
    restaurants: [{ id: "r1", name: "Pujol", officialWebsiteUrl: "https://pujol.com.mx/" }, { id: "r2", name: "Rosetta", bookingUrl: "https://www.opentable.com/r/rosetta" }],
    flight,
    flightDeepLink: "https://flights.booking.com/flights/PDX.AIRPORT-MEX.AIRPORT/?adults=2",
  });
  assert.deepEqual(bookingManifestEntries(result).map((item) => item.name), ["Casa Polanco", "Pujol", "Rosetta", "PDX → MEX"]);
});

test("hotel plus flight yields exactly two actions", () => {
  const result = manifest({ hotels: [{ name: "Casa Polanco" }], hotelExactUrls: ["https://www.booking.com/hotel/mx/casa-polanco.html"], flight, flightDeepLink: "https://flights.booking.com/flights/PDX.AIRPORT-MEX.AIRPORT/" });
  assert.deepEqual(bookingManifestEntries(result).map((item) => item.type), ["hotel", "flight"]);
});

test("hotel falls back only to an exact Google property identity", () => {
  const result = manifest({ hotels: [{ name: "Casa Polanco", googlePlaceId: "ChIJhotelExact" }] });
  assert.match(result.hotelBookings[0].exactUrl, /query_place_id=ChIJhotelExact/);
});

test("missing unverified links are omitted rather than invented", () => {
  const result = manifest({ hotels: [{ name: "Unknown Hotel", providerUrl: "https://provider.test/hotel", providerLinkVerified: false }], restaurants: [{ name: "No Link" }] });
  assert.equal(bookingManifestEntries(result).length, 0);
});

test("popup blocker returns individual fallback actions", () => {
  const result = manifest({ restaurants: [{ name: "Pujol", officialWebsiteUrl: "https://pujol.com.mx/" }, { name: "Rosetta", bookingUrl: "https://www.opentable.com/r/rosetta" }] });
  let calls = 0;
  const launched = launchBookingManifest(result, () => (++calls === 1 ? { opener: {}, location: { replace() {} } } : null));
  assert.equal(launched.opened.length, 1);
  assert.equal(launched.blocked.length, 1);
  assert.equal(launched.blocked[0].name, "Rosetta");
});

test("rebuilding after a selection change cannot retain stale items", () => {
  const first = manifest({ restaurants: [{ name: "Pujol", officialWebsiteUrl: "https://pujol.com.mx/" }] });
  const second = manifest({ restaurants: [{ name: "Rosetta", bookingUrl: "https://www.opentable.com/r/rosetta" }] });
  assert.deepEqual(bookingManifestEntries(first).map((item) => item.name), ["Pujol"]);
  assert.deepEqual(bookingManifestEntries(second).map((item) => item.name), ["Rosetta"]);
});

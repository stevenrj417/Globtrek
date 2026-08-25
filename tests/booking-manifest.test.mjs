import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBookingManifest,
  bookingManifestEntries,
  launchBookingManifest,
  restaurantBookingUrl,
  experienceBookingUrl,
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

test("restaurant precedence is official reservation, official site, verified OpenTable, then exact Google place", () => {
  assert.equal(restaurantBookingUrl({ officialReservationUrl: "https://reservations.example/pujol", officialWebsiteUrl: "https://pujol.com.mx/", bookingUrl: "https://www.opentable.com/r/pujol" }), "https://reservations.example/pujol");
  assert.equal(restaurantBookingUrl({ officialWebsiteUrl: "https://pujol.com.mx/", bookingUrl: "https://www.opentable.com/r/pujol" }), "https://pujol.com.mx/");
  assert.equal(restaurantBookingUrl({ bookingUrl: "https://www.opentable.com/r/pujol" }), "https://www.opentable.com/r/pujol");
  assert.match(restaurantBookingUrl({ provider: "google_places", providerId: "ChIJexact" }), /query_place_id=ChIJexact/);
});

test("experience precedence is affiliate, provider booking, official site, then exact Google place", () => {
  assert.equal(experienceBookingUrl({ affiliateUrl: "https://www.viator.com/tours/austin/exact", providerBookingUrl: "https://provider.example/exact", officialWebsiteUrl: "https://official.example/experience" }), "https://www.viator.com/tours/austin/exact");
  assert.equal(experienceBookingUrl({ providerBookingUrl: "https://provider.example/exact", officialWebsiteUrl: "https://official.example/experience" }), "https://provider.example/exact");
  assert.equal(experienceBookingUrl({ officialWebsiteUrl: "https://official.example/experience" }), "https://official.example/experience");
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
  assert.equal(launched.requested, 2);
  assert.equal(launched.blocked[0].name, "Rosetta");
});

test("all blank browsing contexts are created before any booking navigation", () => {
  const result = manifest({
    restaurants: [
      { name: "Pujol", officialWebsiteUrl: "https://pujol.com.mx/" },
      { name: "Rosetta", bookingUrl: "https://www.opentable.com/r/rosetta" },
      { name: "Quintonil", officialWebsiteUrl: "https://quintonil.com/" },
    ],
  });
  const events = [];
  const launched = launchBookingManifest(result, (url, target) => {
    events.push(`open:${url}:${target}`);
    return { opener: {}, location: { replace(value) { events.push(`navigate:${value}`); } } };
  });
  assert.equal(launched.requested, 3);
  assert.deepEqual(events.slice(0, 3), [
    "open:about:blank:globtrek-booking-1",
    "open:about:blank:globtrek-booking-2",
    "open:about:blank:globtrek-booking-3",
  ]);
  assert.ok(events.slice(3).every((event) => event.startsWith("navigate:https://")));
});

test("one hotel, four restaurants, four experiences, and a flight produce ten exact attempts", () => {
  const restaurants = Array.from({ length: 4 }, (_, index) => ({ name: `Restaurant ${index + 1}`, officialWebsiteUrl: `https://restaurant${index + 1}.example/reserve` }));
  const experiences = Array.from({ length: 4 }, (_, index) => ({ name: `Experience ${index + 1}`, officialWebsiteUrl: `https://experience${index + 1}.example/book` }));
  const result = manifest({
    hotels: [{ name: "Casa Polanco" }],
    hotelExactUrls: ["https://www.booking.com/hotel/mx/casa-polanco.html"],
    restaurants,
    experiences,
    flight,
    flightDeepLink: "https://flights.booking.com/flights/PDX.AIRPORT-MEX.AIRPORT/?depart=2026-03-14&return=2026-03-23&adults=2&children=1&cabinClass=ECONOMY",
  });
  const launched = launchBookingManifest(result, () => ({ opener: {}, location: { replace() {} } }));
  assert.equal(launched.requested, 10);
  assert.equal(launched.opened.length, 10);
  assert.equal(launched.blocked.length, 0);
});

test("final acceptance selection produces six exact booking attempts", () => {
  const result = manifest({
    hotels: [{ name: "Casa Polanco" }],
    hotelExactUrls: ["https://www.booking.com/hotel/mx/casa-polanco.html"],
    restaurants: [{ name: "Pujol", officialWebsiteUrl: "https://pujol.com.mx/" }, { name: "Rosetta", bookingUrl: "https://www.opentable.com/r/rosetta" }],
    experiences: [{ name: "Museo Frida Kahlo", officialWebsiteUrl: "https://www.museofridakahlo.org.mx/" }, { name: "Museo Nacional de Antropología", officialWebsiteUrl: "https://www.mna.inah.gob.mx/" }],
    flight,
    flightDeepLink: "https://flights.booking.com/flights/PDX.AIRPORT-MEX.AIRPORT/?depart=2026-03-14&return=2026-03-23&adults=2&children=1&cabinClass=ECONOMY",
  });
  const launched = launchBookingManifest(result, () => ({ opener: {}, location: { replace() {} } }));
  assert.equal(launched.requested, 6);
  assert.equal(launched.opened.length, 6);
  assert.deepEqual(launched.blocked, []);
});

test("rebuilding after a selection change cannot retain stale items", () => {
  const first = manifest({ restaurants: [{ name: "Pujol", officialWebsiteUrl: "https://pujol.com.mx/" }] });
  const second = manifest({ restaurants: [{ name: "Rosetta", bookingUrl: "https://www.opentable.com/r/rosetta" }] });
  assert.deepEqual(bookingManifestEntries(first).map((item) => item.name), ["Pujol"]);
  assert.deepEqual(bookingManifestEntries(second).map((item) => item.name), ["Rosetta"]);
});

test("Austin acceptance opens hotel, Caroline, Zilker, and flight synchronously while retaining GlobTrek", () => {
  const austin = buildBookingManifest({
    tripId: "austin:acceptance",
    destination: { city: "Austin", country: "United States", airport: "AUS" },
    dates: { start: "2026-10-10", end: "2026-10-14" },
    travelers: { adults: 2, children: 0, total: 2 },
    hotels: [{ name: "Austin Proper Hotel" }],
    hotelExactUrls: ["https://www.booking.com/hotel/us/austin-proper.html"],
    restaurants: [{ name: "Caroline", officialReservationUrl: "https://www.opentable.com/r/caroline-reservations-austin?restref=732061", officialWebsiteUrl: "https://www.carolinerestaurant.com/caroline" }],
    experiences: [{ name: "Zilker Metropolitan Park", officialWebsiteUrl: "https://www.austintexas.gov/department/zilker-metropolitan-park", provider: "official" }],
    flight: { selected: true, origin: "PDX", destination: "AUS", departureDate: "2026-10-10", returnDate: "2026-10-14", adults: 2, children: 0, cabin: "ECONOMY", preferredDeparture: "morning" },
    flightDeepLink: "https://flights.booking.com/flights/PDX.AIRPORT-AUS.AIRPORT/?type=ROUNDTRIP&cabinClass=ECONOMY&adults=2&children=0&depart=2026-10-10&return=2026-10-14",
  });
  const destinations = [];
  const originalGlobTrekLocation = "https://www.glob-trek.com/results";
  let openIndex = 0;
  const launched = launchBookingManifest(austin, (url, target) => {
    assert.equal(url, "about:blank");
    openIndex += 1;
    assert.equal(target, `globtrek-booking-${openIndex}`);
    return { opener: {}, location: { replace(value) { destinations.push(value); } } };
  });
  assert.equal(launched.opened.length, 4);
  assert.deepEqual(launched.blocked, []);
  assert.equal(originalGlobTrekLocation, "https://www.glob-trek.com/results");
  assert.match(destinations[0], /booking\.com\/hotel\/us\/austin-proper/);
  assert.match(destinations[1], /opentable\.com\/r\/caroline-reservations-austin/);
  assert.match(destinations[2], /austintexas\.gov\/department\/zilker-metropolitan-park/);
  assert.match(destinations[3], /PDX\.AIRPORT-AUS\.AIRPORT/);
});

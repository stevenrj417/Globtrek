import test from "node:test";
import assert from "node:assert/strict";
import { buildBookingManifest } from "../app/lib/booking/manifest.js";
import { bookingPageUrl, decodeBookingPage, encodeBookingPage } from "../app/lib/booking/bookPage.js";

const manifest = buildBookingManifest({
  destination: { city: "Lisbon", country: "Portugal", airport: "LIS" },
  dates: { start: "2027-04-12", end: "2027-04-17" },
  travelers: { adults: 2, children: 0, total: 2 },
  hotels: [{ name: "Hotel Lisboa" }],
  hotelExactUrls: ["https://www.booking.com/hotel/pt/lisboa.html"],
  restaurants: [{ name: "Taberna", bookingUrl: "https://www.opentable.com/r/taberna" }],
  experiences: [{ name: "Fado night", estimatedCostHigh: 35 }, { name: "Miradouro", officialWebsiteUrl: "https://miradouro.example/", estimatedCostHigh: 0 }],
  flight: { selected: true, origin: "JFK", destination: "LIS", adults: 2 },
  flightDeepLink: "https://flights.booking.com/flights/JFK.AIRPORT-LIS.AIRPORT/",
});

test("the booking page round-trips every booking from the trip", () => {
  const decoded = decodeBookingPage(encodeBookingPage(manifest));
  assert.equal(decoded.city, "Lisbon");
  assert.equal(decoded.start, "2027-04-12");
  assert.equal(decoded.travelers, 2);
  assert.deepEqual(decoded.items.map((item) => item.type).sort(), ["experience", "experience", "flight", "hotel", "restaurant"]);
  assert.ok(decoded.items.find((item) => item.name === "Miradouro"), "free places survive");
});

test("the booking page URL fits comfortably in an email link", () => {
  assert.ok(bookingPageUrl(manifest, "https://www.glob-trek.com").length < 4000);
});

test("tampered payloads cannot strip CJ tracking or smuggle raw Booking.com links", () => {
  const forge = (items) => Buffer.from(JSON.stringify({ v: 1, c: "X", i: items })).toString("base64url");
  assert.equal(decodeBookingPage(forge([{ t: "hotel", n: "H", u: "https://www.booking.com/hotel/x.html" }])), null);
  assert.equal(decodeBookingPage(forge([{ t: "flight", n: "F", u: "https://evil.example/" }])), null);
  assert.equal(decodeBookingPage(forge([{ t: "experience", n: "E", u: "https://www.booking.com/attractions/x.html" }])), null);
  assert.equal(decodeBookingPage(forge([{ t: "restaurant", n: "R", u: "http://insecure.example/" }])), null);
  assert.equal(decodeBookingPage("not-base64!"), null);
});

test("the trip email wraps browser-supplied Booking.com links in CJ and links the booking checklist", async () => {
  const { tripEmail } = await import("../app/lib/email/templates.js");
  const html = tripEmail({ model: {
    destination: { city: "Lisbon" }, travelers: { total: 2 }, dates: { start: "2027-04-12", end: "2027-04-17" },
    hotel: { name: "Hotel Lisboa" },
    bookingManifest: { hotelBookings: [{ name: "Hotel Lisboa", exactUrl: "https://www.booking.com/hotel/pt/lisboa.html" }] },
    itinerary: { days: [{ title: "Alfama" }] },
  } });
  assert.match(html, /kqzyfj\.com\/click-101801755-17293132\?url=https%3A%2F%2Fwww\.booking\.com%2Fhotel%2Fpt%2Flisboa\.html/);
  assert.doesNotMatch(html, /href="https:\/\/www\.booking\.com/);
  assert.match(html, /Open booking checklist/);
  assert.doesNotMatch(html, /pop-ups|Book everything/);
  assert.match(html, /https:\/\/www\.glob-trek\.com\/book\?b=/);
});

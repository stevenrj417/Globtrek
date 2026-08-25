import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tripEmail } from "../app/lib/email/templates.js";
import { sendEmail } from "../app/lib/email/resend.js";
import { confirmEmailAccepted, tripEmailIdempotencyKey } from "../app/lib/email/tripDelivery.js";

function trip(restaurant = "Pujol") {
  return {
    clientTripKey: "mex:current",
    destination: { city: "Mexico City", country: "Mexico", image: "https://images.example/mexico.jpg" },
    itinerary: { days: [{ title: "Arrive & settle", morning: "Land", afternoon: "Check in", evening: "Dinner" }] },
    selections: { hotel: { name: "Casa Polanco", neighborhood: "Polanco", image: "https://images.example/hotel.jpg" }, restaurants: [{ name: restaurant, imageUrl: "https://images.example/restaurant.jpg" }], activities: [] },
    bookingManifest: { dates: { start: "2026-03-14", end: "2026-03-23" }, travelers: { adults: 2, children: 0, total: 2 }, hotelBookings: [{ name: "Casa Polanco", exactUrl: "https://www.booking.com/hotel/mx/casa-polanco.html", photoUrl: "https://images.example/hotel.jpg" }], restaurantBookings: [{ name: restaurant, exactUrl: `https://restaurants.example/${restaurant.toLowerCase()}`, imageUrl: "https://images.example/restaurant.jpg" }], experienceBookings: [], flightBooking: { origin: "PDX", destination: "MEX", adults: 2, children: 0, cabin: "ECONOMY", preferredDeparture: "morning", deepLink: "https://flights.booking.com/flights/PDX.AIRPORT-MEX.AIRPORT/" } },
  };
}

test("trip email renders exact selections, verified images, flight, and individual links", () => {
  const value = trip();
  const html = tripEmail({ model: { destination: value.destination, destinationImage: value.destination.image, dates: value.bookingManifest.dates, travelers: value.bookingManifest.travelers, hotel: value.selections.hotel, flight: value.bookingManifest.flightBooking, restaurants: value.selections.restaurants, activities: [], itinerary: value.itinerary, bookingManifest: value.bookingManifest, bookingLinks: {} }, viewUrl: "https://glob-trek.com/results" });
  assert.match(html, /Casa Polanco/);
  assert.match(html, /PDX → MEX/);
  assert.match(html, /Pujol/);
  assert.match(html, /images\.example\/hotel\.jpg/);
  assert.match(html, /restaurants\.example\/pujol/);
});

test("email delivery reports success only after provider returns an accepted id", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "re_test";
  t.after(() => { globalThis.fetch = originalFetch; if (originalKey == null) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey; });
  globalThis.fetch = async () => Response.json({ id: "email_accepted" });
  const provider = confirmEmailAccepted(await sendEmail({ from: "GlobTrek <trips@glob-trek.com>", to: ["traveler@example.com"], subject: "Trip", html: "<p>Trip</p>" }));
  assert.equal(provider.id, "email_accepted");
});

test("email delivery rejects provider failure and unconfirmed acceptance", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "re_test";
  t.after(() => { globalThis.fetch = originalFetch; if (originalKey == null) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey; });
  globalThis.fetch = async () => Response.json({});
  const provider = await sendEmail({ from: "GlobTrek <trips@glob-trek.com>", to: ["traveler@example.com"], subject: "Trip", html: "<p>Trip</p>" });
  assert.throws(() => confirmEmailAccepted(provider), /resend_acceptance_unconfirmed/);
});

test("email delivery surfaces a provider HTTP failure", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "re_test";
  t.after(() => { globalThis.fetch = originalFetch; if (originalKey == null) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey; });
  globalThis.fetch = async () => Response.json({ message: "provider unavailable" }, { status: 503 });
  await assert.rejects(() => sendEmail({ from: "GlobTrek <trips@glob-trek.com>", to: ["traveler@example.com"], subject: "Trip", html: "<p>Trip</p>" }), /provider unavailable/);
});

test("selection changes produce a new email idempotency key", async (t) => {
  void t;
  const pujol = trip("Pujol");
  const rosetta = trip("Rosetta");
  const keyOne = tripEmailIdempotencyKey("traveler@example.com", pujol);
  const keyTwo = tripEmailIdempotencyKey("traveler@example.com", rosetta);
  assert.notEqual(keyOne, keyTwo);
});

test("logged-out email UX asks for an address and closes only after confirmed success", async () => {
  const source = await readFile(new URL("../app/components/EmailTripButton.jsx", import.meta.url), "utf8");
  assert.match(source, /Where should we send your trip\?/);
  assert.match(source, /Send my trip/);
  assert.match(source, /if \(!response\.ok \|\| !data\.sent\) throw/);
  assert.match(source, /setStatus\("Trip sent"\);[\s\S]*setSentFingerprint\(selectionFingerprint\);\s*setOpen\(false\)/);
  assert.match(source, /const accountEmail = user\?\.email \|\| null/);
  assert.doesNotMatch(source, /email_confirmed_at/);
  assert.match(source, /sendingRef\.current/);
});

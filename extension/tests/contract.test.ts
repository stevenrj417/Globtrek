import test from "node:test";
import assert from "node:assert/strict";
// The website's own modules (plain ESM), so this test fails if the two sides drift apart.
// @ts-expect-error — untyped JavaScript from the Next.js app
import { buildBookingManifest, bookingManifestEntries } from "../../app/lib/booking/manifest.js";
// @ts-expect-error — untyped JavaScript from the Next.js app
import { assistantTrip, ASSISTANT_CHANNEL, ASSISTANT_PROTOCOL } from "../../app/lib/booking/assistant.js";
import { CHANNEL, PROTOCOL_VERSION, validateWebRequest } from "../src/shared/schema.ts";
import { createSession } from "../src/session/manager.ts";

test("the website's Book my trip payload passes the extension's strict validator", () => {
  assert.equal(ASSISTANT_CHANNEL, CHANNEL);
  assert.equal(ASSISTANT_PROTOCOL, PROTOCOL_VERSION);
  const manifest = buildBookingManifest({
    destination: { city: "Lisbon", country: "Portugal", airport: "LIS" },
    dates: { start: "2027-04-12", end: "2027-04-17" },
    travelers: { adults: 2, children: 0, total: 2 },
    hotels: [{ name: "Hotel Lisboa" }],
    hotelExactUrls: ["https://www.booking.com/hotel/pt/lisboa.html"],
    restaurants: [{ name: "Taberna", bookingUrl: "https://www.opentable.com/r/taberna" }],
    experiences: [{ name: "Fado night", estimatedCostHigh: 35 }, { name: "Sintra", providerBookingUrl: "https://www.getyourguide.com/lisbon-l42/sintra-t1234/" }],
    flight: { selected: true, origin: "JFK", destination: "LIS", adults: 2, departureDate: "2027-04-12" },
    flightDeepLink: "https://flights.booking.com/flights/JFK.AIRPORT-LIS.AIRPORT/",
  });
  const trip = assistantTrip({ entries: bookingManifestEntries(manifest), city: "Lisbon", country: "Portugal", start: "2027-04-12", end: "2027-04-17", adults: 2, children: 0, flight: manifest.flightBooking });
  const request = validateWebRequest({ channel: CHANNEL, v: 1, kind: "request", requestId: "r0123456789abcdef", type: "START_SESSION", trip });
  assert.equal(request.type, "START_SESSION");
  if (request.type !== "START_SESSION") return;
  const session = createSession(request.trip, { origin: "https://www.glob-trek.com", sourceTabId: 1 });
  // Today the site routes every paid activity through Booking.com Attractions (CJ), so
  // even a GetYourGuide provider link arrives as Booking.com. Only OpenTable stays separate.
  assert.deepEqual(session.items.map((item) => item.partnerName).sort(), ["Booking.com", "Booking.com", "Booking.com", "Booking.com", "OpenTable"]);
  assert.ok(session.items.every((item) => !item.autofill), "no live partner in today's trips allows autofill");
  const gyg = assistantTrip({ entries: [{ type: "experience", name: "Sintra", exactUrl: "https://www.getyourguide.com/lisbon-l42/sintra-t1234/" }], city: "Lisbon", adults: 2 });
  const accepted = validateWebRequest({ channel: CHANNEL, v: 1, kind: "request", requestId: "r0123456789abcdef", type: "START_SESSION", trip: gyg });
  assert.equal(accepted.type === "START_SESSION" && createSession(accepted.trip, { origin: "https://www.glob-trek.com", sourceTabId: 1 }).items[0]!.autofill, true);
});

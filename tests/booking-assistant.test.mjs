import test from "node:test";
import assert from "node:assert/strict";
import { buildBookingManifest, bookingManifestEntries } from "../app/lib/booking/manifest.js";
import { assistantEntries, assistantTrip, canUseExtension, isAssistantUrl } from "../app/lib/booking/assistant.js";

const manifest = buildBookingManifest({
  destination: { city: "Lisbon", country: "Portugal", airport: "LIS" },
  dates: { start: "2027-04-12", end: "2027-04-17" },
  travelers: { adults: 2, children: 1, total: 3 },
  hotels: [{ name: "Hotel Lisboa" }],
  hotelExactUrls: ["https://www.booking.com/hotel/pt/lisboa.html"],
  restaurants: [{ name: "Taberna", bookingUrl: "https://www.opentable.com/r/taberna", reservationTime: "2027-04-13T19:30" }, { name: "Walk-in café", officialWebsiteUrl: "https://cafe.example/" }],
  experiences: [{ name: "Fado night", estimatedCostHigh: 35 }, { name: "Miradouro", officialWebsiteUrl: "https://miradouro.example/", estimatedCostHigh: 0 }],
  flight: { selected: true, origin: "JFK", destination: "LIS", adults: 2, departureDate: "2027-04-12", returnDate: "2027-04-17" },
  flightDeepLink: "https://flights.booking.com/flights/JFK.AIRPORT-LIS.AIRPORT/",
});
const entries = bookingManifestEntries(manifest);

test("the assistant receives exact CJ-tracked links and approved partner links only", () => {
  const trip = assistantTrip({ entries, city: "Lisbon", country: "Portugal", start: "2027-04-12", end: "2027-04-17", adults: 2, children: 1, flight: manifest.flightBooking });
  const urls = trip.items.map((item) => item.url);
  const checklistUrls = entries.map((entry) => entry.exactUrl);
  for (const url of urls) assert.ok(checklistUrls.includes(url), "unchanged from the checklist");
  assert.ok(urls.some((url) => url.startsWith("https://www.kqzyfj.com/")), "hotel keeps CJ tracking");
  assert.ok(urls.some((url) => url.startsWith("https://www.dpbolvw.net/")), "flight keeps CJ tracking");
  assert.ok(!urls.some((url) => url.includes("miradouro.example")), "arbitrary sites are not sent to the extension");
  assert.equal(trip.items.find((item) => item.type === "restaurant").time, "19:30");
  assert.deepEqual(trip.travelers, { adults: 2, children: 1 });
  assert.deepEqual(trip.flight, { origin: "JFK", destination: "LIS", departureDate: "2027-04-12", returnDate: "2027-04-17", cabin: "ECONOMY" });
  assert.ok(!JSON.stringify(trip).match(/price|estimate|email|phone/i), "no prices or traveler details");
});

test("ids match between the trip payload and the checklist rows", () => {
  const ids = assistantEntries(entries).map(({ id }) => id);
  const trip = assistantTrip({ entries, city: "Lisbon", adults: 2 });
  assert.deepEqual(trip.items.map((item) => item.id), ids);
  assert.ok(ids.every((id) => /^[a-z]+-\d+$/.test(id)));
});

test("link rules mirror the extension's allowlist", () => {
  assert.ok(isAssistantUrl("https://www.getyourguide.com/lisbon-l42/x-t1/"));
  assert.ok(!isAssistantUrl("https://www.booking.com/hotel/pt/x.html"), "raw Booking.com would lose affiliate credit");
  assert.ok(!isAssistantUrl("https://www.kqzyfj.com/click-1?url=https%3A%2F%2Fevil.example%2F"));
  assert.ok(!isAssistantUrl("http://www.getyourguide.com/"));
  assert.ok(!isAssistantUrl("https://cafe.example/"));
});

test("trips with nothing the assistant can open produce no payload", () => {
  assert.equal(assistantTrip({ entries: [{ type: "experience", name: "Park", exactUrl: "https://park.example/" }], city: "X", adults: 1 }), null);
});

test("desktop Chrome detection", () => {
  assert.equal(canUseExtension({ userAgent: "Mozilla/5.0 (Macintosh) AppleWebKit Chrome/131.0 Safari/537.36" }), true);
  assert.equal(canUseExtension({ userAgent: "Mozilla/5.0 (iPhone) CriOS/131.0 Mobile Safari" }), false);
  assert.equal(canUseExtension({ userAgent: "Mozilla/5.0 (Macintosh) Version/18 Safari/605" }), false);
  assert.equal(canUseExtension({ userAgentData: { mobile: true, brands: [{ brand: "Google Chrome" }] } }), false);
  assert.equal(canUseExtension({ userAgentData: { mobile: false, brands: [{ brand: "Google Chrome" }] } }), true);
});

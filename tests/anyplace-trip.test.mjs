import test from "node:test";
import assert from "node:assert/strict";
import { parseTripParams, tripQuery, stayLink, flightLink, ticketsLink, isFreeToVisit, nights } from "../app/lib/anyplace/trip.js";
import { nearestAirport } from "../app/lib/anyplace/airport.js";
import { placeTripEmail } from "../app/lib/email/templates.js";
import { isCjUrl } from "../app/lib/booking/cj.js";

const stay = { id: "bk:123", name: "Pousada Azul", category: "Inn", bookingUrl: "https://www.booking.com/hotel/br/pousada-azul.html", clickUrl: "https://www.kqzyfj.com/click-101801755-17293132?url=x", photo: "https://cf.bstatic.com/x.jpg", freeCancellation: true };

test("trip params keep only clean values", () => {
  const trip = parseTripParams({ budget: "nope", stay: "bk:123", d: "ChIJaaaaaaaaaa,bad id,ChIJaaaaaaaaaa", a: "", start: "2027-04-10", end: "2027-04-09", adults: "40", from: "pdx" });
  assert.equal(trip.budget, "mid");
  assert.equal(trip.stay, "bk:123");
  assert.deepEqual(trip.dinners, ["ChIJaaaaaaaaaa"]);
  assert.equal(trip.start, null, "an end before the start drops both dates");
  assert.equal(trip.adults, 2);
  assert.equal(trip.from, "PDX");
  assert.equal(parseTripParams({ stay: "https://evil.example" }).stay, null);
  const round = parseTripParams(Object.fromEntries(new URLSearchParams(tripQuery({ ...trip, start: "2027-04-10", end: "2027-04-14", adults: 3 }))));
  assert.equal(round.start, "2027-04-10");
  assert.equal(round.adults, 3);
  assert.equal(nights(round), 4);
});

test("stay, flight and ticket links all carry GlobTrek's CJ tracking", () => {
  assert.equal(stayLink(stay, {}), stay.clickUrl);
  const dated = stayLink(stay, { start: "2027-04-10", end: "2027-04-14", adults: 3 });
  assert.ok(isCjUrl(dated));
  assert.match(decodeURIComponent(dated), /pousada-azul\.html\?checkin=2027-04-10&checkout=2027-04-14&group_adults=3/);
  const flight = flightLink({ code: "LIS" }, { from: "PDX", start: "2027-04-10", end: "2027-04-14", adults: 2 });
  assert.ok(isCjUrl(flight));
  assert.match(decodeURIComponent(flight), /flights\.booking\.com\/flights\/PDX\.AIRPORT-LIS\.AIRPORT\//);
  assert.ok(isCjUrl(ticketsLink({ name: "Gulbenkian Museum", primaryType: "museum" }, { name: "Lisbon" })));
  assert.equal(ticketsLink({ name: "Cachoeira do Mangue", primaryType: "hiking_area" }, { name: "Tiradentes" }), null, "free outdoor places get directions, not tickets");
  assert.ok(isFreeToVisit({ primaryType: "scenic_spot" }));
});

test("the airport to fly into favors an international airport within reach", () => {
  assert.equal(nearestAirport({ latitude: 38.7223, longitude: -9.1393 }).code, "LIS");
  assert.equal(nearestAirport({ latitude: 46.545, longitude: 7.891 }).code, "ZRH", "Gimmelwald flies into Zurich, not the small Bern field");
  assert.equal(nearestAirport({ latitude: 0, longitude: -140 }), null, "nothing within 300 km");
});

test("the trip email is laid out as numbered steps with tracked links", () => {
  const html = placeTripEmail({
    destination: { name: "Tiradentes" }, stay, stayUrl: stay.clickUrl, flightUrl: flightLink({ code: "CNF" }, {}), airport: { code: "CNF", name: "Belo Horizonte International", city: "Belo Horizonte", km: 160 },
    activities: [{ name: "Igreja Matriz", type: "Church", ticketsUrl: null, mapsUrl: "https://maps.google.com/?cid=1" }],
    dinners: [{ name: "O Provençal", type: "French restaurant", mapsUrl: "https://maps.google.com/?cid=2" }],
    tripUrl: "https://www.glob-trek.com/places/ChIJaaaaaaaaaa/trip?budget=mid", adults: 2,
  });
  const order = ["Step 1 · start here", "Fly into Belo Horizonte", "Step 2", "Book Pousada Azul", "Step 3", "Igreja Matriz", "Step 4", "O Provençal", "Open your trip"].map((text) => html.indexOf(text.replace("'", "&#039;")));
  assert.ok(order.every((index) => index > 0), "every step is there");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "in order");
  assert.ok(!/googleusercontent|places\.googleapis/.test(html), "no Google photos in email");
  assert.ok(html.includes("kqzyfj.com") && html.includes("dpbolvw.net"), "stay and flight links are CJ links");
});

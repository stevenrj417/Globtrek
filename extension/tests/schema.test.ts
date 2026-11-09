import test from "node:test";
import assert from "node:assert/strict";
import { CHANNEL, MAX_MESSAGE_BYTES, SchemaError, isAllowedWebOrigin, validateTrip, validateWebRequest, validatePublicStatus } from "../src/shared/schema.ts";

const CJ = "https://www.kqzyfj.com/click-101801755-17293132?url=" + encodeURIComponent("https://www.booking.com/hotel/pt/lisboa.html?checkin=2027-04-12&checkout=2027-04-17&group_adults=2");

const validTrip = {
  tripId: "lisbon:abc",
  destination: { city: "Lisbon", country: "Portugal" },
  dates: { start: "2027-04-12", end: "2027-04-17" },
  travelers: { adults: 2, children: 1 },
  items: [
    { id: "hotel-0", type: "hotel", name: "Hotel Lisboa", url: CJ },
    { id: "experience-0", type: "experience", name: "Sintra day trip", url: "https://www.getyourguide.com/lisbon-l42/sintra-t1234/", date: "2027-04-14", time: "09:30" },
    { id: "restaurant-0", type: "restaurant", name: "Taberna", url: "https://www.opentable.com/r/taberna-lisboa?covers=3" },
  ],
  flight: { origin: "JFK", destination: "LIS", departureDate: "2027-04-12", returnDate: "2027-04-17", cabin: "ECONOMY" },
};

function request(extra: Record<string, unknown>) {
  return { channel: CHANNEL, v: 1, kind: "request", requestId: "req_12345678", ...extra };
}

test("a well-formed trip validates and keeps every URL exactly as sent (CJ tracking intact)", () => {
  const trip = validateTrip(validTrip);
  assert.equal(trip.items[0]!.url, CJ);
  assert.equal(trip.travelers.infants, 0);
  assert.equal(trip.items[1]!.time, "09:30");
});

test("only GlobTrek origins may talk to the extension; dev origins only in development builds", () => {
  assert.ok(isAllowedWebOrigin("https://www.glob-trek.com"));
  assert.ok(!isAllowedWebOrigin("https://glob-trek.com"), "the bare domain redirects to www and is not trusted");
  assert.ok(!isAllowedWebOrigin("https://www.globtrek.com"));
  assert.ok(!isAllowedWebOrigin("https://www.glob-trek.com.evil.example"));
  assert.ok(!isAllowedWebOrigin("http://localhost:3010"));
  assert.ok(isAllowedWebOrigin("http://localhost:3010", { dev: true }));
  assert.ok(isAllowedWebOrigin("https://globtrek-potr-git-feature-steven.vercel.app", { dev: true }));
  assert.ok(!isAllowedWebOrigin("https://globtrek-potr-x.vercel.app"), "previews are development-only");
  assert.ok(!isAllowedWebOrigin("https://someone-else.vercel.app", { dev: true }));
});

test("unsafe and unapproved URLs are rejected", () => {
  const withUrl = (url: string) => ({ ...validTrip, items: [{ id: "x", type: "hotel", name: "X", url }] });
  for (const url of [
    "http://www.getyourguide.com/x",
    "javascript:alert(1)",
    "data:text/html,hi",
    "https://www.booking.com/hotel/pt/lisboa.html",
    "https://www.kqzyfj.com/click-1?url=" + encodeURIComponent("https://evil.example/"),
    "https://www.kqzyfj.com/click-1?url=" + encodeURIComponent("http://www.booking.com/"),
    "https://user:pass@www.getyourguide.com/",
    "https://www.getyourguide.com:8443/",
    "https://93.184.216.34/",
    "https://evil.example/?u=www.getyourguide.com",
    "https://getyourguide.com.evil.example/",
    "https://www.google.com/search?q=x",
    "http://localhost:4599/booking/book.html",
  ]) assert.throws(() => validateTrip(withUrl(url)), SchemaError, url);
  assert.ok(validateTrip(withUrl("http://localhost:4599/booking/book.html"), { dev: true }), "fixtures only in dev");
});

test("malformed manifests are rejected", () => {
  assert.throws(() => validateTrip({ ...validTrip, items: [] }), /1–12/);
  assert.throws(() => validateTrip({ ...validTrip, items: Array.from({ length: 13 }, (_, i) => ({ ...validTrip.items[1], id: `e${i}` })) }));
  assert.throws(() => validateTrip({ ...validTrip, dates: { start: "2027-04-17", end: "2027-04-12" } }), /end is before start/);
  assert.throws(() => validateTrip({ ...validTrip, dates: { start: "2027-02-31x" } }));
  assert.throws(() => validateTrip({ ...validTrip, travelers: { adults: 0 } }));
  assert.throws(() => validateTrip({ ...validTrip, items: [validTrip.items[1], validTrip.items[1]] }), /unique/);
  assert.throws(() => validateTrip({ ...validTrip, items: [{ ...validTrip.items[1], type: "cruise" }] }));
  assert.throws(() => validateTrip({ ...validTrip, destination: { city: "Lis\u0000bon" } }), /control/);
  assert.throws(() => validateTrip({ ...validTrip, flight: { origin: "JFKX", destination: "LIS" } }));
  assert.throws(() => validateTrip(Object.assign(Object.create({ polluted: true }), validTrip)), /object/);
});

test("the website cannot smuggle code, selectors, HTML or commands", () => {
  assert.throws(() => validateTrip({ ...validTrip, selectors: { firstName: "#x" } }), /not an expected field/);
  assert.throws(() => validateTrip({ ...validTrip, items: [{ ...validTrip.items[1], script: "alert(1)" }] }), /not an expected field/);
  assert.throws(() => validateTrip({ ...validTrip, items: [{ ...validTrip.items[1], html: "<b>x</b>" }] }), /not an expected field/);
  assert.throws(() => validateWebRequest(request({ type: "EVAL", code: "1" })), SchemaError);
  assert.throws(() => validateWebRequest(request({ type: "PING", fill: true })), /not an expected field/);
  assert.throws(() => validateWebRequest(request({ type: "START_SESSION", trip: validTrip, profile: { email: "a@b.c" } })), /not an expected field/);
});

test("envelope checks: channel, version, request id, size", () => {
  assert.equal(validateWebRequest(request({ type: "PING" })).type, "PING");
  assert.equal(validateWebRequest(request({ type: "START_SESSION", trip: validTrip })).type, "START_SESSION");
  assert.throws(() => validateWebRequest({ ...request({ type: "PING" }), channel: "other" }));
  assert.throws(() => validateWebRequest({ ...request({ type: "PING" }), v: 2 }), /version/);
  assert.throws(() => validateWebRequest({ ...request({ type: "PING" }), requestId: "x" }));
  const huge = { ...validTrip, destination: { city: "L", country: "x".repeat(MAX_MESSAGE_BYTES) } };
  assert.throws(() => validateWebRequest(request({ type: "START_SESSION", trip: huge })), /too large/);
  assert.throws(() => validateWebRequest(request({ type: "GET_STATUS", sessionId: "../../etc" })));
  assert.equal(validateWebRequest(request({ type: "OPEN_SESSION", sessionId: "s_abcdefghijklmnopqr" })).type, "OPEN_SESSION");
  assert.throws(() => validateWebRequest(request({ type: "OPEN_SESSION", sessionId: "s_abcdefghijklmnopqr", url: "https://evil.example" })));
});

test("public status validation accepts only statuses, never free-form traveler data", () => {
  const status = { sessionId: "s_abcdefghijklmnopqr", updatedAt: 1, items: [{ id: "hotel-0", status: "filled", partner: "GetYourGuide", note: null }] };
  assert.deepEqual(validatePublicStatus(status), status);
  assert.throws(() => validatePublicStatus({ ...status, items: [{ ...status.items[0], email: "x@y.z" }] }));
  assert.throws(() => validatePublicStatus({ ...status, items: [{ ...status.items[0], status: "booked" }] }));
});

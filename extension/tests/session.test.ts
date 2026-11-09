import test from "node:test";
import assert from "node:assert/strict";
import { createSession, publicStatus, pruneSessions, statusFromReport, updateItem, SESSION_TTL_MS } from "../src/session/manager.ts";
import { validateTrip } from "../src/shared/schema.ts";
import { getYourGuideAdapter } from "../src/adapters/getyourguide.ts";
import type { FillReport } from "../src/content/engine.ts";

const CJ_HOTEL = "https://www.kqzyfj.com/click-101801755-17293132?url=" + encodeURIComponent("https://www.booking.com/hotel/pt/lisboa.html?checkin=2027-04-12");
const CJ_FLIGHT = "https://www.dpbolvw.net/click-101801755-17288982?url=" + encodeURIComponent("https://flights.booking.com/flights/JFK.AIRPORT-LIS.AIRPORT/");
const trip = validateTrip({
  destination: { city: "Lisbon", country: "Portugal" },
  dates: { start: "2027-04-12", end: "2027-04-17" },
  travelers: { adults: 2 },
  items: [
    { id: "hotel-0", type: "hotel", name: "Hotel Lisboa", url: CJ_HOTEL },
    { id: "flight-0", type: "flight", name: "JFK → LIS", url: CJ_FLIGHT },
    { id: "experience-0", type: "experience", name: "Sintra", url: "https://www.getyourguide.com/lisbon-l42/sintra-t1234/" },
    { id: "restaurant-0", type: "restaurant", name: "Taberna", url: "https://www.opentable.com/r/taberna?covers=2" },
  ],
});

test("a session keeps exact URLs, knows each partner, and applies partner policy", () => {
  const session = createSession(trip, { origin: "https://www.glob-trek.com", sourceTabId: 7 });
  assert.match(session.id, /^s_[a-z0-9]{18}$/);
  const byId = Object.fromEntries(session.items.map((item) => [item.id, item]));
  assert.equal(byId["hotel-0"]!.url, CJ_HOTEL, "CJ link untouched");
  assert.equal(byId["hotel-0"]!.partnerName, "Booking.com");
  assert.equal(byId["hotel-0"]!.affiliate, true);
  assert.equal(byId["hotel-0"]!.autofill, false, "Booking.com autofill is off pending written permission");
  assert.match(byId["hotel-0"]!.autofillNote!, /terms/);
  assert.equal(byId["flight-0"]!.partnerName, "Booking.com", "Booking.com Flights via CJ: deep link + copy");
  assert.equal(byId["experience-0"]!.autofill, true);
  assert.equal(byId["restaurant-0"]!.autofill, false);
  assert.ok(session.items.every((item) => item.status === "not_started"));
  assert.deepEqual(session.requiredFields.sort(), ["activity.comments", "contact.email", "contact.phoneCountryCode", "contact.phoneNational", "lead.firstName", "lead.lastName"]);
});

function report(partial: Partial<FillReport>): FillReport {
  return { adapterId: "getyourguide", selectorsVersion: "v", pageKind: "details", filled: [], skipped: [], missing: [], paymentFieldsPresent: false, framedForm: false, passes: 1, timedOut: false, ...partial };
}

test("statuses never claim more than the fill report shows", () => {
  const a = getYourGuideAdapter;
  assert.equal(statusFromReport(report({ filled: [{ key: "lead.firstName", label: "Legal first name" }] }), a).status, "ready_to_review");
  assert.equal(statusFromReport(report({ filled: [{ key: "lead.firstName", label: "x" }], paymentFieldsPresent: true }), a).status, "ready_to_pay");
  assert.equal(statusFromReport(report({ pageKind: "payment" }), a).note, "Review and pay on the partner site.");
  assert.equal(statusFromReport(report({ filled: [{ key: "lead.firstName", label: "x" }], missing: [{ key: "contact.email", label: "Email" }] }), a).status, "needs_attention");
  assert.equal(statusFromReport(report({ skipped: [{ key: "lead.firstName", label: "Legal first name", reason: "not_found" }] }), a).status, "needs_attention");
  assert.equal(statusFromReport(report({ framedForm: true }), a).status, "needs_attention");
  assert.equal(statusFromReport(report({ pageKind: "product" }), a).status, "opened");
  assert.equal(statusFromReport(report({}), a).status, "needs_attention", "nothing filled is never reported as success");
});

test("public status carries statuses and generic notes only", () => {
  let session = createSession(trip, { origin: "https://www.glob-trek.com", sourceTabId: 7 });
  session = updateItem(session, "experience-0", { status: "filled", filled: ["Legal first name"], note: "Filled." });
  const status = publicStatus(session);
  assert.deepEqual(Object.keys(status.items[0]!).sort(), ["id", "note", "partner", "status"]);
  assert.ok(!JSON.stringify(status).includes("Legal first name"));
});

test("old sessions are pruned", () => {
  const now = Date.now();
  const fresh = createSession(trip, { origin: "https://www.glob-trek.com", sourceTabId: null, now });
  const stale = { ...createSession(trip, { origin: "https://www.glob-trek.com", sourceTabId: null, now }), updatedAt: now - SESSION_TTL_MS - 1 };
  assert.deepEqual(Object.keys(pruneSessions({ [fresh.id]: fresh, [stale.id]: stale }, now)), [fresh.id]);
});

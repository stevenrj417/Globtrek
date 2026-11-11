import test from "node:test";
import assert from "node:assert/strict";
import { FOLLOWUP_DAYS, followupEmail, monthlyEmail, tripEmail, welcomeEmail } from "../app/lib/email/templates.js";
import { followupDueAt, followupToken, readFollowupToken, tripKey } from "../app/lib/email/followups.js";
import { trendingTrips } from "../app/data/trending.js";

const model = {
  destination: { id: "lisbon", city: "Lisbon", country: "Portugal" },
  destinationImage: "https://images.example/lisbon.jpg",
  hotel: { name: "Casa Alfama", neighborhood: "Alfama", rating: 9.1, reviewCount: 1200 },
  activities: [{ name: "Tram 28", description: "Ride across the old town" }],
  itinerary: { days: [{ title: "Arrive", morning: "Land", afternoon: "Walk Alfama" }, { title: "Belém", morning: "Pastéis", afternoon: "Monastery" }] },
  bookingManifest: {},
};

test("check-ins go out on days 1, 3, 5, 10, 20 and 30, then stop", () => {
  assert.deepEqual(FOLLOWUP_DAYS, [1, 3, 5, 10, 20, 30]);
  const start = "2026-11-01T15:00:00.000Z";
  assert.equal(followupDueAt(start, 1), "2026-11-02T15:00:00.000Z");
  assert.equal(followupDueAt(start, 6), "2026-12-01T15:00:00.000Z");
  assert.equal(followupDueAt(start, 7), null);
});

test("every check-in names the trip and carries its own stop link", () => {
  for (let step = 1; step <= 6; step += 1) {
    const message = followupEmail({ model, step, viewUrl: "https://www.glob-trek.com/results?s=x", stopUrl: "https://www.glob-trek.com/trip-reminders?stop=abc" });
    assert.match(message.subject, /Lisbon/);
    assert.match(message.html, /Stop emails about this trip/);
    assert.match(message.html, /trip-reminders\?stop=abc/);
  }
  assert.equal(followupEmail({ model, step: 7 }), null);
  assert.match(followupEmail({ model, step: 2 }).html, /Tram 28/);
  assert.match(followupEmail({ model, step: 3 }).html, /Casa Alfama/);
  assert.match(followupEmail({ model, step: 6 }).html, /last email about this trip/);
});

test("stop links verify and can't be forged", () => {
  const id = "3f2b8c1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
  const token = followupToken(id);
  assert.equal(readFollowupToken(token), id);
  assert.equal(readFollowupToken(`${id}.forged`), null);
  assert.equal(readFollowupToken("nonsense"), null);
  assert.equal(tripKey(model), "lisbon");
});

test("trip email asks before starting check-ins, or links a stop when they're on", () => {
  assert.match(tripEmail({ model, viewUrl: null, followup: { confirmUrl: "https://www.glob-trek.com/trip-reminders?confirm=t" } }), /Yes, send me reminders/);
  assert.match(tripEmail({ model, viewUrl: null, followup: { stopUrl: "https://www.glob-trek.com/trip-reminders?stop=t" } }), /Stop emails about this trip/);
  assert.match(tripEmail({ model, viewUrl: null, arrival: true }), /Here(&#039;|')s your trip/);
});

test("welcome and monthly emails show trending trips and an unsubscribe link", () => {
  const welcome = welcomeEmail({ unsubscribeUrl: "https://www.glob-trek.com/unsubscribe?token=t", trips: trendingTrips });
  const monthly = monthlyEmail({ unsubscribeUrl: "https://www.glob-trek.com/unsubscribe?token=t", trips: trendingTrips, date: new Date("2026-12-01T00:00:00Z") });
  assert.match(welcome, new RegExp(trendingTrips[0].name));
  assert.match(monthly, /Places worth going in December/);
  for (const html of [welcome, monthly]) {
    assert.match(html, /unsubscribe\?token=t/);
    assert.match(html, /utm_source=email/);
  }
});

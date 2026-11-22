import assert from "node:assert/strict";
import test from "node:test";
import { daysUntil, storyText, suggestedHeadline } from "../app/lib/share/storyText.js";
import { extraPhoto, tripExtras } from "../app/lib/trip/extras.js";

test("the countdown counts whole days from the traveler's today", () => {
  assert.equal(daysUntil("2026-12-22", "2026-11-22"), 30);
  assert.equal(daysUntil("2026-12-22", "2026-12-21"), 1);
  assert.equal(daysUntil("2026-12-22", "nope"), null);
  assert.equal(suggestedHeadline({ days: 30, name: "Lisbon" }), "30 days until Lisbon");
  assert.equal(suggestedHeadline({ days: 1, name: "Lisbon" }), "Tomorrow: Lisbon");
  assert.equal(suggestedHeadline({ days: 0, name: "Lisbon" }), "Today's the day");
  assert.equal(suggestedHeadline({ days: 90, name: "Lisbon", country: "Portugal", placeOnly: true }), "Next stop: Portugal");
});

test("a story shows no dates unless asked, and hides the city when asked", () => {
  const base = { name: "Lisbon", country: "Portugal", departure: "2026-12-22", returnDate: "2026-12-29", today: "2026-11-22" };
  const plain = storyText(base);
  assert.equal(plain.title, "Lisbon");
  assert.equal(plain.subtitle, "Portugal");
  assert.equal(plain.date, null);
  assert.equal(plain.countdown, "30 days to go");
  assert.equal(storyText({ ...base, showDate: true }).date, "22–29 December 2026");
  const hidden = storyText({ ...base, showDate: true, countryOnly: true });
  assert.equal(hidden.title, "Portugal");
  assert.equal(hidden.date, null, "country-only hides the dates too");
  assert.equal(storyText({ ...base, showCountdown: false }).countdown, null);
  assert.equal(storyText({ ...base, today: "2027-01-05" }).countdown, null, "no countdown after the trip");
});

test("custom words are cleaned and capped", () => {
  const text = storyText({ name: "Lisbon<script>", headline: "  next stop:\n italy <b>" + "x".repeat(80) });
  assert.ok(!/[<>\n]/.test(text.eyebrow + text.title));
  assert.ok(text.eyebrow.length <= 48);
  assert.equal(text.eyebrow.startsWith("next stop: italy"), true);
});

test("every extra card has a credited photo", () => {
  const sections = tripExtras({ level: "luxury", destination: { name: "Lisbon", country: "Portugal" }, airport: { code: "LIS", name: "Lisbon", latitude: 38.77, longitude: -9.13, km: 7 }, stay: { name: "Casa", latitude: 38.71, longitude: -9.14 } });
  for (const item of sections.flatMap((section) => section.items)) {
    assert.ok(item.photo?.url?.startsWith("/quiz/v2/"), item.id);
    assert.ok(item.photo.credit?.artist && item.photo.credit.license, `${item.id} credit`);
  }
  assert.equal(extraPhoto("nonsense"), null);
});

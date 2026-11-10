import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nightsRange } from "../app/lib/trip/schedule.js";

test("trip length answers limit the nights a traveler can pick", () => {
  assert.deepEqual(nightsRange("Long Weekend"), { min: 3, max: 4 });
  assert.deepEqual(nightsRange("Five Nights"), { min: 5, max: 5 });
  assert.deepEqual(nightsRange("One Week"), { min: 7, max: 7 });
  assert.deepEqual(nightsRange("Ten Days"), { min: 10, max: 10 });
  assert.deepEqual(nightsRange("Two Weeks"), { min: 14, max: 14 });
  assert.deepEqual(nightsRange("Open-Ended"), { min: 1, max: 28 });
  assert.deepEqual(nightsRange(undefined), { min: 1, max: 28 });
});

test("a saved trip's nights stay pickable", () => {
  assert.deepEqual(nightsRange("Long Weekend", 6), { min: 3, max: 6 });
  assert.deepEqual(nightsRange("One Week", 5), { min: 5, max: 7 });
  assert.deepEqual(nightsRange("One Week", 40), { min: 7, max: 28 });
});

test("quiz and flight panel use the trip-length calendar", () => {
  const quiz = readFileSync(new URL("../app/discover/TravelQuiz.jsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../app/results/page.jsx", import.meta.url), "utf8");
  assert.match(quiz, /<TripDatePicker[^>]*minNights=\{range\.min\} maxNights=\{range\.max\}/);
  assert.match(quiz, /datedNights >= tripRange\.min && datedNights <= tripRange\.max/);
  assert.doesNotMatch(quiz, /type="date"/);
  assert.match(results, /<TripDatePicker[^>]*minNights=\{range\.min\} maxNights=\{range\.max\}/);
  assert.doesNotMatch(results, /aria-label="Flight departure date"/);
});

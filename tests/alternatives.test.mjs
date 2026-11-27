import test from "node:test";
import assert from "node:assert/strict";
import { pickAlternatives } from "../app/lib/recommendation/alternatives.js";

const place = (city, latitude, longitude, tags, total) => ({ id: city, city, latitude, longitude, tags, budgetPlan: { budgetCheckTotal: total } });

test("alternatives favor similar places nearby over far-off matches", () => {
  const lisbon = place("LISBON", 38.7, -9.1, ["Cities", "Food", "Couple"], 2000);
  const matches = [place("MINNEAPOLIS", 44.9, -93.2, ["Cities", "Couple"], 2100), place("NASHVILLE", 36.1, -86.8, ["Music", "Couple"], 2000), place("PORTO", 41.1, -8.6, ["Cities", "Food"], 1900), place("SEVILLE", 37.4, -6, ["Cities", "Food", "History"], 2050), lisbon];
  const picks = pickAlternatives(matches, lisbon, "LISBON", 2).map((item) => item.city);
  assert.deepEqual(picks.sort(), ["PORTO", "SEVILLE"]);
});

test("the trip on screen is never its own alternative", () => {
  const a = place("A", 0, 0, ["Food"], 1000);
  assert.equal(pickAlternatives([a, place("B", 1, 1, ["Food"], 1000)], a, "A").some((item) => item.city === "A"), false);
});

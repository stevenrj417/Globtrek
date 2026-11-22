import assert from "node:assert/strict";
import test from "node:test";
import { destinations } from "../app/data/destinations.js";
import { rankDestinations } from "../app/lib/recommendation/destinationEngine.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";
import { structuredOrigin } from "../app/lib/recommendation/travelArea.js";
import { WARM_COAST_C, seasonSuitable } from "../app/lib/recommendation/eligibility.js";
import coastTemps from "../app/data/coastTemps.json" with { type: "json" };

// A coast + food trip from Portland, Oregon in December once matched Portland,
// Maine, which averages about 2 °C then. Coast trips now go somewhere warm.
const quiz = (overrides = {}) => ({
  answers: { alive: "Ocean", escape: "Food", duration: "A Week", hotel: "Whatever's cheapest" },
  exactBudget: 3000, guestCount: "1", isFlexible: false, tripStart: "2026-12-08", tripEnd: "2026-12-15",
  originAirport: "PDX", originDetails: structuredOrigin("PDX"), travelAreaPreference: "anywhere",
  ...overrides,
});

test("December coast trip from PDX skips cold coasts like Portland, Maine", () => {
  const profile = normalizeTravelerProfile(quiz());
  const maine = destinations.find((item) => item.id === "portland-maine-76868");
  assert.equal(seasonSuitable(maine, profile), false);
  const ranked = rankDestinations(destinations, profile);
  assert.ok(ranked.length > 0, "a warm coast still matches");
  for (const match of ranked) {
    const temps = coastTemps.temps[match.id];
    if (temps) assert.ok(temps[11] >= WARM_COAST_C, `${match.id} averages ${temps[11]} °C in December`);
  }
});

test("Portland, Maine is still a coast pick in summer", () => {
  const maine = destinations.find((item) => item.id === "portland-maine-76868");
  assert.equal(seasonSuitable(maine, normalizeTravelerProfile(quiz({ tripStart: "2027-07-06", tripEnd: "2027-07-13" }))), true);
});

test("cold places are fine in December when the trip isn't about the coast", () => {
  const maine = destinations.find((item) => item.id === "portland-maine-76868");
  assert.equal(seasonSuitable(maine, normalizeTravelerProfile(quiz({ answers: { alive: "Cities", escape: "Food", duration: "A Week" } }))), true);
});

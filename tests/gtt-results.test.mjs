import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/results/page.jsx", import.meta.url), "utf8");
const sections = await readFile(new URL("../app/components/TripProposalSections.jsx", import.meta.url), "utf8");

test("GTT results use a single proposal booking action instead of search sections", () => {
  assert.match(page, /BOOK NOW/);
  assert.doesNotMatch(page, /FlightSearchSection|Search flights|Search hotels|Search restaurants|Search activities/);
  assert.match(page, /bookingPropertyUrl\(selectedHotel/);
});

test("sticky trip action always reflects current selections and flight logistics", () => {
  assert.match(page, /aria-label="Trip action"/);
  assert.match(page, /selectedHotel \? "✓"/);
  assert.match(page, /selectedRestaurants\.length/);
  assert.match(page, /selectedActivities\.length/);
  assert.match(page, /activeDates/);
  assert.match(page, /activeTravelers/);
  assert.match(page, /buildBudgetPlan\(activeProfile, flightDestination\)/);
  assert.match(page, /tripContext=\{flightContext\}/);
  assert.match(page, /key=\{`flight-\$\{destinationKey\}`\}/);
  assert.match(page, /key=\{`hotel-\$\{destinationKey\}`\}/);
  assert.doesNotMatch(page, /finalActionsVisible|aria-hidden={finalActionsVisible}/);
});

test("itinerary is curated horizontally and dining and experiences are separate selectable edits", () => {
  assert.match(sections, /days\.slice\(0, 3\)/);
  assert.match(sections, /A first look at your/);
  assert.match(sections, /id="dining"/);
  assert.match(sections, /id="experiences"/);
  assert.match(sections, /aria-pressed={selected}/);
  assert.match(sections, /<BrandMark/);
  assert.doesNotMatch(sections, /type="checkbox"/);
});

test("flight proposal states when live itinerary data is not connected", () => {
  assert.match(page, /live itinerary not connected/);
  assert.match(page, /Update flight options/);
  assert.match(page, /Departure airport/);
  assert.match(page, /Preferred departure/);
  assert.match(page, /flightTimingPreference/);
  assert.doesNotMatch(page, /flight number|airline/i);
});

test("experience edit is curated to three cards with visual fallbacks", () => {
  assert.match(sections, /initialLimit=\{3\}/);
  assert.match(sections, /View all.*experiences/);
  assert.match(sections, /destination\.image/);
  assert.match(sections, /Destination view/);
});

test("final visual refinement keeps a cinematic hero and removes the redundant closing panel", () => {
  assert.match(page, /min-h-\[92svh\]/);
  assert.match(page, /top-1\/2/);
  assert.doesNotMatch(page, /Ready when you are/);
  assert.match(page, /<CostSection[^>]+onBook=\{bookNow\}/);
});

test("itinerary preview uses three distinct grounded presentation slots", () => {
  assert.match(sections, /Arrival & settle/);
  assert.match(sections, /Historic neighborhoods/);
  assert.match(sections, /Local experiences/);
  assert.match(sections, /verifiedImages\[index\] \|\| trip\.image/);
});

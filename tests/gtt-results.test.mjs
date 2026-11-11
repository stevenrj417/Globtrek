import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/results/page.jsx", import.meta.url), "utf8");
const sections = await readFile(new URL("../app/components/TripProposalSections.jsx", import.meta.url), "utf8");
const restaurantRoute = await readFile(new URL("../app/api/restaurants/recommend/route.js", import.meta.url), "utf8");

test("GTT results use a single proposal booking action instead of search sections", () => {
  assert.match(page, /onBook={goToBooking}/);
  assert.doesNotMatch(page, /FlightSearchSection|Search flights|Search hotels|Search restaurants|Search activities/);
  assert.match(page, /bookingPropertyUrl\(stay, stayLinkContext\(context, stay\)\)/);
  assert.match(page, /<BookingChecklist entries=\{bookingManifestEntries\(bookingManifest\)\}/);
  assert.doesNotMatch(page, /launchBookingManifest|window\.open/);
});

test("sticky trip action always reflects current selections and flight logistics", () => {
  assert.match(page, /<TripDock /);
  assert.match(page, /view\.stay \? "stay chosen"/);
  assert.match(page, /selectedRestaurants\.length/);
  assert.match(page, /selectedActivities\.length/);
  assert.match(page, /schedule\.datesLabel/);
  assert.match(page, /buildBudgetPlan\(activeProfile, flightDestination, \{ stay: stayOption, observedFare: /);
  assert.match(page, /tripContext=\{context\}/);
  assert.match(page, /key=\{`flight-\$\{destinationKey\}`\}/);
  assert.match(page, /key=\{`stay-\$\{destinationKey\}`\}/);
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

test("flight proposal shows the fare basis and that it is planning, not a live search", () => {
  assert.match(page, /round trip per person · \{estimate\.basis/);
  assert.match(page, /Planning preferences, not a live search/);
  assert.match(page, /Update flight options/);
  assert.match(page, /Departure airport/);
  assert.match(page, /Preferred departure/);
  assert.match(page, /flightTimingPreference/);
  assert.doesNotMatch(page, /flight number|airline/i);
});

test("dining and experience edits each surface four verified choices with visual fallbacks", () => {
  assert.equal((sections.match(/initialLimit=\{4\}/g) || []).length, 2);
  assert.match(restaurantRoute, /slice\(0, 4\)/);
  assert.match(restaurantRoute, /slice\(0, 4\)/);
  assert.match(sections, /Show all \$\{.*\} \$\{noun\}/);
  assert.match(sections, /status === "ready" && !items\.length\) return null/, "an empty section is left out");
  assert.match(sections, /LOAD_TIMEOUT = 9000/, "each section times out and offers a retry");
  assert.doesNotMatch(sections, /destination\.image|Destination view/, "cards never stand in a city photo for a named place");
});

test("final visual refinement keeps a cinematic hero and removes the redundant closing panel", () => {
  assert.match(page, /min-h-\[92svh\]/);
  assert.match(page, /top-1\/2/);
  assert.doesNotMatch(page, /Ready when you are/);
  assert.match(page, /href="#booking-center"/);
});

test("itinerary preview uses three distinct grounded presentation slots", () => {
  assert.match(sections, /Arrival & settle/);
  assert.match(sections, /Historic neighborhoods/);
  assert.match(sections, /Local experiences/);
  assert.match(sections, /text\.includes\(String\(item\.name\)\.toLowerCase\(\)\)/, "a day shows a photo of a place it mentions");
});

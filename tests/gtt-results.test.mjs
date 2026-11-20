import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/results/ResultsClient.jsx", import.meta.url), "utf8");
const sections = await readFile(new URL("../app/components/TripProposalSections.jsx", import.meta.url), "utf8");
const restaurantRoute = await readFile(new URL("../app/api/restaurants/recommend/route.js", import.meta.url), "utf8");

test("GTT results use a single proposal booking action instead of search sections", () => {
  assert.match(page, /onBook={goToBooking}/);
  assert.doesNotMatch(page, /FlightSearchSection|Search flights|Search hotels|Search restaurants|Search activities/);
  assert.match(page, /bookingPropertyUrl\(stay, stayLinkContext\(datedContext, stay\)\)/, "the stay link carries the trip dates, suggested ones for flexible trips");
  assert.match(page, /bookingPageUrl\(bookingManifest, window\.location\.origin\)/, "Start booking opens the booking page");
  assert.doesNotMatch(page, /<BookingChecklist /, "the checklist lives on the booking page, not the results page");
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

test("no itinerary on results; dining and experiences are separate selectable edits", () => {
  assert.doesNotMatch(sections + page, /ProposalItinerary|id="itinerary"/);
  assert.match(sections, /id="dining"/);
  assert.match(sections, /id="experiences"/);
  assert.match(sections, /aria-pressed={selected}/);
  assert.match(sections, /<BrandMark/);
  assert.doesNotMatch(sections, /type="checkbox"/);
});

test("flight card prices only from recent fares, offers one search action, and keeps the fare basis in details", () => {
  assert.match(page, /const observed = OBSERVED_FARE_SOURCES\.includes\(estimate\?\.source\)/);
  assert.match(page, /Typical round trip per person/);
  assert.match(page, /Check flights/);
  assert.match(page, /Flights: \{flights\.basis\}/);
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
  assert.match(page, /data-trip-hero/);
  assert.match(page, /Estimated price · final prices confirmed by providers/);
  assert.doesNotMatch(page, /Ready when you are/);
  assert.match(page, /onClick=\{goToBooking\}/);
});

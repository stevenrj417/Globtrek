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

test("itinerary is collapsed and dining and experiences are separate selectable edits", () => {
  assert.match(sections, /hidden={!isOpen}/);
  assert.match(sections, /id="dining"/);
  assert.match(sections, /id="experiences"/);
  assert.match(sections, /aria-pressed={selected}/);
  assert.match(sections, /<BrandMark/);
  assert.doesNotMatch(sections, /type="checkbox"/);
});

test("flight proposal states when live itinerary data is not connected", () => {
  assert.match(page, /live itinerary not connected/);
  assert.doesNotMatch(page, /flight number|airline/i);
});

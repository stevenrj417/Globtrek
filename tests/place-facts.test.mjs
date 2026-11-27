import test from "node:test";
import assert from "node:assert/strict";
import { placeFacts } from "../app/lib/places/placeFacts.js";
import { hotelPriceLevel } from "../app/lib/hotels/priceLevel.js";

test("sights get a price level from their kind, paid before free", () => {
  assert.equal(placeFacts({ name: "X", category: "amusement park" }, "activity").priceSign, "$$$");
  assert.equal(placeFacts({ name: "X", category: "aquarium" }, "activity").priceSign, "$$");
  assert.equal(placeFacts({ name: "X", category: "art museum" }, "activity").priceSign, "$");
  assert.equal(placeFacts({ name: "X", category: "city park" }, "activity").priceSign, "Free");
  assert.equal(placeFacts({ name: "X", category: "church" }, "activity").priceSign, "Free–$");
  assert.equal(placeFacts({ name: "X", category: "national park" }, "activity").priceInfo.label, "Park entry fee often charged");
});

test("a vague Google category says nothing; unknown kinds get no price", () => {
  const facts = placeFacts({ name: "X", category: "tourist attraction" }, "activity");
  assert.equal(facts.priceSign, undefined);
});

test("a price already known is never replaced", () => {
  assert.deepEqual(placeFacts({ name: "X", category: "museum", isFree: true }, "activity"), {});
  assert.equal(placeFacts({ name: "X", category: "fine dining restaurant", priceLevel: "PRICE_LEVEL_MODERATE" }, "restaurant").priceSign, undefined);
});

test("restaurants without a price get one only when the kind says it", () => {
  assert.equal(placeFacts({ name: "X", category: "fine dining restaurant" }, "restaurant").priceSign, "$$$$");
  assert.equal(placeFacts({ name: "X", category: "bakery" }, "restaurant").priceSign, "$");
  assert.equal(placeFacts({ name: "X", category: "restaurant" }, "restaurant").priceSign, undefined);
});

test("hotels get a level from their class and a typical night for their city, labeled as typical", () => {
  const four = hotelPriceLevel({ category: "Hotel", starRating: 4, destinationId: "LIS" });
  assert.equal(four.level, "$$$");
  assert.ok(four.typical > 0);
  assert.match(four.basis, /not this hotel's own rate/);
  assert.equal(hotelPriceLevel({ category: "Hostel", dorms: true, destinationId: "LIS" }).unit, "bed");
  assert.equal(hotelPriceLevel({ category: "Hotel", starRating: 2, destinationId: "LIS" }).level, "$");
  assert.ok(hotelPriceLevel({ category: "Hotel", starRating: 3, destinationId: "LIS" }).typical < four.typical);
  // Resort islands: a level, but no dollar figure from a band that is far too low.
  const resort = hotelPriceLevel({ category: "Resort", starRating: 5, destinationId: "MLE" });
  assert.equal(resort.level, "$$$$");
  assert.equal(resort.typical, null);
});

test("a ticketed sight gets a $ level from its kind, never Free", () => {
  assert.equal(placeFacts({ name: "X", category: "zoo", tier: "ticketed" }, "activity").priceSign, "$$");
  assert.equal(placeFacts({ name: "X", category: "park", tier: "ticketed" }, "activity").priceSign, undefined);
});

test("a guest house's room count is not a whole home's bedrooms", () => {
  assert.equal(hotelPriceLevel({ category: "Guest house", starRating: 4, bedrooms: 2, destinationId: "LIS" }).unit, "room");
  assert.equal(hotelPriceLevel({ category: "Apartment", bedrooms: 2, destinationId: "LIS" }).unit, "2-bedroom place");
});

test("a shortlist group name is not mistaken for the hotel's class", () => {
  assert.equal(hotelPriceLevel({ category: "Hotel", starRating: 5, tier: "upscale", destinationId: "BKK" }).level, "$$$$");
});

import test from "node:test";
import assert from "node:assert/strict";
import { withCuisinePhotos, cuisineOf } from "../app/lib/places/cuisinePhotos.js";

test("restaurants without a photo get a food photo, never the same one twice in a list", () => {
  const items = Array.from({ length: 40 }, (_, index) => ({ id: `r${index}`, name: `Place ${index}`, category: index % 2 ? "thai restaurant" : "restaurant" }));
  const out = withCuisinePhotos(items, { country: "THAILAND" });
  assert.ok(out.every((item) => item.imageUrl && item.imageIsExample && item.imageCredit));
  assert.equal(new Set(out.map((item) => item.imageUrl)).size, out.length);
});

test("a place's own photo is kept and not reused for another", () => {
  const own = { id: "a", name: "A", category: "restaurant", imageUrl: "https://upload.wikimedia.org/x.jpg" };
  const out = withCuisinePhotos([own, { id: "b", name: "B", category: "pizza restaurant" }], { country: "ITALY" });
  assert.equal(out[0], own);
  assert.notEqual(out[1].imageUrl, own.imageUrl);
  assert.equal(out[1].imageIsExample, true);
});

test("cuisine comes from the category, then the country", () => {
  assert.equal(cuisineOf({ category: "taco restaurant" }), "mexican");
  assert.equal(cuisineOf({ category: "bar and grill" }), "american");
  assert.equal(cuisineOf({ category: "restaurant" }, { country: "JAPAN" }), "japanese");
  assert.equal(cuisineOf({ category: "restaurant" }, { country: "NOWHERE" }), "restaurant");
});

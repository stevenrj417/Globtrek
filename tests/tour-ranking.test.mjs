import test from "node:test";
import assert from "node:assert/strict";
import { rankProducts } from "../app/lib/activities/wegotrip.js";

const tour = (id, name, rating, ratingsCount) => ({ id: `w-${id}`, name, rating, ratingsCount, price: 20, currency: "USD", category: "Museum & Attraction Tickets", durationMinutes: 120 });

test("the same sight sold several ways shows once before other sights", () => {
  const products = [
    tour(1, "Estadio da Luz & Benfica Museum: Entry Ticket", 4.6, 145),
    tour(2, "Estadio da Luz: Entry Ticket + Scarf Offer", 4.9, 24),
    tour(3, "Benfica Museum: Entry Ticket", 4.6, 14),
    tour(4, "Jeronimos Monastery Ticket", 3.9, 935),
    tour(5, "Pena Palace Entrance Ticket", 3.8, 1662),
  ];
  const top = rankProducts(products).slice(0, 3).map((item) => item.id);
  assert.deepEqual(top.sort(), ["w-1", "w-4", "w-5"]);
});

test("a perfect score from one review does not beat a well-reviewed sight", () => {
  const ranked = rankProducts([tour(1, "Tiny Experience", 5, 1), tour(2, "Famous Palace", 4.4, 2000)]);
  assert.equal(ranked[0].id, "w-2");
});

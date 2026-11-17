import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GUIDES, SKIPPED_GUIDES } from "../app/data/guides.js";
import { buildGuide, publishedGuides } from "../app/lib/guides/buildGuide.js";

const feed = JSON.parse(readFileSync(new URL("../app/data/feedStays.json", import.meta.url), "utf8")).stays;
const townStays = JSON.parse(readFileSync(new URL("../app/data/guideStays.json", import.meta.url), "utf8")).towns;
const staysFor = (guide) => guide.town ? townStays[guide.town]?.stays || [] : feed[guide.destinationId] || [];
const guides = publishedGuides();

test("every guide is published or listed as skipped, with one URL each", () => {
  assert.equal(GUIDES.length + SKIPPED_GUIDES.length, 100);
  assert.equal(new Set(GUIDES.map((guide) => guide.slug)).size, GUIDES.length);
  for (const guide of GUIDES) assert.match(guide.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, guide.slug);
  assert.ok(guides.length >= 70, `${guides.length} guides published`);
});

test("place guides show 4 real feed stays and never a made-up price", () => {
  for (const guide of guides.filter((item) => item.stays)) {
    assert.equal(guide.stays.length, 4, guide.slug);
    const real = new Map(staysFor(guide).map((stay) => [stay.id, stay]));
    for (const stay of guide.stays) {
      const source = real.get(stay.id);
      assert.ok(source, `${guide.slug}: ${stay.name} is in the feed`);
      assert.equal(stay.name, source.name);
      assert.equal(stay.photo, source.photos[0]);
      if (stay.price) assert.ok(stay.price.value > 0 && ["room", "dorm bed"].includes(stay.price.unit));
      if (stay.evidence) assert.ok(stay.evidence.length > 3);
    }
    assert.ok(/not the property's own rate/.test(guide.stayNote), `${guide.slug} labels prices as typical`);
  }
});

test("guides have 4–5 FAQs, a quiz link, related guides, and their own opening", () => {
  const openings = new Set();
  for (const guide of guides) {
    assert.ok(guide.faqs.length >= 4 && guide.faqs.length <= 5, `${guide.slug} has ${guide.faqs.length} FAQs`);
    assert.ok(guide.quizHref.startsWith("/discover"), guide.slug);
    assert.ok(guide.related.length >= 3 && guide.related.length <= 5, guide.slug);
    assert.ok(!guide.related.some((item) => item.slug === guide.slug), guide.slug);
    const opening = guide.quick.join(" ");
    assert.ok(!openings.has(opening), `${guide.slug} repeats another guide's opening`);
    openings.add(opening);
  }
});

test("weekend guides plan 2 days and 2 nights; budget guides plan longer", () => {
  for (const guide of guides) {
    if (["weekend", "hotels", "feature"].includes(guide.kind)) {
      assert.equal(guide.costs.nights, 2, guide.slug);
      assert.deepEqual(guide.plan.map((day) => day.name), ["Saturday", "Sunday"], guide.slug);
    }
    if (guide.kind === "budget") assert.ok(guide.plan.length >= 3 && guide.costs.nights === 4, guide.slug);
  }
});

test("Book links stay on Booking.com through CJ tracking", () => {
  for (const guide of guides.filter((item) => item.stays)) {
    for (const stay of guide.stays) {
      assert.match(stay.bookingUrl, /^https:\/\/www\.booking\.com\//, `${guide.slug} ${stay.name}`);
      if (stay.cjTrackingBaseUrl) assert.match(stay.cjTrackingBaseUrl, /^https:\/\/www\.(kqzyfj|dpbolvw|jdoqocy|tkqlhce|anrdoezrs)\.(com|net)\/click-101801755-/);
    }
  }
});

test("town guides use the town's own stays, photo credit and weather", () => {
  const towns = guides.filter((guide) => guide.town);
  assert.ok(towns.length >= 12, `${towns.length} town guides`);
  for (const guide of towns) {
    assert.ok(guide.imageCredit?.artist && guide.imageCredit.license && guide.imageCredit.source.startsWith("https://commons.wikimedia.org/"), guide.slug);
    assert.ok(guide.faqs.some(([question]) => /weather/.test(question)), `${guide.slug} has weather`);
    assert.match(guide.costs.lodgingSource, /general US budget-hotel band/, guide.slug);
  }
});

test("a guide without 4 matching stays isn't published", () => {
  assert.equal(buildGuide({ slug: "test-no-stays", title: "Test", kind: "weekend", destinationId: "oregon-coast-76868", place: "Nowhere", area: { name: "Nowhere", town: "Nowhere" } }), null);
});

test("hand-picked hotels are real feed listings with tier prices, never per-hotel rates", () => {
  const guide = buildGuide(GUIDES.find((item) => item.slug === "weekend-in-lisbon-on-a-budget"));
  assert.ok(guide.hotelPicks, "Lisbon has hotel picks");
  assert.deepEqual(guide.hotelPicks.tiers.map((tier) => tier.key), ["cheap", "average", "expensive"]);
  for (const tier of guide.hotelPicks.tiers) {
    assert.ok(tier.price.low > 0 && tier.price.high >= tier.price.low);
    for (const hotel of tier.hotels) {
      assert.match(hotel.cjClickUrl, /^https:\/\/www\.(kqzyfj|dpbolvw|anrdoezrs|jdoqocy|tkqlhce)\.(com|net)\//);
      assert.match(hotel.bookingUrl, /^https:\/\/www\.booking\.com\/hotel\//);
      assert.ok(hotel.photos.length);
      assert.equal(hotel.pickedAs, undefined);
      assert.equal(hotel.price, undefined);
    }
  }
  const town = buildGuide(GUIDES.find((item) => item.slug === "weekend-in-bend-oregon"));
  assert.equal(town.hotelPicks.tiers[0].price.where, "this region");
});

test("budget levels never share a hotel, and lodging rises from budget to splurge", () => {
  for (const guide of publishedGuides().filter((item) => item.budgets?.length === 3)) {
    const names = guide.budgets.flatMap((level) => level.stays.map((stay) => stay.name.toLowerCase()));
    assert.equal(new Set(names).size, names.length, `${guide.slug} repeats a hotel across budgets`);
    const [budget, mid, splurge] = guide.budgets;
    assert.deepEqual([budget.key, mid.key, splurge.key], ["budget", "mid", "splurge"]);
    if (budget.lodging) assert.ok(budget.lodging[1] <= mid.lodging[0] && mid.lodging[1] <= splurge.lodging[0], guide.slug);
    for (const level of guide.budgets) assert.ok(level.stays.length >= 1 && level.stays.length <= 3, guide.slug);
  }
});

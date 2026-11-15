import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { destinations, destinationByExactMatch, destinationByOutcomeId } from "../app/data/destinations.js";
import { buildDestinationPlanningAverages } from "../app/data/destinationPlanningAverages.js";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const outcomes = read("../app/data/destinationOutcomes.json").outcomes;
const batch05 = read("../scripts/destinations/verified-batch-05.json").records;

test("every master-list outcome resolves to exactly one catalog destination", () => {
  assert.equal(outcomes.length, 237);
  const ids = new Set();
  for (const outcome of outcomes) {
    const byExact = destinationByExactMatch(outcome.exactMatch);
    assert.ok(byExact, `${outcome.outcomeId} ${outcome.exactMatch} has a destination`);
    assert.equal(byExact.outcomeId, outcome.outcomeId);
    assert.equal(destinationByOutcomeId(outcome.outcomeId), byExact);
    assert.ok(!ids.has(byExact.id), `${byExact.id} is linked from one outcome only`);
    ids.add(byExact.id);
  }
  assert.equal(destinations.filter((item) => item.outcomeId).length, 237);
});

test("Exact Match lookups are exact, never fuzzy", () => {
  assert.ok(destinationByExactMatch("Banff National Park, Canada"));
  assert.equal(destinationByExactMatch("banff national park, canada"), null);
  assert.equal(destinationByExactMatch(" Banff National Park, Canada"), null);
  assert.equal(destinationByExactMatch("Banff National Park"), null);
  assert.equal(destinationByOutcomeId("GT-9999"), null);
});

test("new master-list heroes are real photos with credit, never flags, maps or .tif", () => {
  assert.equal(batch05.length, 101);
  for (const record of batch05) {
    const hero = record.images.find((image) => image.isHero);
    assert.ok(hero, `${record.id} has a hero`);
    assert.doesNotMatch(hero.imageUrl.split("?")[0], /\.(svg|tiff?|png|gif)$/i, `${record.id} hero is a photo`);
    assert.doesNotMatch(decodeURIComponent(hero.imageUrl), /flag|map|locator|orthographic|topographic/i, `${record.id} hero is not a flag or map`);
    assert.ok(hero.width >= 1000, `${record.id} hero is ${hero.width}px wide`);
    assert.ok(hero.author && hero.licenseName && hero.sourcePageUrl, `${record.id} hero has author, license and source`);
  }
});

test("lodging price bands never price resort economies and say they are bands", () => {
  const maldives = destinations.find((item) => item.id === "MLE");
  assert.notEqual(buildDestinationPlanningAverages(maldives).model, "price_band");
  const banded = destinations.map((item) => [item, buildDestinationPlanningAverages(item)]).filter(([, plan]) => plan.model === "price_band");
  assert.ok(banded.length > 0);
  for (const [item, plan] of banded) {
    assert.match(plan.basis, /regional price band shared by \d+ places/, item.id);
    assert.match(plan.basis, /Not a live quote/, item.id);
  }
});

test("the full lodging price guide stays out of browser code", () => {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = `${dir}/${name}`;
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(jsx?|mjs)$/.test(name)) files.push(path);
    }
  };
  walk(new URL("../app", import.meta.url).pathname);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (/lodgingPriceGuide\.json/.test(source)) assert.doesNotMatch(source, /^["']use client["']/m, `${file} imports the full guide in browser code`);
  }
});

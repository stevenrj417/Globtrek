import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { addNights, nightsBetween, tripSchedule } from "../app/lib/trip/schedule.js";
import { decodeSharedTrip, encodeSharedTrip, pickTrip, resolveResultsState } from "../app/lib/results/resolveResults.js";
import { buildStayShortlist } from "../app/lib/recommendation/stayShortlist.js";
import { stayBudgetOption, stayPrice } from "../app/lib/pricing/stayPrice.js";
import { buildBudgetPlan } from "../app/lib/recommendation/budgetEngine.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";
import { bookingPropertyUrl, destinations } from "../app/data/destinations.js";
import { CHEAP_STAYS } from "../app/data/cheapStays.js";
import { createCjClient, redact } from "../app/lib/catalog/cjClient.js";
import { normalizeRecord, runImport } from "../app/lib/catalog/cjBookingImporter.js";
import { SnapshotCatalogStore, SupabaseCatalogStore } from "../app/lib/catalog/catalogStore.js";
import { buildBookingManifest, bookingManifestEntries } from "../app/lib/booking/manifest.js";

const TOKEN = "test-token-abc123";
const ENV = { CJ_API_TOKEN: TOKEN, CJ_COMPANY_ID: "111", CJ_PID: "222" };
const noWait = async () => {};

// ---------- dates → nights ----------

test("dates become nights in one place, and flexible dates ignore stale dates", () => {
  assert.equal(nightsBetween("2027-01-12", "2027-01-17"), 5);
  assert.equal(nightsBetween("2027-01-17", "2027-01-12"), null);
  assert.equal(nightsBetween("2027-02-30", "2027-03-02"), null, "invalid calendar dates are rejected");
  const fixed = tripSchedule({ tripStart: "2027-01-12", tripEnd: "2027-01-17", answers: { duration: "Two Weeks" } });
  assert.equal(fixed.nights, 5, "dates win over the quiz's trip length answer");
  assert.equal(fixed.label, "5 nights");
  const flexible = tripSchedule({ isFlexible: true, tripStart: "2027-01-12", tripEnd: "2027-01-17", answers: { duration: "Ten Days" } });
  assert.equal(flexible.nights, 10);
  assert.equal(flexible.start, null);
  assert.equal(tripSchedule({}).nights, 7);
  const long = tripSchedule({ tripStart: "2027-01-01", tripEnd: "2027-03-01" });
  assert.equal(long.nights, 28);
  assert.equal(nightsBetween(long.start, long.end), 28, "a capped stay keeps dates and nights in agreement");
});

test("the traveler profile, budget and stay price all use the schedule's nights", () => {
  const quiz = { tripStart: "2027-02-10", tripEnd: addNights("2027-02-10", 4), answers: { duration: "Two Weeks", spendStyle: "cheapest" }, guestCount: "1" };
  const profile = normalizeTravelerProfile(quiz);
  assert.equal(profile.tripLength, 4);
  const destination = destinations.find((item) => item.id === "HAN" || item.airport === "HAN");
  const plan = buildBudgetPlan(profile, destination);
  assert.equal(plan.lodging.nights, 4);
  assert.equal(plan.estimates.hotel.average, plan.lodging.perUnit * plan.lodging.units * plan.lodging.nights);
});

// ---------- URL vs saved state ----------

test("?destination=HAN shows Hanoi even when the browser saved an Oaxaca trip", () => {
  const savedQuiz = JSON.stringify({ answers: { alive: "Culture" }, originAirport: "PDX" });
  const savedStay = JSON.stringify({ destinationId: "OAX", id: "cj-123" });
  const state = resolveResultsState({ search: "?destination=HAN", savedQuiz, savedStay });
  assert.equal(state.destinationId, "HAN");
  assert.equal(state.source, "direct_with_preferences");
  assert.equal(state.stayId, null, "a stay chosen for Oaxaca is never applied to Hanoi");
  assert.equal(state.quiz.originAirport, "PDX", "saved preferences still apply");
  const oaxaca = { id: "OAX", city: "Oaxaca" };
  const trip = pickTrip({ destinationId: "HAN", matches: [oaxaca], catalog: [{ id: "HAN", city: "Hanoi" }, oaxaca], plan: (item) => ({ ...item, planned: true }) });
  assert.equal(trip.city, "Hanoi", "the named destination is planned even when ranking left it out");
  assert.equal(pickTrip({ destinationId: "ZZZ", matches: [oaxaca], catalog: [], plan: () => null }), null, "an unknown destination never falls back to another one");
});

test("a shared trip link is deterministic and ignores everything saved in the browser", () => {
  const payload = encodeSharedTrip({ quiz: { tripStart: "2027-03-01", tripEnd: "2027-03-06", answers: {} }, destination: "LIS", stay: "cj-42" });
  const fresh = resolveResultsState({ search: `?trip=${payload}` });
  const stale = resolveResultsState({ search: `?trip=${payload}&destination=OAX`, savedQuiz: JSON.stringify({ tripStart: "2026-12-01" }), savedStay: JSON.stringify({ destinationId: "LIS", id: "cj-99" }) });
  assert.deepEqual(stale, fresh);
  assert.equal(fresh.destinationId, "LIS");
  assert.equal(fresh.stayId, "cj-42");
  assert.equal(decodeSharedTrip("%%%"), null);
  assert.equal(decodeSharedTrip("x".repeat(13000)), null);
  assert.equal(resolveResultsState({ search: "?destination=<script>" }).destinationId, null);
});

// ---------- shortlist ----------

const NOW = Date.parse("2026-11-09T00:00:00Z");
function stay(id, extra = {}) {
  return { id, name: `Stay ${id}`, bookingUrl: `https://www.booking.com/hotel/vn/${id}.html`, source: "catalog", importedAt: "2026-11-08", photos: ["https://cf.bstatic.com/a.jpg"], amenities: [], ...extra };
}
const lisbon = destinations.find((item) => item.id === "LIS" || item.airport === "LIS");

test("the shortlist gives three different roles and never prices a stay at $0", () => {
  const profile = normalizeTravelerProfile({ tripStart: "2027-02-01", tripEnd: "2027-02-06", guestCount: "2", answers: { spendStyle: "value" } });
  const budgetPlan = buildBudgetPlan(profile, lisbon);
  const candidates = [
    stay("hostel", { category: "Hostel", dorms: true, roomTypes: ["Bed in 6-bed dorm"] }),
    stay("guesthouse", { category: "Guest house", roomTypes: ["Double room"] }),
    stay("hotel3", { category: "Hotel", starRating: 3, roomTypes: ["Double room"] }),
    stay("hotel4", { category: "Hotel", starRating: 4, roomTypes: ["Superior double"] }),
  ];
  const { choices, notice } = buildStayShortlist({ candidates, profile, destination: lisbon, budgetPlan, now: NOW });
  assert.deepEqual(choices.map((choice) => choice.role), ["Our pick", "Best value", "Upgrade"]);
  assert.equal(new Set(choices.map((choice) => choice.id)).size, 3);
  assert.equal(notice, null);
  const upgrade = choices.find((choice) => choice.role === "Upgrade");
  assert.ok(!upgrade.dorms, "the upgrade is never a dorm");
  for (const choice of choices) {
    assert.equal(choice.price.kind, "unavailable", "catalog stays have no trustworthy price");
    assert.equal(choice.price.total, null);
    assert.doesNotMatch(choice.why, /within (your )?budget|\$0/);
  }
});

test("fewer than three valid stays → only those, with a plain explanation", () => {
  const profile = normalizeTravelerProfile({ guestCount: "1", answers: {} });
  const budgetPlan = buildBudgetPlan(profile, lisbon);
  const { choices, notice } = buildStayShortlist({ candidates: [stay("only", { category: "Hostel", dorms: true }), { id: "bad", name: "No link", bookingUrl: "https://evil.example/x" }], profile, destination: lisbon, budgetPlan, now: NOW });
  assert.equal(choices.length, 1);
  assert.match(notice, /Only 1 stay/);
  const none = buildStayShortlist({ candidates: [stay("x")], profile, destination: lisbon, budgetPlan, accessibleOnly: true, now: NOW });
  assert.equal(none.choices.length, 0);
  assert.match(none.notice, /accessibility/);
});

test("stay prices follow the hierarchy: observed, estimate, unavailable", () => {
  const [airport, cheap] = Object.entries(CHEAP_STAYS).find(([, value]) => value.bedNight);
  const property = { bookingUrl: `https://www.booking.com/hotel/${cheap.path}` };
  const observed = stayPrice(property, { airport, nights: 3, travelers: 2, month: airport === "MSY" ? 3 : 2 });
  assert.equal(observed.kind, "observed");
  assert.equal(observed.total, observed.perUnit * observed.units * 3);
  assert.ok(observed.observedAt);
  const otherMonth = stayPrice(property, { airport, nights: 3, travelers: 2, month: 8 });
  assert.equal(otherMonth.kind, "estimate");
  assert.equal(stayPrice(property, { airport, nights: 3, travelers: 2, privateRoom: true }).kind, "unavailable", "a dorm price is never used for a private room");
  const missing = stayPrice({ bookingUrl: "https://www.booking.com/hotel/xx/y.html" }, { airport, nights: 3, travelers: 1 });
  assert.equal(missing.kind, "unavailable");
  assert.equal(missing.total, null);
  assert.equal(stayBudgetOption({ name: "x" }, missing), null, "a missing price never overrides the budget");
});

test("choosing a priced stay changes the lodging line and it reconciles", () => {
  const profile = normalizeTravelerProfile({ tripStart: "2027-02-01", tripEnd: "2027-02-04", guestCount: "3", answers: {} });
  const base = buildBudgetPlan(profile, lisbon);
  const chosen = buildBudgetPlan(profile, lisbon, { stay: { perUnit: 90, unit: "room", name: "Casa", propertyId: "cj-1", priceKind: "estimate" } });
  assert.equal(chosen.lodging.units, 2, "three travelers need two rooms");
  assert.equal(chosen.lodging.total, 90 * 2 * 3);
  assert.equal(chosen.estimates.hotel.average, chosen.lodging.total);
  assert.equal(chosen.lodging.name, "Casa");
  assert.notEqual(chosen.budgetCheckTotal, base.budgetCheckTotal);
});

// ---------- links ----------

test("Booking.com links are CJ-tracked and carry dates, travelers and rooms", () => {
  const url = bookingPropertyUrl({ bookingUrl: "https://www.booking.com/hotel/pt/casa.html", cjTrackingBaseUrl: "https://www.kqzyfj.com/click-101801755-17369488" }, { tripStart: "2027-04-12", tripEnd: "2027-04-17", guestCount: "3", roomCount: "2" });
  const outer = new URL(url);
  assert.match(outer.hostname, /kqzyfj\.com$/);
  const inner = new URL(outer.searchParams.get("url"));
  assert.equal(inner.hostname, "www.booking.com");
  assert.equal(inner.searchParams.get("checkin"), "2027-04-12");
  assert.equal(inner.searchParams.get("checkout"), "2027-04-17");
  assert.equal(inner.searchParams.get("group_adults"), "3");
  assert.equal(inner.searchParams.get("no_rooms"), "2");
  assert.equal(bookingPropertyUrl({ bookingUrl: "https://evil.example/hotel/x.html" }, {}), null);
  const forged = bookingPropertyUrl({ bookingUrl: "https://www.booking.com/hotel/pt/casa.html", cjTrackingBaseUrl: "https://evil.example/click" }, {});
  assert.doesNotMatch(new URL(forged).hostname, /evil/);
});

// ---------- CJ client and importer ----------

function response(status, body) {
  return { status, ok: status >= 200 && status < 300, text: async () => (typeof body === "string" ? body : JSON.stringify(body)) };
}

test("the CJ client retries 429/5xx/timeouts, not GraphQL errors, and never leaks the token", async () => {
  let calls = 0;
  const flaky = createCjClient({ env: ENV, wait: noWait, minIntervalMs: 0, fetchImpl: async () => (++calls < 3 ? response(calls === 1 ? 429 : 503, "busy") : response(200, { data: { ok: 1 } })) });
  assert.deepEqual(await flaky.query("{ ok }"), { ok: 1 });
  assert.equal(calls, 3);

  let graphqlCalls = 0;
  const bad = createCjClient({ env: ENV, wait: noWait, minIntervalMs: 0, fetchImpl: async () => { graphqlCalls += 1; return response(400, { errors: [{ message: `bad token ${TOKEN}` }] }); } });
  await assert.rejects(bad.query("{ x }"), (error) => !error.message.includes(TOKEN) && /redacted/.test(error.message));
  assert.equal(graphqlCalls, 1);

  let timeouts = 0;
  const slow = createCjClient({ env: ENV, wait: noWait, minIntervalMs: 0, maxAttempts: 2, fetchImpl: async () => { timeouts += 1; const error = new Error("timed out"); error.name = "TimeoutError"; throw error; } });
  await assert.rejects(slow.query("{ x }"), /cj_request_failed/);
  assert.equal(timeouts, 2);

  assert.equal(redact(`Authorization: Bearer ${TOKEN}`, TOKEN), "Authorization: Bearer [redacted]");
  assert.equal(JSON.stringify(flaky.credentials).includes(TOKEN), false);
});

const FEEDS = { productFeeds: { resultList: [{ adId: "17369488", feedName: "Feed: Western Europe", productCount: 5000, lastUpdated: "2026-11-06", sourceFeedType: "TRAVEL" }, { adId: "1", feedName: "Other", productCount: 0, sourceFeedType: "TRAVEL" }] } };
function feedRow(id, extra = {}) {
  return { id: String(id), title: `Hostel ${id}`, categoryName: "Hostel", starRating: 0, link: `https://www.booking.com/hotel/pt/h${id}.html?aid=1`, imageLink: "https://cf.bstatic.com/x.jpg", roomType: "Bed in dorm", address: { city: "Lisbon", country: "Portugal", latitude: "38.7", longitude: "-9.1" }, linkCode: { clickUrl: "https://www.kqzyfj.com/click-111-17369488?url=x" }, ...extra };
}

function fakeCj(pages) {
  const queries = [];
  const fetchImpl = async (_url, init) => {
    const { query } = JSON.parse(init.body);
    queries.push(query);
    if (query.includes("productFeeds")) return response(200, { data: FEEDS });
    if (query.includes("productIds")) {
      const ids = [...query.matchAll(/"(\d+)"/g)].map((match) => match[1]).filter((id) => id.length === 4);
      return response(200, { data: { travelExperienceProducts: { resultList: ids.map((id) => (id === "1003" ? { id, title: "", link: "nope" } : feedRow(id))) } } });
    }
    const offset = Number(/offset: (\d+)/.exec(query)[1]);
    const rows = pages[offset / 1000] || [];
    return response(200, { data: { travelExperienceProducts: { totalCount: pages.flat().length, count: rows.length, resultList: rows } } });
  };
  return { client: createCjClient({ env: ENV, wait: noWait, minIntervalMs: 0, fetchImpl }), queries };
}

test("the importer discovers feeds, paginates, drops malformed records, and dry-run writes nothing", async () => {
  const full = Array.from({ length: 1000 }, (_, index) => ({ id: String(2000 + index), categoryName: "Hotel", starRating: 5, address: { city: "Porto" } }));
  const { client, queries } = fakeCj([full, [feedRow(1001), feedRow(1002), feedRow(1003)]]);
  let stored = false;
  const store = { begin: async () => { stored = true; }, save: async () => { stored = true; return { saved: 0, deactivated: 0 }; }, finish: async () => { stored = true; } };
  const run = await runImport({ client, destinations: [{ id: "LIS", city: "Lisbon", country: "Portugal" }], store, dryRun: true });
  assert.equal(run.status, "succeeded");
  assert.equal(run.feeds.length, 1, "only real regional feeds with products are used");
  assert.ok(queries.some((query) => query.includes("offset: 1000")), "second page fetched");
  assert.equal(run.recordsSeen, 2, "the malformed record is skipped");
  assert.equal(stored, false);
  assert.ok(queries.every((query) => !query.includes(TOKEN)));
});

test("a destination failure makes the run partial, not failed", async () => {
  const { client } = fakeCj([[feedRow(1001)]]);
  const run = await runImport({ client, destinations: [{ id: "LIS", city: "Lisbon", country: "Portugal" }, { id: "NOWHERE", city: "Atlantis", country: "Atlantis" }] });
  assert.equal(run.status, "partial");
  assert.deepEqual(run.errors.map((error) => error.scope), ["NOWHERE"]);
});

test("normalizeRecord rejects deleted, untracked or non-hotel records", () => {
  const context = { destinationId: "LIS", feed: { adId: "1", name: "F", lastUpdated: null }, importedAt: "2026-11-09" };
  assert.ok(normalizeRecord(feedRow(1), context));
  assert.equal(normalizeRecord(feedRow(1, { isDeleted: true }), context), null);
  assert.equal(normalizeRecord(feedRow(1, { linkCode: { clickUrl: "https://evil.example/c" } }), context), null);
  assert.equal(normalizeRecord(feedRow(1, { link: "https://www.booking.com/attractions/x.html" }), context), null);
  const record = normalizeRecord(feedRow(1, { imageLink: "https://evil.example/x.jpg" }), context);
  assert.deepEqual(record.photos, []);
  assert.equal("price" in record, false, "the catalog carries no price");
});

// A tiny in-memory stand-in for the Supabase query builder.
function fakeSupabase() {
  const tables = { cj_catalog_properties: [], cj_catalog_import_runs: [] };
  function from(name) {
    const rows = tables[name];
    const filters = [];
    let patch = null;
    const builder = {
      insert(row) { rows.push({ id: `run-${rows.length + 1}`, ...row }); return { select: () => ({ single: async () => ({ data: rows.at(-1), error: null }) }) }; },
      upsert(items) {
        for (const item of items) {
          const index = rows.findIndex((row) => row.provider === item.provider && row.provider_property_id === item.provider_property_id && row.destination_id === item.destination_id);
          if (index >= 0) rows[index] = { ...rows[index], ...item }; else rows.push({ ...item });
        }
        return Promise.resolve({ error: null });
      },
      select() { return builder; },
      update(values) { patch = values; return builder; },
      eq(key, value) { filters.push((row) => row[key] === value); return builder; },
      in(key, values) { filters.push((row) => values.includes(row[key])); return builder; },
      then(resolve) {
        const matched = rows.filter((row) => filters.every((filter) => filter(row)));
        if (patch) matched.forEach((row) => Object.assign(row, patch));
        resolve({ data: matched, error: null });
      },
    };
    return builder;
  }
  return { from, tables };
}

function record(id) {
  return normalizeRecord(feedRow(id), { destinationId: "LIS", feed: { adId: "17369488", name: "Feed: Western Europe", lastUpdated: "2026-11-06" }, importedAt: "2026-11-09T00:00:00Z" });
}

test("Supabase upserts are idempotent and missing properties are deactivated, never deleted", async () => {
  const supabase = fakeSupabase();
  const store = new SupabaseCatalogStore(supabase);
  const run = { startedAt: "2026-11-09T00:00:00Z", trigger: "test", destinationsAttempted: 1 };
  await store.begin(run);
  const first = { destinationId: "LIS", records: [1, 2, 3, 4].map(record) };
  await store.save(first, run);
  await store.save(first, run);
  assert.equal(supabase.tables.cj_catalog_properties.length, 4, "running twice adds nothing");
  const result = await store.save({ destinationId: "LIS", records: [1, 2, 3].map(record) }, run);
  assert.equal(result.deactivated, 1);
  assert.equal(supabase.tables.cj_catalog_properties.length, 4, "the dropped property is kept");
  const dropped = supabase.tables.cj_catalog_properties.find((row) => row.provider_property_id === "4");
  assert.equal(dropped.active, false);
  assert.equal(dropped.deactivation_reason, "not_in_latest_import");
  const tiny = await store.save({ destinationId: "LIS", records: [record(1)] }, run);
  assert.equal(tiny.deactivated, 0, "a suspiciously small import deactivates nothing");
  assert.equal(tiny.skippedDeactivation, true);
});

test("the snapshot store keeps destinations that were not part of the run", async () => {
  const store = new SnapshotCatalogStore({ stays: { HAN: [{ sku: "9" }] } });
  await store.begin({ startedAt: "2026-11-09T00:00:00Z" });
  await store.save({ destinationId: "LIS", records: [record(1)] });
  assert.deepEqual(Object.keys(store.snapshot.stays).sort(), ["HAN", "LIS"]);
  assert.equal(store.snapshot.stays.LIS[0].id, "cj-1");
});

// ---------- secrets ----------

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(jsx?|mjs)$/.test(name) ? [path] : [];
  });
}

test("no client component can reach the CJ token", () => {
  const clientFiles = files("app").filter((path) => /^["']use client["']/.test(readFileSync(path, "utf8")));
  assert.ok(clientFiles.length > 5);
  for (const path of clientFiles) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /cjClient|cjBookingImporter|catalogStore|CJ_API_TOKEN|process\.env\.CJ_/, path);
  }
  for (const path of files("app")) assert.doesNotMatch(readFileSync(path, "utf8"), /NEXT_PUBLIC_CJ/, path);
  const cron = readFileSync("app/api/cron/catalog/route.js", "utf8");
  assert.match(cron, /CRON_SECRET/);
});

// ---------- booking checklist ----------

test("the booking checklist lists bookable things only and never opens tabs on its own", async () => {
  const { checklistItems } = await import("../app/lib/booking/checklist.js");
  const manifest = buildBookingManifest({
    destination: { city: "Lisbon", country: "Portugal", airport: "LIS" },
    hotels: [{ name: "Casa" }],
    hotelExactUrls: ["https://www.booking.com/hotel/pt/casa.html"],
    restaurants: [{ name: "Walk-in tasca", officialWebsiteUrl: "https://tasca.example/" }, { name: "Taberna", bookingUrl: "https://www.opentable.com/r/taberna" }],
    experiences: [{ name: "Fado night", bookingUrl: "https://tickets.example/fado" }],
    flight: { selected: true, origin: "JFK", destination: "LIS", adults: 1 },
    flightDeepLink: "https://flights.booking.com/flights/JFK.AIRPORT-LIS.AIRPORT/",
  });
  const items = checklistItems(bookingManifestEntries(manifest));
  assert.deepEqual(items.map((item) => item.type), ["hotel", "flight", "experience", "restaurant"]);
  assert.deepEqual(items.filter((item) => item.type === "restaurant").map((item) => item.name), ["Taberna"]);
  const source = readFileSync("app/components/BookingChecklist.jsx", "utf8");
  assert.doesNotMatch(source, /window\.open|\.submit\(|\.click\(\)/);
  assert.match(source, /target="_blank" rel="noopener sponsored"/);
  assert.match(source, /opens in a new tab/);
  assert.match(source, /may earn a commission/);
  const results = readFileSync("app/results/page.jsx", "utf8");
  const book = readFileSync("app/book/page.jsx", "utf8");
  for (const page of [results, book]) {
    assert.doesNotMatch(page, /OpenAllBookings|launchBookingManifest|window\.open/);
    assert.doesNotMatch(page, /fills in your saved|saved name, email, phone and card/);
  }
});

test("stays from a same-named town elsewhere are dropped", async () => {
  const { nearDestination } = await import("../app/lib/catalog/nearDestination.js");
  const vegas = { latitude: 36.1672, longitude: -115.1486 };
  const kept = nearDestination([{ name: "Strip", latitude: 36.12, longitude: -115.17 }, { name: "Las Vegas NM", latitude: 35.59, longitude: -105.22 }, { name: "No coords" }], vegas);
  assert.deepEqual(kept.map((item) => item.name), ["Strip", "No coords"]);
  const { snapshotProperties } = await import("../app/lib/inventory/CjCatalogHotelProvider.js");
  assert.ok(snapshotProperties("las-vegas-76868").every((item) => !/new mexico|\bNM\b/i.test(item.name)));
  assert.ok(snapshotProperties("las-vegas-76868").length >= 10);
});

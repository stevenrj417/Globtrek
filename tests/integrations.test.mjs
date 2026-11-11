import assert from "node:assert/strict";
import test from "node:test";
import { itineraryAirports, normalizeFare, groupedPrices } from "../app/lib/travelpayouts/client.js";
import { aviasalesSearchUrl, recentFares, selectFares } from "../app/lib/travelpayouts/fares.js";
import { createPartnerLinks, partnerBrand, safeSubId } from "../app/lib/travelpayouts/links.js";
import { normalizeProduct, rankProducts, scoreProduct } from "../app/lib/activities/wegotrip.js";
import { esimPlans } from "../app/lib/extras/esim.js";
import { intuiTransferPage } from "../app/data/intuiTransfers.js";
import { LEGACY_TRIP_LINKS_UNTIL, encodeSharedTrip, resolveResultsState } from "../app/lib/results/resolveResults.js";
import { resetRateLimits, sharedRateLimit } from "../app/lib/security/rateLimit.js";

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("cached fares stay per person and only count as round trips when they have a return", () => {
  const roundTrip = normalizeFare({ price: 412.4, departure_at: "2027-03-10T08:00:00Z", return_at: "2027-03-15T10:00:00Z", origin_airport: "LAX", destination_airport: "LIS", transfers: 1 });
  assert.equal(roundTrip.pricePerPerson, 412);
  assert.equal(roundTrip.roundTrip, true);
  assert.equal(roundTrip.source, "aviasales_cache");
  const oneWay = normalizeFare({ price: 120, departure_at: "2027-03-10T08:00:00Z" });
  assert.equal(oneWay.roundTrip, false);
  assert.equal(normalizeFare({ price: 0 }), null);
});

test("the route code in a cached fare's link shows where it really returns", () => {
  assert.deepEqual(itineraryAirports("/search/LAX0512LAS09121?t=F9179645400017964585600000076LAXLAS17968371001796841060000066LASONT_5719&x=1"), { departsFrom: "LAX", returnsTo: "ONT" });
  assert.deepEqual(itineraryAirports("/search/X?t=F9179975616017997798000003LAXPHXLAS18004413601800446100000079LASLAX_ce0e"), { departsFrom: "LAX", returnsTo: "LAX" });
  assert.deepEqual(itineraryAirports(null), {});
});

test("fare selection drops one-ways and wrong trip lengths and flags other airports", () => {
  const base = { roundTrip: true, originAirport: "LAX", pricePerPerson: 300 };
  const fares = selectFares([
    { ...base, departDate: "2027-03-10", returnDate: "2027-03-15", destinationAirport: "LIS" },
    { ...base, pricePerPerson: 200, departDate: "2027-03-10", returnDate: "2027-03-15", destinationAirport: "OPO" },
    { ...base, pricePerPerson: 100, departDate: "2027-03-10", returnDate: "2027-03-25", destinationAirport: "LIS" },
    { ...base, roundTrip: false, pricePerPerson: 50, departDate: "2027-03-10", returnDate: null, destinationAirport: "LIS" },
    { ...base, pricePerPerson: 150, departDate: "2027-03-11", returnDate: "2027-03-16", destinationAirport: "LIS", returnAirport: "ONT" },
  ], { destination: "LIS", nights: 5 });
  assert.equal(fares.length, 3, "one-way and 15-night fares are dropped");
  assert.equal(fares[0].destinationAirport, "LIS");
  assert.equal(fares[0].otherAirport, null);
  assert.ok(fares.slice(1).every((fare) => fare.otherAirport || fare.otherReturnAirport), "mismatched airports sort last");
  const exact = selectFares([{ ...base, departDate: "2027-03-10", returnDate: "2027-03-15", destinationAirport: "LIS" }, { ...base, departDate: "2027-03-11", returnDate: "2027-03-16", destinationAirport: "LIS" }], { destination: "LIS", nights: 5, depart: "2027-03-11", ret: "2027-03-16" });
  assert.deepEqual(exact.map((fare) => fare.departDate), ["2027-03-11"]);
});

test("Aviasales search links carry the route, dates and adult count", () => {
  assert.equal(aviasalesSearchUrl({ origin: "LAX", destination: "LIS", depart: "2027-03-05", ret: "2027-03-12", adults: 2 }), "https://www.aviasales.com/search/LAX0503LIS12032");
  assert.equal(aviasalesSearchUrl({ origin: "PDX", destination: "HND", depart: "2027-10-01", ret: "2027-10-09", adults: 2, children: 1 }), "https://www.aviasales.com/search/PDX0110HND091021");
});

test("recent fares use the token header, never the URL, and total by adults", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), headers: init.headers });
    return jsonResponse({ success: true, data: { "2027-03-10": { price: 250, departure_at: "2027-03-10T08:00:00Z", return_at: "2027-03-15T08:00:00Z", origin_airport: "LAX", destination_airport: "LIS", transfers: 1 } } });
  };
  const fares = await recentFares({ token: "secret-token", origin: "LAX", destination: "LIS", months: ["2027-03"], nights: 5, adults: 3, fetchImpl });
  assert.equal(fares.length, 1);
  assert.equal(fares[0].groupTotal, 750);
  assert.equal(fares[0].pricePerPerson, 250);
  assert.ok(!calls[0].url.includes("secret-token"));
  assert.equal(calls[0].headers["X-Access-Token"], "secret-token");
  await assert.rejects(groupedPrices({ token: "t", origin: "LA", destination: "LIS", fetchImpl }), /invalid_origin/);
});

test("only GlobTrek's partner brands over plain https can become partner links", () => {
  assert.equal(partnerBrand("https://wegotrip.com/barcelona-d1/x-p2/"), "wegotrip");
  assert.equal(partnerBrand("https://www.aviasales.com/search/LAX0503LIS12032"), "aviasales");
  assert.equal(partnerBrand("https://en.intui.travel/transfer/portugal/"), "intui");
  assert.equal(partnerBrand("http://wegotrip.com/x"), null);
  assert.equal(partnerBrand("https://evil.example/https://wegotrip.com"), null);
  assert.equal(partnerBrand("https://user:pass@www.airalo.com/x"), null);
  assert.equal(partnerBrand("https://www.airalo.com:8443/x"), null);
  assert.equal(partnerBrand("https://www.booking.com/x"), null, "Booking.com stays on CJ");
  assert.equal(safeSubId("trip <script>@x.com"), "tripscriptxcom");
});

test("partner link requests send numeric marker and project and skip disallowed links", async () => {
  let sent = null;
  const fetchImpl = async (url, init) => {
    sent = JSON.parse(init.body);
    return jsonResponse({ result: { links: sent.links.map((link) => ({ url: link.url, code: "success", partner_url: `https://tp.media/r?u=${encodeURIComponent(link.url)}` })) }, code: "success", status: 200 });
  };
  const env = { TRAVELPAYOUTS_API_TOKEN: "t", TRAVELPAYOUTS_MARKER: "123", TRAVELPAYOUTS_PROJECT_ID: "456" };
  const results = await createPartnerLinks(["https://wegotrip.com/a-d1/b-p2/", "https://example.com/"], { env, fetchImpl, subId: "tours" });
  assert.equal(sent.marker, 123);
  assert.equal(sent.trs, 456);
  assert.equal(sent.links.length, 1);
  assert.equal(sent.links[0].sub_id, "tours");
  assert.match(results[0].partnerUrl, /^https:\/\/tp\.media\//);
  assert.equal(results[1].error, "not_allowed");
});

test("WeGoTrip products rank by the traveler's interest and keep real provider links", () => {
  const product = (id, category, extra = {}) => normalizeProduct({ id, title: `Tour ${id}`, slug: `tour-${id}`, city: { id: 9, slug: "lisbon" }, price: 20, currencyCode: "EUR", currency: "€", category, rating: 4.5, ratingsCount: 100, durationMin: 120, tags: { available: true }, ...extra });
  const products = [product(1, "Walking Tours"), product(2, "Day trips"), product(3, "Art & Museums")];
  assert.equal(products[0].url, "https://wegotrip.com/lisbon-d9/tour-1-p1/");
  assert.equal(rankProducts(products, { interest: "Nature" })[0].category, "Day trips");
  assert.equal(rankProducts(products, { interest: "Culture" }).filter((item) => item.matchesInterest).length, 2);
  assert.equal(normalizeProduct({ id: 5, title: "x", price: 3, url: "https://phish.example/" }), null);
  assert.equal(normalizeProduct({ id: 6, title: "x", price: 3, slug: "s", city: { id: 1, slug: "c" }, tags: { available: false } }), null, "unavailable products are dropped");
  assert.equal(normalizeProduct({ id: 7, title: "Билет", price: 3, slug: "s", city: { id: 1, slug: "c" }, locale: "ru" }), null, "other-language duplicates are dropped");
  const euro = scoreProduct(products[0], { perPersonBudget: 1 });
  assert.equal(euro, scoreProduct(products[0], {}), "a USD allowance isn't compared with euro prices");
});

test("eSIM plans cover the whole trip and are never offered at home", () => {
  const plans = esimPlans("PORTUGAL", 9);
  assert.ok(plans.length >= 1 && plans.length <= 2);
  assert.ok(plans.every((plan) => plan.days >= 10 && plan.currency === "USD" && plan.url.startsWith("https://www.airalo.com/")));
  assert.deepEqual(esimPlans("PORTUGAL", 5, { homeCountry: "Portugal" }), []);
  assert.deepEqual(esimPlans("ATLANTIS", 5), []);
});

test("Intui transfer links only exist for listed countries", () => {
  assert.equal(intuiTransferPage("PORTUGAL"), "https://en.intui.travel/transfer/portugal/");
  assert.equal(intuiTransferPage("NOWHERE"), null);
});

test("readable ?trip= links stop opening on the sunset date", () => {
  const search = `?trip=${encodeSharedTrip({ quiz: { answers: {} }, destination: "LIS" })}`;
  assert.equal(resolveResultsState({ search, now: new Date("2026-12-01T00:00:00Z") }).source, "shared");
  assert.equal(resolveResultsState({ search, now: new Date(`${LEGACY_TRIP_LINKS_UNTIL}T00:00:00Z`) }).source, "legacy_expired");
});

test("the shared limiter falls back to the instance limit without a shared store", async () => {
  resetRateLimits();
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const request = new Request("https://www.glob-trek.com/api/x", { headers: { "x-forwarded-for": "203.0.113.9" } });
  for (let index = 0; index < 2; index += 1) assert.equal(await sharedRateLimit(request, { name: "s", limit: 2, now: 1000 + index }), null);
  assert.equal((await sharedRateLimit(request, { name: "s", limit: 2, now: 1003 })).status, 429);
  if (saved) process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
});

test("the activity counts the browser uses match the curated places", async () => {
  const { readFile } = await import("node:fs/promises");
  const places = JSON.parse(await readFile(new URL("../app/data/curatedPlaces.json", import.meta.url)));
  const summary = JSON.parse(await readFile(new URL("../app/data/curatedPlaceCounts.json", import.meta.url)));
  assert.equal(summary.checkedAt, places.checkedAt);
  assert.deepEqual(summary.activities, Object.fromEntries(Object.entries(places.places).map(([id, entry]) => [id, entry.activities?.length || 0])));
});

test("the stay counts the browser uses match the catalog snapshot", async () => {
  const { readFile } = await import("node:fs/promises");
  const snapshot = JSON.parse(await readFile(new URL("../app/data/feedStays.json", import.meta.url)));
  const summary = JSON.parse(await readFile(new URL("../app/data/feedStayCounts.json", import.meta.url)));
  assert.equal(summary.checkedAt, snapshot.checkedAt);
  assert.deepEqual(summary.counts, Object.fromEntries(Object.entries(snapshot.stays).map(([id, stays]) => [id, stays.length]).sort(([a], [b]) => a.localeCompare(b))));
  assert.deepEqual(summary.dorms, Object.fromEntries(Object.entries(snapshot.stays).map(([id, stays]) => [id, stays.filter((stay) => stay.dorms).length]).filter(([, count]) => count)));
});

// Collect WeGoTrip product prices (public API, no key) for every destination
// mapped in app/data/wegotripCities.json, appending observations to
// data/price-observations/activities.ndjson.gz and rebuilding the server-only
// index app/data/pricing/activityIndex.json.
//
// WeGoTrip lists one price per product, not per date, so an observation is
// "this price was listed on this day"; travel-date averages don't apply.
// Each line: [productId, destinationId, observedAt, price, currency, category, rating, ratingsCount, durationMin]
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync, gzipSync } from "node:zlib";
import wegotripCities from "../../app/data/wegotripCities.json" with { type: "json" };
import { WEGOTRIP_API, normalizeProduct } from "../../app/lib/activities/wegotrip.js";

const today = new Date().toISOString().slice(0, 10);
const file = new URL("../../data/price-observations/activities.ndjson.gz", import.meta.url);
let lines = [];
try { lines = gunzipSync(await readFile(file)).toString("utf8").split("\n").filter(Boolean); } catch {}
const seen = new Set(lines);
const index = {};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [destinationId, city] of Object.entries(wegotripCities.cities)) {
  const products = [];
  for (let page = 1; page <= 3; page += 1) {
    const reply = await fetch(`${WEGOTRIP_API}/products/popular/?city=${city.id}&per_page=60&page=${page}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) }).catch(() => null);
    const json = reply?.ok ? await reply.json() : null;
    const results = json?.data?.results || [];
    products.push(...results.map(normalizeProduct).filter(Boolean));
    if (!json?.data?.next) break;
    await pause(400);
  }
  for (const product of products) {
    const line = JSON.stringify([product.id, destinationId, today, product.price, product.currency, product.category, product.rating, product.ratingsCount, product.durationMinutes ?? null]);
    if (!seen.has(line)) { seen.add(line); lines.push(line); }
  }
  index[destinationId] = { city: city.name, checkedAt: today, products: products.length, cheapest: products.length ? Math.min(...products.map((item) => item.price)) : null, currency: products[0]?.currency || null, categories: [...new Set(products.map((item) => item.category))].slice(0, 12) };
  console.log(destinationId.padEnd(22), products.length);
  await pause(400);
}
await writeFile(file, gzipSync(`${lines.join("\n")}\n`));
await writeFile(new URL("../../app/data/pricing/activityIndex.json", import.meta.url), `${JSON.stringify({ source: "WeGoTrip public API (app.wegotrip.com/api/v2), listed prices per person", checkedAt: today, destinations: index })}\n`);
console.log(`${lines.length} activity price observations stored`);

// Meal prices per destination from Google Places price ranges (the per-person
// spend Google shows for a restaurant, e.g. "€10–15"), two searches per
// destination: budget eats and restaurants in general.
//
// Google's terms limit storing Places content, so this keeps only place IDs
// and the per-destination statistics computed from them on the run date; the
// site fetches each restaurant's own range live. Re-run monthly.
// Usage: node scripts/pricing/collect-meal-prices.mjs [--destinations id,id]
//   → app/data/pricing/mealPrices.json
import { readFile, writeFile } from "node:fs/promises";

try {
  const text = await readFile(new URL("../../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {}
const key = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!key) throw new Error("No Google Places key");

const { destinations } = await import("../../app/data/destinations.js");
const { usdRate } = await import("../../app/lib/pricing/aggregate.js");
const args = process.argv.slice(2);
const only = args.includes("--destinations") ? args[args.indexOf("--destinations") + 1].split(",") : null;
const fileUrl = new URL("../../app/data/pricing/mealPrices.json", import.meta.url);
let file = { destinations: {} };
try { file = JSON.parse(await readFile(fileUrl, "utf8")); } catch {}
const today = new Date().toISOString().slice(0, 10);
const FOOD = new Set(["restaurant", "cafe", "bakery", "meal_takeaway", "food_court", "market", "fast_food_restaurant", "bar"]);
const money = (value) => (value ? Number(value.units || 0) + Number(value.nanos || 0) / 1e9 : null);
const percentile = (values, p) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]; };

async function search(destination, textQuery) {
  const lat = Number(destination.latitude); const lng = Number(destination.longitude);
  const body = { textQuery, maxResultCount: 20, ...(Number.isFinite(lat) && Number.isFinite(lng) && destination.latitude != null ? { locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 15000 } } } : {}) };
  const reply = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.types,places.businessStatus,places.priceRange,places.userRatingCount" }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const json = await reply.json();
  if (!reply.ok) throw new Error(json?.error?.status || `http_${reply.status}`);
  return json.places || [];
}

const targets = destinations.filter((destination) => !only || only.includes(destination.id));
for (const destination of targets) {
  const place = `${destination.city}, ${destination.country}`.replace(/\b\w+/g, (word) => word[0] + word.slice(1).toLowerCase());
  try {
    const found = new Map();
    for (const query of [`cheap eats, street food and casual restaurants in ${place}`, `restaurants in ${place}`]) {
      for (const item of await search(destination, query)) if (!found.has(item.id)) found.set(item.id, item);
    }
    const ranged = [];
    for (const item of found.values()) {
      if (item.businessStatus && item.businessStatus !== "OPERATIONAL") continue;
      if (!(item.types || []).some((type) => FOOD.has(type)) || !item.priceRange?.startPrice) continue;
      const currency = item.priceRange.startPrice.currencyCode;
      const rate = usdRate(currency, today);
      const start = money(item.priceRange.startPrice);
      const end = money(item.priceRange.endPrice);
      if (!rate || !start) continue;
      // An open-ended top range ("€50+") counts at its start.
      ranged.push({ id: item.id, lowUsd: start * rate, midUsd: (end ? (start + end) / 2 : start) * rate });
    }
    if (ranged.length < 5) {
      file.destinations[destination.id] = { checkedAt: today, restaurants: ranged.length, enough: false };
      console.log(destination.id.padEnd(22), ranged.length, "too few");
      continue;
    }
    const mids = ranged.map((item) => item.midUsd);
    file.destinations[destination.id] = {
      checkedAt: today,
      restaurants: ranged.length,
      enough: true,
      // Per-person meal spend at the cheaper quarter, the middle and the upper quarter of places found.
      budgetMealUsd: Math.round(percentile(mids, 0.25) * 10) / 10,
      typicalMealUsd: Math.round(percentile(mids, 0.5) * 10) / 10,
      upperMealUsd: Math.round(percentile(mids, 0.75) * 10) / 10,
      cheapestMealUsd: Math.round(Math.min(...ranged.map((item) => item.lowUsd)) * 10) / 10,
      placeIds: ranged.sort((a, b) => a.midUsd - b.midUsd).map((item) => item.id),
    };
    console.log(destination.id.padEnd(22), ranged.length, file.destinations[destination.id].budgetMealUsd, file.destinations[destination.id].typicalMealUsd);
  } catch (error) {
    console.log(destination.id.padEnd(22), "error", error.message);
  }
}
file.source = "Google Places API (New) priceRange, per-person spend ranges shown on Google Maps";
file.checkedAt = today;
await writeFile(fileUrl, `${JSON.stringify(file)}\n`);

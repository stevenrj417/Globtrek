// Refresh two-week round-trip fare averages from Travelpayouts into app/data/flightPrices.json.
// Usage: TRAVELPAYOUTS_TOKEN=... npm run flights:refresh [-- --origin PDX --months 12]
// The token can also live in .env.local (never commit it).
import { readFile, writeFile } from "node:fs/promises";
import { biweeklyAverages, fetchGroupedPrices } from "../../app/lib/flights/travelpayouts.js";
import { destinations } from "../../app/data/destinations.js";

async function tokenFromEnvFile() {
  try {
    const text = await readFile(new URL("../../.env.local", import.meta.url), "utf8");
    return text.match(/^TRAVELPAYOUTS_TOKEN=["']?([^"'\n]+)/m)?.[1] || null;
  } catch {
    return null;
  }
}

const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(`--${name}`); return index > -1 ? args[index + 1] : fallback; };
const origins = option("origin", "PDX").split(",").map((code) => code.trim().toUpperCase());
const monthsAhead = Number(option("months", "12"));
const token = process.env.TRAVELPAYOUTS_TOKEN || await tokenFromEnvFile();
if (!token) {
  console.error("Set TRAVELPAYOUTS_TOKEN (Travelpayouts → Profile → API token) in .env.local or the environment.");
  process.exit(1);
}

const months = Array.from({ length: monthsAhead }, (_, index) => {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + index);
  return date.toISOString().slice(0, 7);
});

// Launch routes: every destination GlobTrek can recommend, deduplicated by airport.
const airports = [...new Set(destinations.filter((item) => item.recommendationReady !== false && /^[A-Z]{3}$/.test(item.airport || "")).map((item) => item.airport))];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const output = { source: "Travelpayouts Aviasales Data API (grouped_prices, market us)", currency: "USD", checkedAt: new Date().toISOString().slice(0, 10), basis: "Cheapest round trip (2–8 nights) found by Aviasales travelers per departure date, averaged per two-week window", routes: {} };

let calls = 0;
for (const origin of origins) {
  for (const destination of airports) {
    if (destination === origin) continue;
    const observations = [];
    for (const month of months) {
      try {
        observations.push(...await fetchGroupedPrices({ token, origin, destination, month }));
      } catch (error) {
        if (error.message === "travelpayouts_rate_limited") { await sleep(5000); continue; }
        console.warn(`${origin}-${destination} ${month}: ${error.message}`);
      }
      calls += 1;
      await sleep(120); // well under the documented 600 requests per minute
    }
    if (observations.length) output.routes[`${origin}:${destination}`] = { windows: biweeklyAverages(observations), samples: observations.length };
    console.log(`${origin}-${destination}: ${observations.length} departure dates`);
  }
}

await writeFile(new URL("../../app/data/flightPrices.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${Object.keys(output.routes).length} routes from ${calls} requests to app/data/flightPrices.json`);

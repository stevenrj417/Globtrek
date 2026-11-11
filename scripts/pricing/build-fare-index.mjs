// Fare index for the server: per route, per half-month and month of travel,
// averages of round-trip fares Aviasales users found (observation store:
// data/price-observations/flights.ndjson.gz). Only periods with enough fares
// are kept (see app/lib/pricing/aggregate.js); nothing is filled in.
// Usage: node scripts/pricing/build-fare-index.mjs → app/data/pricing/fareIndex.json
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { periodSummaries } from "../../app/lib/pricing/aggregate.js";
import { observation } from "../../app/lib/pricing/observations.js";

const lines = gunzipSync(await readFile(new URL("../../data/price-observations/flights.ndjson.gz", import.meta.url))).toString("utf8").split("\n").filter(Boolean);
const routes = {};
let observedFrom = "9999"; let observedTo = "0000";
for (const line of lines) {
  const [origin, destination, observedAt, travelDate, travelEnd, price, stops, minutes] = JSON.parse(line);
  const row = observation({ kind: "flight", itemId: `${origin}-${destination}`, provider: "aviasales", observedAt, travelDate, travelEnd, price, currency: "USD" });
  if (!row) continue;
  row.stops = stops; row.minutes = minutes;
  (routes[row.itemId] ||= []).push(row);
  if (observedAt < observedFrom) observedFrom = observedAt;
  if (observedAt > observedTo) observedTo = observedAt;
}
const index = {};
let periods = 0;
for (const [route, rows] of Object.entries(routes)) {
  const summaries = periodSummaries(rows);
  if (!Object.keys(summaries).length) continue;
  // [average, median, low, high, samples, observedFrom, observedTo]
  index[route] = Object.fromEntries(Object.entries(summaries).map(([period, value]) => [period, [value.averageUsd, value.medianUsd, value.lowUsd, value.highUsd, value.samples, value.observedFrom, value.observedTo]]));
  const nonstop = rows.filter((row) => row.stops === 0);
  index[route].nonstop = nonstop.length >= 1;
  periods += Object.keys(summaries).length;
}
await writeFile(new URL("../../app/data/pricing/fareIndex.json", import.meta.url), `${JSON.stringify({ source: "Aviasales Data API: round-trip economy fares travelers found, per passenger in USD, taxes included", observedFrom, observedTo, observations: lines.length, routes: index })}\n`);
console.log(`${lines.length} observations, ${Object.keys(routes).length} routes seen, ${Object.keys(index).length} routes with averages, ${periods} route-periods, observed ${observedFrom}..${observedTo}`);

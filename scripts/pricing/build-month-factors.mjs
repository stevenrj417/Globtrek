// Destination-specific month factors for nightly lodging prices.
//
// Hotel prices follow demand, and demand follows the weather a place is visited
// for plus the months people travel anyway (Northern summer and year-end
// holidays). This replaces one shared northern/southern/tropical curve with a
// curve per destination built from its own NASA POWER climate
// (scripts/destinations/climate.json): mean temperature and rainfall by month.
//
// It is still a model, not observed prices: the factors average 1.0 over the
// year, so the destination's yearly planning price stays the same and only its
// spread across months changes. Ski places score cold, snowy months as good.
//
//   node scripts/pricing/build-month-factors.mjs
// Writes app/data/pricing/monthFactors.json.
import { readFile, writeFile } from "node:fs/promises";

const { destinations } = await import("../../app/data/destinations.js");
const climate = JSON.parse(await readFile(new URL("../destinations/climate.json", import.meta.url), "utf8"));

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Months many travelers are off work or school, whatever the weather.
const HOLIDAY = [0.03, 0, 0, 0.02, 0, 0.02, 0.06, 0.06, 0, 0, 0, 0.06];
// Ski towns are busy in both the snow season and summer.
const SKI = /\bwinter\b|\bski\b/i;
const SKI_TOWNS = /^(ASPEN|ZERMATT|CHAMONIX|BANFF|SUN VALLEY|HOKKAIDO|CORTINA D'AMPEZZO|INNSBRUCK|WHISTLER|JACKSON HOLE|LAKE TAHOE|ZAKOPANE|INTERLAKEN)$/;
const BEACH = /ocean|beach|coast|island|diving/i;

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const round = (value) => Math.round(value * 100) / 100;

function comfort(temperature, rain, { ski, beach }) {
  // Monthly means include nights, so a 24 °C mean is a hot afternoon: pleasant
  // for sightseeing at 14–23 °C mean; beach places want it warmer.
  const [low, high] = beach ? [22, 29] : [14, 23];
  const warmth = temperature < low ? 1 - (low - temperature) / 14 : temperature > high ? 1 - (temperature - high) / 9 : 1;
  const dry = 1 - clamp((rain - 2) / 8, 0, 1);
  const summer = clamp(warmth, 0, 1) * 0.6 + dry * 0.4;
  if (!ski) return summer;
  // Ski towns: a snowy month is as good as a warm one.
  const snow = temperature <= -1 ? 1 : temperature <= 3 ? 0.6 : 0;
  return Math.max(summer, snow);
}

export function monthFactors(destination, record) {
  const tags = (destination.tags || []).join(" ");
  const options = { ski: SKI.test(tags) || SKI_TOWNS.test(destination.city), beach: BEACH.test(tags) && !/Mountains/.test(tags) };
  const raw = record.t2m.map((temperature, index) => 0.82 + 0.36 * comfort(temperature, record.precip[index], options) + HOLIDAY[index]);
  const mean = raw.reduce((sum, value) => sum + value, 0) / 12;
  const factors = raw.map((value) => round(clamp(value / mean, 0.78, 1.3)));
  const top = Math.max(...factors);
  const bottom = Math.min(...factors);
  // Barely any swing: no month stands out, so name none.
  if (top - bottom < 0.1) return { factors, peakMonths: [], cheapestMonths: [], profile: options.ski ? "ski" : options.beach ? "beach" : "sightseeing" };
  return {
    factors,
    peakMonths: factors.map((value, index) => (value >= top - 0.04 ? MONTH[index] : null)).filter(Boolean),
    cheapestMonths: factors.map((value, index) => (value <= bottom + 0.04 ? MONTH[index] : null)).filter(Boolean),
    profile: options.ski ? "ski" : options.beach ? "beach" : "sightseeing",
  };
}

const out = {};
let missing = 0;
for (const destination of destinations) {
  const record = climate.climate[destination.id];
  if (!record?.t2m?.length) { missing += 1; continue; }
  out[destination.id] = monthFactors(destination, record);
}
await writeFile(new URL("../../app/data/pricing/monthFactors.json", import.meta.url), `${JSON.stringify({
  source: "Modeled from NASA POWER monthly temperature and rainfall (2001–2025) plus common travel-holiday months. Not observed hotel prices.",
  builtAt: new Date().toISOString().slice(0, 10),
  destinations: out,
})}\n`);
console.log(`${Object.keys(out).length} destinations, ${missing} without climate data`);

// Metro city codes (NYC, LON, PAR, ...) to their airports, from Travelpayouts'
// public reference data, so fares quoted to a city code can be matched to the
// airport a destination uses. Only cities with more than one airport, or whose
// code differs from its airport's, are kept.
// Usage: node scripts/pricing/fetch-city-codes.mjs → app/data/pricing/cityCodes.json
import { writeFile } from "node:fs/promises";

const airports = await fetch("https://api.travelpayouts.com/data/en/airports.json").then((reply) => reply.json());
const byCity = {};
for (const airport of airports) {
  if (!airport.city_code || !airport.code || airport.iata_type !== "airport" || airport.flightable === false) continue;
  (byCity[airport.city_code] ||= []).push(airport.code);
}
const cities = Object.fromEntries(Object.entries(byCity).filter(([city, codes]) => codes.length > 1 || codes[0] !== city).sort(([a], [b]) => a.localeCompare(b)).map(([city, codes]) => [city, codes.sort()]));
await writeFile(new URL("../../app/data/pricing/cityCodes.json", import.meta.url), `${JSON.stringify({ source: "Travelpayouts public data (api.travelpayouts.com/data/en/airports.json)", checkedAt: new Date().toISOString().slice(0, 10), cities })}\n`);
console.log(Object.keys(cities).length, "city codes; NYC:", cities.NYC, "PAR:", cities.PAR);

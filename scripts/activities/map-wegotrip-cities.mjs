// Maps GlobTrek destinations to WeGoTrip cities (public API, no key) by city and
// country name, and writes app/data/wegotripCities.json.
//   node scripts/activities/map-wegotrip-cities.mjs
import { writeFile } from "node:fs/promises";

const { destinations } = await import("../../app/data/destinations.js");
const API = "https://app.wegotrip.com/api/v2";
const cities = [];
for (let page = 1; page < 60; page += 1) {
  const data = (await (await fetch(`${API}/cities/?page=${page}`)).json()).data;
  cities.push(...data.results);
  if (!data.next) break;
}
const norm = (value) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const COUNTRY = { "united states": "united states", "czech republic": "czechia", "turkey": "turkiye" };
const ALIASES = { "new york city": "new york city", "nairobi & the maasai mara": "nairobi", "amalfi coast": "amalfi", "tahiti & moorea": "papeete", "bali": "ubud" };
const map = {};
for (const destination of destinations) {
  const city = ALIASES[destination.city.toLowerCase()] || destination.city.toLowerCase();
  const country = norm(COUNTRY[destination.country.toLowerCase()] || destination.country);
  const match = cities.find((item) => norm(item.name) === norm(city) && [norm(item.country), norm(COUNTRY[String(item.country).toLowerCase()] || item.country)].includes(country));
  if (match && match.itemsCount > 0) map[destination.id] = { id: match.id, name: match.name, slug: match.slug, country: match.country, items: match.itemsCount };
}
await writeFile(new URL("../../app/data/wegotripCities.json", import.meta.url), `${JSON.stringify({ source: "WeGoTrip public API v2", checkedAt: new Date().toISOString().slice(0, 10), cities: map }, null, 1)}\n`);
console.log(`${Object.keys(map).length} of ${destinations.length} destinations have WeGoTrip products (${cities.length} WeGoTrip cities)`);

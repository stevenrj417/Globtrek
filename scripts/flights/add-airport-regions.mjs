// Fills in missing city names and adds a short state/province code to app/data/airports.json so the airport
// picker can tell same-named cities apart (Portland, OR vs Portland, ME).
// Source: OurAirports airports.csv (public domain), passed as the first argument:
//   node scripts/flights/add-airport-regions.mjs path/to/airports.csv
import { readFileSync, writeFileSync } from "node:fs";

// Countries where travelers name the region alongside the city.
const COUNTRIES = new Set(["US", "CA", "AU", "BR", "MX", "IN", "AR"]);
const csvPath = process.argv[2];
if (!csvPath) { console.error("Usage: node scripts/flights/add-airport-regions.mjs airports.csv"); process.exit(1); }

function parseRow(line) {
  const cells = []; let cell = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) { if (char === '"' && line[i + 1] === '"') { cell += '"'; i += 1; } else if (char === '"') quoted = false; else cell += char; }
    else if (char === '"') quoted = true; else if (char === ",") { cells.push(cell); cell = ""; } else cell += char;
  }
  cells.push(cell);
  return cells;
}

const [header, ...rows] = readFileSync(csvPath, "utf8").split(/\r?\n/).filter(Boolean);
const columns = parseRow(header);
const at = (name) => columns.indexOf(name);
const regionByCode = new Map();
const cityByCode = new Map();
for (const line of rows) {
  const row = parseRow(line);
  const code = row[at("iata_code")]; const country = row[at("iso_country")]; const region = row[at("iso_region")];
  if (!code) continue;
  if (row[at("municipality")]) cityByCode.set(`${code}:${country}`, row[at("municipality")]);
  if (COUNTRIES.has(country) && region?.startsWith(`${country}-`)) regionByCode.set(`${code}:${country}`, region.slice(country.length + 1));
}

const file = new URL("../../app/data/airports.json", import.meta.url);
const airports = JSON.parse(readFileSync(file, "utf8"));
let added = 0;
let named = 0;
const next = airports.map(({ region: _old, ...original }) => {
  const city = original.city || cityByCode.get(`${original.code}:${original.country}`) || "";
  if (city !== original.city) named += 1;
  const airport = { ...original, city };
  const region = airport.scheduled ? regionByCode.get(`${airport.code}:${airport.country}`) : null;
  if (!region || !/^[A-Z0-9]{1,3}$/.test(region)) return airport;
  added += 1;
  return { ...airport, region };
});
writeFileSync(file, `${JSON.stringify(next)}\n`);
console.log(`Added a region to ${added} and a city to ${named} of ${airports.length} airports.`);

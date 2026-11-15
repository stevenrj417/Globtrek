// Writes app/data/airportCoords.json: { IATA: [latitude, longitude] } for airports with airline
// service. The location search uses it when Google Places is unavailable, so starting points
// still carry coordinates. Server-only data; the client airport picker doesn't load it.
// Source: OurAirports airports.csv (public domain), passed as the first argument:
//   node scripts/flights/build-airport-coords.mjs path/to/airports.csv
import { readFileSync, writeFileSync } from "node:fs";

const csvPath = process.argv[2];
if (!csvPath) { console.error("Usage: node scripts/flights/build-airport-coords.mjs airports.csv"); process.exit(1); }

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
const coords = new Map();
for (const line of rows) {
  const row = parseRow(line);
  const code = row[at("iata_code")]; const country = row[at("iso_country")];
  const lat = Number(row[at("latitude_deg")]); const lng = Number(row[at("longitude_deg")]);
  if (code && Number.isFinite(lat) && Number.isFinite(lng)) coords.set(`${code}:${country}`, [Math.round(lat * 1e4) / 1e4, Math.round(lng * 1e4) / 1e4]);
}

const airports = JSON.parse(readFileSync(new URL("../../app/data/airports.json", import.meta.url), "utf8"));
const out = {};
for (const airport of airports) {
  const point = airport.scheduled && coords.get(`${airport.code}:${airport.country}`);
  if (point) out[airport.code] = point;
}
writeFileSync(new URL("../../app/data/airportCoords.json", import.meta.url), `${JSON.stringify(out)}\n`);
console.log(`${Object.keys(out).length} airports with coordinates`);

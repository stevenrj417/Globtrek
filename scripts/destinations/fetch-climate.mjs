// Monthly climate averages for every destination with coordinates, from NASA
// POWER (public domain, no key): mean air temperature (T2M, °C) and corrected
// precipitation (PRECTOTCORR, mm/day), 2001–2025 climatology. Writes
// scripts/destinations/climate.json. Resumes: destinations already fetched are kept.
//   node scripts/destinations/fetch-climate.mjs
import { readFile, writeFile } from "node:fs/promises";

const { destinations } = await import("../../app/data/destinations.js");
const flagships = JSON.parse(await readFile(new URL("./flagship-locations.json", import.meta.url), "utf8")).locations;
const fileUrl = new URL("./climate.json", import.meta.url);
let file = { source: "NASA POWER climatology API v2 (T2M, PRECTOTCORR; 2001–2025)", checkedAt: null, climate: {} };
try { file = JSON.parse(await readFile(fileUrl, "utf8")); } catch {}
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let fetched = 0;
for (const destination of destinations) {
  const location = Number.isFinite(Number(destination.latitude)) ? { latitude: Number(destination.latitude), longitude: Number(destination.longitude) } : flagships[destination.id];
  if (!location || file.climate[destination.id]) continue;
  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR&community=RE&longitude=${location.longitude}&latitude=${location.latitude}&format=JSON`;
  try {
    const json = await (await fetch(url, { signal: AbortSignal.timeout(60000) })).json();
    const parameter = json?.properties?.parameter;
    if (!parameter?.T2M) throw new Error("no data");
    file.climate[destination.id] = { latitude: location.latitude, longitude: location.longitude, t2m: MONTHS.map((month) => parameter.T2M[month]), precip: MONTHS.map((month) => parameter.PRECTOTCORR[month]) };
    fetched += 1;
  } catch (error) {
    console.error(`${destination.id}: ${error.message}`);
  }
  await sleep(400);
}
file.checkedAt = new Date().toISOString().slice(0, 10);
await writeFile(fileUrl, `${JSON.stringify(file)}\n`);
console.log(`fetched ${fetched}; ${Object.keys(file.climate).length} destinations have climate data`);

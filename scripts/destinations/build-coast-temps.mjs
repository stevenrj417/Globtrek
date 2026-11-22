// Monthly mean air temperature (°C, rounded) for every coastal destination,
// taken from scripts/destinations/climate.json (NASA POWER, 2001–2025). Small
// enough to ship to the browser, so the quiz can skip coasts that are cold in
// the traveler's month. Writes app/data/coastTemps.json.
//   node scripts/destinations/build-coast-temps.mjs
import { readFile, writeFile } from "node:fs/promises";

const { destinations } = await import("../../app/data/destinations.js");
const climate = JSON.parse(await readFile(new URL("./climate.json", import.meta.url), "utf8"));
const temps = {};
for (const destination of destinations) {
  if (!destination.tags?.includes("Ocean")) continue;
  const t2m = climate.climate[destination.id]?.t2m;
  if (t2m?.length === 12 && t2m.every(Number.isFinite)) temps[destination.id] = t2m.map((value) => Math.round(value));
}
const out = { source: climate.source, checkedAt: climate.checkedAt, temps };
await writeFile(new URL("../../app/data/coastTemps.json", import.meta.url), `${JSON.stringify(out)}\n`);
console.log(`${Object.keys(temps).length} coastal destinations`);

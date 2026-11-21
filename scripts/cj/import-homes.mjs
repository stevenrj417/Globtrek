// Add whole places (houses, apartments, chalets) and luxury stays (5-star,
// resorts, villas) to the bundled catalog snapshot
// (app/data/feedStays.json) without re-importing every hotel. Existing non-home
// records are kept; each destination's homes and luxury stays are replaced.
//
// Usage: node scripts/cj/import-homes.mjs [--destinations HAN,LIS] [--dry-run]
import { readFile, writeFile } from "node:fs/promises";

for (const line of (await readFile(new URL("../../.env.local", import.meta.url), "utf8").catch(() => "")).split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?\s*$/);
  if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
}

const { createCjClient } = await import("../../app/lib/catalog/cjClient.js");
const { discoverFeeds, importDestinationHomes, isHomeCategory, isLuxuryStay } = await import("../../app/lib/catalog/cjBookingImporter.js");
const { catalogDestinations } = await import("../../app/lib/catalog/catalogDestinations.js");
const { stayCounts } = await import("../../app/lib/catalog/stayCounts.js");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.includes("--destinations") ? args[args.indexOf("--destinations") + 1].split(",") : null;
const snapshotUrl = new URL("../../app/data/feedStays.json", import.meta.url);
const snapshot = JSON.parse(await readFile(snapshotUrl, "utf8"));
const destinations = catalogDestinations().filter((destination) => !only || only.includes(destination.id));
const client = createCjClient();
const feeds = await discoverFeeds(client);
const importedAt = new Date().toISOString();
let total = 0;
for (const [index, destination] of destinations.entries()) {
  try {
    const result = await importDestinationHomes(client, destination, feeds, { importedAt });
    const homes = result.records.map(({ importedAt: at, ...record }) => ({ ...record, id: `cj-${record.providerPropertyId}`, sku: record.providerPropertyId, address: [record.streetAddress, record.city, record.provinceState, record.postalCode].filter(Boolean).join(", ") || null, importedAt: at, photos: (record.photos || []).slice(0, 5), description: record.description ? record.description.slice(0, 280) : null, addedBy: "homes" }));
    // Replace only what an earlier run of this script added (tagged addedBy "homes");
    // every stay the main import put in stays, whatever its category.
    const kept = (snapshot.stays[destination.id] || []).filter((record) => record.addedBy !== "homes" && !homes.some((home) => home.sku === record.sku));
    if (homes.length || kept.length) snapshot.stays[destination.id] = [...kept, ...homes];
    total += homes.length;
    console.log(`${String(index + 1).padStart(3)}/${destinations.length} ${destination.id.padEnd(28)} ${homes.filter((home) => isHomeCategory(home.category)).length} homes, ${homes.filter((home) => isLuxuryStay(home.category, home.starRating)).length} luxury`);
  } catch (error) {
    console.log(`${String(index + 1).padStart(3)}/${destinations.length} ${destination.id.padEnd(28)} failed ${error.message}`);
  }
  if (!dryRun && (index + 1) % 25 === 0) await writeFile(snapshotUrl, `${JSON.stringify(snapshot)}\n`);
}
if (!dryRun) {
  await writeFile(snapshotUrl, `${JSON.stringify(snapshot)}\n`);
  await writeFile(new URL("../../app/data/feedStayCounts.json", import.meta.url), `${JSON.stringify(stayCounts(snapshot))}\n`);
}
console.log(`done: ${total} homes across ${destinations.length} destinations${dryRun ? " (dry run)" : ""}`);

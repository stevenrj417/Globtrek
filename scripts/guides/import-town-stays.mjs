// Booking.com stays for the guide towns in app/data/guideTowns.js, from GlobTrek's
// CJ product feed, through the same search, checks and shortlist as the catalog
// import. Writes app/data/guideStays.json.
//   node scripts/guides/import-town-stays.mjs [--only bend-or,boise-id]
// Needs CJ_API_TOKEN, CJ_COMPANY_ID and CJ_PID in the environment or .env.local.
import { readFile, writeFile } from "node:fs/promises";

for (const line of (await readFile(new URL("../../.env.local", import.meta.url), "utf8").catch(() => "")).split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?\s*$/);
  if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
}

const { GUIDE_TOWNS, townId } = await import("../../app/data/guideTowns.js");
const { createCjClient } = await import("../../app/lib/catalog/cjClient.js");
const { discoverFeeds, importDestination } = await import("../../app/lib/catalog/cjBookingImporter.js");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const fileUrl = new URL("../../app/data/guideStays.json", import.meta.url);
const file = JSON.parse(await readFile(fileUrl, "utf8").catch(() => '{"towns":{}}'));
const client = createCjClient();
if (!client.credentials.configured) { console.error("CJ credentials are not set."); process.exit(1); }
const feeds = await discoverFeeds(client);

for (const [key, town] of Object.entries(GUIDE_TOWNS)) {
  if (only && !only.includes(key)) continue;
  const [city, ...aliases] = town.feedCities;
  const result = await importDestination(client, { id: townId(key), city, country: "UNITED STATES", latitude: town.latitude, longitude: town.longitude, feedCityAliases: aliases }, feeds, { size: 40 });
  if (result.status === "ok" || result.status === "empty") {
    // Same record shape as the catalog snapshot (app/lib/catalog/catalogStore.js).
    const stays = result.records.map(({ importedAt, ...record }) => ({ ...record, id: `cj-${record.providerPropertyId}`, sku: record.providerPropertyId, address: [record.streetAddress, record.city, record.provinceState, record.postalCode].filter(Boolean).join(", ") || null, photos: (record.photos || []).slice(0, 5), description: record.description ? record.description.slice(0, 280) : null, importedAt }));
    file.towns[key] = { feed: result.feed || null, importedAt: new Date().toISOString(), stays };
  }
  console.log(`${key.padEnd(18)} ${result.status}  ${result.records.length} stays${result.reason ? `  ${result.reason}` : ""}`);
}

file.source = "Booking.com listings from GlobTrek's CJ Affiliate product feed";
file.checkedAt = new Date().toISOString().slice(0, 10);
await writeFile(fileUrl, `${JSON.stringify(file)}\n`);

import { readFile, writeFile } from "node:fs/promises";
import { destinations } from "../../app/data/destinations.js";
import { GooglePlacesDiscoveryProvider } from "../../app/lib/google-places/GooglePlacesDiscoveryProvider.js";

function option(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; }
async function loadEnvironment(path) { try { for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); } } catch {} }
function durableRecord(record) {
  const { photoResources = [], ...durable } = record;
  return { ...durable, photoCount: Math.min(5, photoResources.length) };
}

await loadEnvironment(option("--env", ".env.production.local"));
const output = option("--output", "scripts/hotels/google-discovered-candidates.json");
const limit = Math.max(1, Number(option("--destinations", destinations.length)));
const resume = process.argv.includes("--resume");
const only = option("--only");
let report = { generatedAt: new Date().toISOString(), destinationsProcessed: 0, hotelsDiscovered: 0, records: [], failures: [] };
if (resume) { try { report = JSON.parse(await readFile(output, "utf8")); } catch {} }
const completed = new Set([...report.records.map((item) => item.destinationId), ...report.failures.map((item) => item.destinationId)]);
const queue = destinations.filter((item) => !completed.has(item.id || item.airport) && (!only || `${item.city} ${item.country}`.toLowerCase().includes(only.toLowerCase()))).slice(0, limit);
const provider = new GooglePlacesDiscoveryProvider();
for (const destination of queue) {
  const destinationId = destination.id || destination.airport;
  try { const records = await provider.discoverHotelCandidates(destination, { limit: 9 }); report.records.push(...records.map(durableRecord)); report.hotelsDiscovered += records.length; }
  catch (error) { report.failures.push({ destinationId, city: destination.city, error: error.code || error.message }); }
  report.destinationsProcessed += 1;
  report.generatedAt = new Date().toISOString();
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${report.destinationsProcessed}/${queue.length} ${destination.city}`);
}
console.log(JSON.stringify({ destinationsProcessed: report.destinationsProcessed, hotelsDiscovered: report.hotelsDiscovered, failures: report.failures.length, output }, null, 2));

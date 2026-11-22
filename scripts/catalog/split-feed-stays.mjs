// Splits app/data/feedStays.json (about 100 MB) into one small file per
// destination in app/data/feedStays/, plus _meta.json and _ids.json, so a server
// reads only the destination it needs instead of loading the whole catalog on
// every cold start. Runs before every build (npm "prebuild"); the folder is not committed.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const source = new URL("../../app/data/feedStays.json", import.meta.url);
const out = new URL("../../app/data/feedStays/", import.meta.url);
const feed = JSON.parse(await readFile(source, "utf8"));
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const ids = {};
let files = 0;
for (const [destinationId, stays] of Object.entries(feed.stays || {})) {
  if (!/^[A-Za-z0-9_-]+$/.test(destinationId)) continue;
  await writeFile(new URL(`${destinationId}.json`, out), JSON.stringify(stays));
  for (const stay of stays) { const id = String(stay.providerPropertyId || ""); if (id && !(id in ids)) ids[id] = destinationId; }
  files += 1;
}
await writeFile(new URL("_meta.json", out), JSON.stringify({ checkedAt: feed.checkedAt || null, destinations: Object.keys(feed.stays || {}).length }));
await writeFile(new URL("_ids.json", out), JSON.stringify(ids));
console.log(`feedStays split: ${files} destinations, ${Object.keys(ids).length} hotels`);

// Builds app/data/stayIndex.json: a small name index of every Booking.com stay in
// app/data/feedStays.json, so the site search can find a hotel by name without
// loading the 95 MB feed. Run after any feed import:
//   node scripts/search/build-stay-index.mjs
import { readFile, writeFile } from "node:fs/promises";

const feed = JSON.parse(await readFile(new URL("../../app/data/feedStays.json", import.meta.url), "utf8"));
const seen = new Set();
const rows = [];
for (const list of Object.values(feed.stays)) {
  for (const stay of list) {
    const id = String(stay.providerPropertyId || "");
    if (!/^\d{1,12}$/.test(id) || seen.has(id) || !stay.name) continue;
    seen.add(id);
    // [id, name, city, country code, stars, category]
    rows.push([id, stay.name, stay.city || "", stay.country || "", stay.starRating ? Math.round(stay.starRating) : 0, stay.category || ""]);
  }
}
rows.sort((a, b) => a[1].localeCompare(b[1]));
await writeFile(new URL("../../app/data/stayIndex.json", import.meta.url), JSON.stringify({ builtFrom: "feedStays.json", checkedAt: feed.checkedAt || null, stays: rows }));
console.log(`stayIndex.json: ${rows.length} stays`);

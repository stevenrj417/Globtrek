// The reviewed food photos for restaurants without their own photo. Reads
// scripts/places/cuisine-candidates.json (fetch-cuisine-candidates.mjs) and
// leaves out the photos that looked wrong or unappetizing on review.
// Writes app/data/cuisinePhotos.json.
//   node scripts/places/build-cuisine-photos.mjs
import { readFile, writeFile } from "node:fs/promises";

// Dishes dropped on review (cuisine -> dish titles).
const DROP = {
  italian: ["Spaghetti"],
  seafood: ["Oyster", "Seafood boil"],
  american: ["Hot dog", "Fried chicken"],
  steak: ["Churrasco"],
  japanese: ["Jiaozi"],
  moroccan: ["Méchoui"],
  bakery: ["Pastry"],
  southeastasian: ["Adobo"],
};

const candidates = JSON.parse(await readFile(new URL("./cuisine-candidates.json", import.meta.url), "utf8"));
const pools = {};
for (const [cuisine, items] of Object.entries(candidates)) {
  const seen = new Set();
  pools[cuisine] = items.filter((item) => !(DROP[cuisine] || []).includes(item.dish) && !seen.has(item.url) && seen.add(item.url))
    .map(({ dish, url, page, author, license }) => ({ dish, url, page, author, license }));
}
await writeFile(new URL("../../app/data/cuisinePhotos.json", import.meta.url), `${JSON.stringify({ source: "Lead photos of dish articles on English Wikipedia, from Wikimedia Commons (free licenses)", pools }, null, 1)}\n`);
console.log(Object.entries(pools).map(([key, list]) => `${key} ${list.length}`).join(", "));

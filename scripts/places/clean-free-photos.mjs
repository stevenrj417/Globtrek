// Tidies app/data/placePhotos.json after a matcher run (also run by it):
// - links use upload.wikimedia.org without tracking parameters, the host the
//   site's image loader expects;
// - a title that merely contains the place's name (a mural "in Alameda
//   Central", a station "at" a park) no longer counts as a match;
// - GFDL-only files are dropped (they need the full license text shown).
//   node scripts/places/clean-free-photos.mjs
import { readFile, writeFile } from "node:fs/promises";
import { nameMatch, strictNameMatch } from "./photoNames.mjs";

const curated = JSON.parse(await readFile(new URL("../../app/data/curatedPlaces.json", import.meta.url), "utf8"));
const url = new URL("../../app/data/placePhotos.json", import.meta.url);
const file = JSON.parse(await readFile(url, "utf8"));
const names = {};
for (const group of Object.values(curated.places || {})) for (const kind of ["activities", "restaurants"]) for (const place of group[kind] || []) names[place.googlePlaceId] = place.name;

let loose = 0;
let gfdl = 0;
for (const [placeId, photo] of Object.entries(file.photos)) {
  const name = names[placeId];
  // Matched on the English title (not a Wikidata name) but only loosely.
  if (name && nameMatch(name, photo.article) && !strictNameMatch(name, photo.article)) { delete file.photos[placeId]; loose += 1; continue; }
  if (/GFDL/i.test(photo.license || "") && !/CC|public domain/i.test(photo.license || "")) { delete file.photos[placeId]; gfdl += 1; continue; }
  if (photo.url) photo.url = photo.url.replace(/^https:\/\/thumb\.wikimedia\.org\//, "https://upload.wikimedia.org/").replace(/\?.*$/, "");
}
await writeFile(url, `${JSON.stringify(file)}\n`);
console.log(`removed ${loose} loose matches and ${gfdl} GFDL-only files; ${Object.keys(file.photos).length} places keep a photo`);

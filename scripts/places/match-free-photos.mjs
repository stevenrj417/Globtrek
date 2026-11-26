// Free photos for curated restaurants and sights, from Wikipedia and Wikimedia
// Commons (no key, no cost). A place gets a photo only when a Wikipedia article
// sits within RADIUS_M of it AND the article's title or Wikidata name matches
// the place's name, so a card never shows some other building. Only freely
// licensed Commons files are used, with the author and license kept for credit.
//
// Polite by design: one request at a time, Retry-After honored, and about one
// nearby-articles request per 10 km area rather than one per place. A failed
// request is never recorded as "no photo"; rerun to fill gaps.
// Writes app/data/placePhotos.json.
//   node scripts/places/match-free-photos.mjs
import { readFile, writeFile } from "node:fs/promises";
import { strictNameMatch } from "./photoNames.mjs";

const RADIUS_M = 400;
const AREA_RADIUS_M = 3000;
const CELL = 0.03; // degrees, about 3.3 km
const UA = "GlobTrekPhotoMatcher/1.1 (https://www.glob-trek.com)";
const curated = JSON.parse(await readFile(new URL("../../app/data/curatedPlaces.json", import.meta.url), "utf8"));
const outUrl = new URL("../../app/data/placePhotos.json", import.meta.url);
let out = { source: "Wikipedia page images on Wikimedia Commons, matched by location and name", checkedAt: null, areas: {}, photos: {} };
try { const saved = JSON.parse(await readFile(outUrl, "utf8")); if (saved.areas) out = saved; } catch {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let requests = 0;
async function getJson(url) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    requests += 1;
    try {
      const response = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      if (response.status === 429 || response.status >= 500) {
        const wait = Math.max(Number(response.headers.get("retry-after")) || 0, 2 ** attempt) * 1000;
        await sleep(Math.min(wait, 60000));
        continue;
      }
      if (!response.ok) return null;
      return await response.json();
    } catch { await sleep(2000 * (attempt + 1)); }
  }
  throw new Error(`gave up on ${url.slice(0, 120)}`);
}

// Strict: the longer name may add at most one word (see photoNames.mjs).
const nameMatch = strictNameMatch;
function metres(a, b) {
  const rad = Math.PI / 180;
  const x = (b.longitude - a.longitude) * rad * Math.cos(((a.latitude + b.latitude) / 2) * rad);
  const y = (b.latitude - a.latitude) * rad;
  return Math.sqrt(x * x + y * y) * 6371000;
}

// Places grouped into ~3 km cells; each cell is one nearby-articles request.
const cells = new Map();
for (const [destinationId, group] of Object.entries(curated.places || {})) {
  for (const kind of ["activities", "restaurants"]) {
    for (const place of group[kind] || []) {
      if (!place.googlePlaceId || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) continue;
      const key = `${(Math.round(place.latitude / CELL) * CELL).toFixed(3)},${(Math.round(place.longitude / CELL) * CELL).toFixed(3)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push({ ...place, destinationId, kind });
    }
  }
}
const pending = [...cells.entries()].filter(([key]) => !out.areas[key]);
console.log(`${[...cells.values()].flat().length} places in ${cells.size} areas; ${pending.length} areas to check`);

let done = 0;
async function checkArea([key, places]) {
  const [lat, lon] = key.split(",").map(Number);
  // Articles near the area's centre (up to 500, nearest first).
  const geo = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=geosearch&gscoord=${lat}|${lon}&gsradius=${AREA_RADIUS_M}&gslimit=500`);
  const articles = (geo?.query?.geosearch || []).map((item) => ({ title: item.title, latitude: item.lat, longitude: item.lon }));
  // Only articles within RADIUS_M of some place in this area are candidates.
  const near = new Map();
  for (const place of places) {
    for (const article of articles) if (metres(place, article) <= RADIUS_M) near.set(article.title, article);
  }
  const info = {};
  const titles = [...near.keys()];
  for (let index = 0; index < titles.length; index += 50) {
    const batch = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|pageprops&piprop=name&pilicense=free&pilimit=50&ppprop=wikibase_item&titles=${encodeURIComponent(titles.slice(index, index + 50).join("|"))}`);
    for (const page of Object.values(batch?.query?.pages || {})) if (page.pageimage) info[page.title] = { file: page.pageimage, wikidata: page.pageprops?.wikibase_item || null };
  }
  const withImage = titles.filter((title) => info[title]);
  // Wikidata names (all main languages) for candidates whose English title differs.
  const names = {};
  const ids = withImage.map((title) => info[title].wikidata).filter(Boolean);
  for (let index = 0; index < ids.length; index += 50) {
    const wd = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels|aliases&languages=en|es|fr|it|de|pt|nl|ja|zh|ko|tr|el|cs|pl|th|vi|id&ids=${ids.slice(index, index + 50).join("|")}`);
    for (const [id, entity] of Object.entries(wd?.entities || {})) names[id] = [...Object.values(entity.labels || {}).map((item) => item.value), ...Object.values(entity.aliases || {}).flat().map((item) => item.value)];
  }
  for (const place of places) {
    const candidates = withImage.filter((title) => metres(place, near.get(title)) <= RADIUS_M).sort((a, b) => metres(place, near.get(a)) - metres(place, near.get(b)));
    const best = candidates.find((title) => nameMatch(place.name, title)) || candidates.find((title) => (names[info[title].wikidata] || []).some((name) => nameMatch(place.name, name)));
    if (best) out.photos[place.googlePlaceId] = { file: info[best].file, article: best };
  }
  out.areas[key] = 1;
  done += 1;
}

// Three areas at a time; Retry-After still slows everything when asked.
for (let index = 0; index < pending.length; index += 3) {
  await Promise.all(pending.slice(index, index + 3).map(checkArea));
  if (Math.floor(index / 3) % 20 === 19) {
    console.log(`${done}/${pending.length} areas, ${Object.keys(out.photos).length} places matched, ${requests} requests`);
    await writeFile(outUrl, `${JSON.stringify(out)}\n`);
  }
}
await writeFile(outUrl, `${JSON.stringify(out)}\n`);

// Credit and a sized thumbnail for every matched file, 50 files per request.
const files = [...new Set(Object.values(out.photos).filter((photo) => !photo.url).map((photo) => photo.file))];
const credit = {};
const plain = (value) => String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
for (let index = 0; index < files.length; index += 50) {
  const titles = files.slice(index, index + 50).map((file) => `File:${file}`).join("|");
  const data = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=960&iiextmetadatafilter=Artist|LicenseShortName&titles=${encodeURIComponent(titles)}`);
  for (const page of Object.values(data?.query?.pages || {})) {
    const image = page.imageinfo?.[0];
    if (!image) continue;
    const license = plain(image.extmetadata?.LicenseShortName?.value);
    if (!license || /fair use|non-free/i.test(license) || (/GFDL/i.test(license) && !/CC|public domain/i.test(license))) continue;
    credit[page.title.replace(/^File:/, "").replace(/ /g, "_")] = { url: String(image.thumburl || image.url).replace(/^https:\/\/thumb\.wikimedia\.org\//, "https://upload.wikimedia.org/").replace(/\?.*$/, ""), page: image.descriptionurl, author: plain(image.extmetadata?.Artist?.value).slice(0, 80) || "Wikimedia Commons", license, width: image.width };
  }
}
for (const [placeId, photo] of Object.entries(out.photos)) {
  if (photo.url) continue;
  const found = credit[photo.file.replace(/ /g, "_")];
  if (found && found.width >= 400) out.photos[placeId] = { ...photo, ...found };
  else delete out.photos[placeId];
}
out.checkedAt = new Date().toISOString().slice(0, 10);
await writeFile(outUrl, `${JSON.stringify(out)}\n`);
console.log(`done: ${Object.keys(out.photos).length} places have a free photo (${requests} requests)`);

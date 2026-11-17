// Photos for guide activities (app/data/guidePlaces.json): the lead image of the
// Wikipedia article about the place, found by location and name, kept only with
// a Creative Commons or public-domain license from Wikimedia Commons (credited on
// the page). Places without a matching article get no photo.
// Writes app/data/guidePlacePhotos.json keyed by Google place id. Resumes.
//   node scripts/guides/fetch-place-photos.mjs [--force]
import { readFile, writeFile } from "node:fs/promises";

const places = JSON.parse(await readFile(new URL("../../app/data/guidePlaces.json", import.meta.url), "utf8")).areas;
const fileUrl = new URL("../../app/data/guidePlacePhotos.json", import.meta.url);
const force = process.argv.includes("--force");
const file = JSON.parse(await readFile(fileUrl, "utf8").catch(() => '{"photos":{},"none":[]}'));
const none = new Set(force ? [] : file.none || []);
if (force) file.photos = {};
const HEADERS = { "User-Agent": "GlobTrekGuides/1.0 (travel guide images)" };
const strip = (html) => String(html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const NOT_A_VIEW = /\b(map|locator|location|seal|flag|logo|coat[_ ]of[_ ]arms|montage|collage|diagram|plan)\b|\.svg$/i;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function json(url, tries = 4) {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(60000) });
  if (response.status === 429 && tries > 1) { await sleep(15000 * (5 - tries)); return json(url, tries - 1); }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
const FILLER = new Set(["the", "a", "of", "and", "at", "in", "on", "de", "la", "el", "le", "del", "di", "public", "access", "beach", "park", "state", "national", "museum", "garden", "gardens", "trail", "trailhead", "viewpoint", "center", "centre", "market", "church", "temple", "square", "plaza", "historic", "site", "area"]);
const norm = (value) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const words = (value) => norm(value).split(" ").filter((word) => word && !FILLER.has(word));
// The article is about this place when every telling word of one name is in the other.
function sameName(a, b) {
  const x = words(a);
  const y = words(b);
  if (!x.length || !y.length) return norm(a) === norm(b);
  const ys = new Set(y);
  const xs = new Set(x);
  return x.every((word) => ys.has(word)) || y.every((word) => xs.has(word));
}

async function commons(fileName) {
  const info = Object.values((await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=960&titles=${encodeURIComponent(`File:${fileName}`)}`)).query.pages)[0]?.imageinfo?.[0];
  const meta = info?.extmetadata || {};
  const license = meta.LicenseShortName?.value;
  if (!info?.url || !/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(info.url) || !license || !/^(CC|Public domain|PD)/i.test(license)) return null;
  if (info.width < 600) return null;
  return {
    url: info.url,
    width: info.width,
    height: info.height,
    source: info.descriptionurl,
    artist: strip(meta.Artist?.value).split(/;|Camera location/)[0].trim().slice(0, 80) || "Unknown",
    license,
    licenseUrl: meta.LicenseUrl?.value || null,
  };
}

const activities = new Map();
for (const area of Object.values(places)) for (const place of area.activities || []) if (place.googlePlaceId && Number.isFinite(place.latitude)) activities.set(place.googlePlaceId, place);
let found = 0;
let index = 0;
for (const [id, place] of activities) {
  index += 1;
  if (file.photos[id] || none.has(id)) continue;
  try {
    const data = await json(`https://en.wikipedia.org/w/api.php?action=query&format=json&generator=geosearch&ggscoord=${place.latitude}|${place.longitude}&ggsradius=3000&ggslimit=20&prop=pageimages&piprop=name`);
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    const page = pages.find((item) => item.pageimage && !NOT_A_VIEW.test(item.pageimage) && sameName(place.name, item.title));
    const photo = page ? await commons(page.pageimage) : null;
    if (photo) { file.photos[id] = { ...photo, article: page.title }; found += 1; } else none.add(id);
    if (index % 25 === 0) console.log(`${index}/${activities.size}  ${found} new photos`);
  } catch (error) {
    console.log(`${place.name}: ${error.message}`);
  }
  file.none = [...none];
  file.source = "Wikipedia article lead images, Wikimedia Commons licenses";
  file.checkedAt = new Date().toISOString().slice(0, 10);
  await writeFile(fileUrl, `${JSON.stringify(file)}\n`);
  await sleep(2500);
}
console.log(`done: ${Object.keys(file.photos).length} photos for ${activities.size} activities`);

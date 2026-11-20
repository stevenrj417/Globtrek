// Photos for guide activities (app/data/guidePlaces.json): the lead image of the
// Wikipedia article about the place, found by location and name, kept only with
// a Creative Commons or public-domain license from Wikimedia Commons (credited on
// the page). Places without a matching article get no photo.
// Writes app/data/guidePlacePhotos.json keyed by Google place id. Resumes.
//   node scripts/guides/fetch-place-photos.mjs [--force]
// One Wikipedia lookup per place; licenses are checked 40 photos per Commons
// request. When Wikimedia rate-limits (HTTP 429) the script waits and retries.
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
async function json(url) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(60000) });
    if (response.ok) return response.json();
    if (response.status !== 429 || attempt >= 8) throw new Error(`HTTP ${response.status}`);
    const wait = Number(response.headers.get("retry-after")) * 1000 || 20000 * attempt;
    console.log(`  rate-limited, waiting ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  }
}
const FILLER = new Set(["the", "a", "of", "and", "at", "in", "on", "de", "la", "el", "le", "del", "di", "public", "access", "beach", "park", "state", "national", "museum", "garden", "gardens", "trail", "trailhead", "viewpoint", "center", "centre", "market", "church", "temple", "square", "plaza", "historic", "site", "area"]);
const norm = (value) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const words = (value) => norm(value).split(" ").filter((word) => word && !FILLER.has(word));
// The article is about this place when every telling word of one name is in
// the other, and the article isn't just the city, a station or a stadium named
// after it. A shorter article name may drop at most one telling word.
const OTHER_THING = /\b(station|stadium|airport|line|district|neighbourhood|neighborhood|county)\b/i;
export function sameName(place, article) {
  if (OTHER_THING.test(article) && !OTHER_THING.test(place)) return false;
  const x = words(place);
  const y = words(article);
  if (!x.length || !y.length) return norm(place) === norm(article);
  const ys = new Set(y);
  const xs = new Set(x);
  if (x.every((word) => ys.has(word))) return true;
  return y.every((word) => xs.has(word)) && y.length >= 2 && x.length - y.length <= 1;
}

async function save() {
  file.none = [...none];
  file.source = "Wikipedia article lead images, Wikimedia Commons licenses";
  file.checkedAt = new Date().toISOString().slice(0, 10);
  await writeFile(fileUrl, `${JSON.stringify(file)}\n`);
}

// Licenses for up to 40 photos in one Commons request.
async function license(batch) {
  const titles = batch.map((item) => `File:${item.file}`).join("|");
  const data = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&titles=${encodeURIComponent(titles)}`);
  const byTitle = new Map();
  const normalized = new Map((data.query?.normalized || []).map(({ from, to }) => [to, from]));
  for (const page of Object.values(data.query?.pages || {})) byTitle.set(normalized.get(page.title) || page.title, page.imageinfo?.[0]);
  for (const item of batch) {
    const info = byTitle.get(`File:${item.file}`);
    const meta = info?.extmetadata || {};
    const name = meta.LicenseShortName?.value;
    if (info?.url && /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(info.url) && name && /^(CC|Public domain|PD)/i.test(name) && info.width >= 600) {
      file.photos[item.id] = { url: info.url, width: info.width, height: info.height, source: info.descriptionurl, artist: strip(meta.Artist?.value).split(/;|Camera location/)[0].trim().slice(0, 80) || "Unknown", license: name, licenseUrl: meta.LicenseUrl?.value || null, article: item.article };
    } else none.add(item.id);
  }
  await save();
}

const activities = new Map();
for (const area of Object.values(places)) for (const place of area.activities || []) if (place.googlePlaceId && Number.isFinite(place.latitude)) activities.set(place.googlePlaceId, place);
if (process.argv.includes("--refilter")) {
  // Re-check saved photos against the current name rules, without fetching.
  for (const [id, photo] of Object.entries(file.photos)) {
    const place = activities.get(id);
    if (place && sameName(place.name, photo.article)) continue;
    console.log(`dropped ${place?.name} => ${photo.article}`);
    delete file.photos[id];
    none.add(id);
  }
  await save();
  process.exit(0);
}
activities.clear();
for (const area of Object.values(places)) for (const place of area.activities || []) if (place.googlePlaceId && Number.isFinite(place.latitude)) activities.set(place.googlePlaceId, place);
const todo = [...activities].filter(([id]) => !file.photos[id] && !none.has(id));
console.log(`${todo.length} of ${activities.size} places left`);
let pending = [];
let done = 0;
for (const [id, place] of todo) {
  done += 1;
  try {
    const data = await json(`https://en.wikipedia.org/w/api.php?action=query&format=json&generator=geosearch&ggscoord=${place.latitude}|${place.longitude}&ggsradius=3000&ggslimit=20&prop=pageimages&piprop=name`);
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    const page = pages.find((item) => item.pageimage && !NOT_A_VIEW.test(item.pageimage) && sameName(place.name, item.title));
    if (page) pending.push({ id, file: page.pageimage, article: page.title }); else none.add(id);
  } catch (error) {
    console.log(`${place.name}: ${error.message}`);
  }
  if (pending.length >= 40) { await license(pending); pending = []; }
  if (done % 25 === 0) { await save(); console.log(`${done}/${todo.length}  ${Object.keys(file.photos).length} photos`); }
  await sleep(1000);
}
if (pending.length) await license(pending);
await save();
console.log(`done: ${Object.keys(file.photos).length} photos for ${activities.size} activities`);

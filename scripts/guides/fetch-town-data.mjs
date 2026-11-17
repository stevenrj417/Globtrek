// Weather and a photo for each guide town in app/data/guideTowns.js:
//   climate  NASA POWER monthly climatology (T2M °C, PRECTOTCORR mm/day; 2001–2025)
//   image    the town's Wikipedia lead image, with its Wikimedia Commons license
// Writes app/data/guideTownData.json. Resumes; --force refetches.
//   node scripts/guides/fetch-town-data.mjs [--force]
import { readFile, writeFile } from "node:fs/promises";

const { GUIDE_TOWNS } = await import("../../app/data/guideTowns.js");
const fileUrl = new URL("../../app/data/guideTownData.json", import.meta.url);
const force = process.argv.includes("--force");
const file = JSON.parse(await readFile(fileUrl, "utf8").catch(() => '{"towns":{}}'));
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const HEADERS = { "User-Agent": "GlobTrekGuides/1.0 (travel guide images)" };
const strip = (html) => String(html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
// Lead images that aren't a view of the place.
const NOT_A_VIEW = /\b(map|locator|location|seal|flag|logo|coat[_ ]of[_ ]arms|county|montage|collage)\b|\.svg$/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url, tries = 4) {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(60000) });
  // Wikimedia rate-limits bursts; wait and retry.
  if (response.status === 429 && tries > 1) { await sleep(15000 * (5 - tries)); return json(url, tries - 1); }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function image(title, override) {
  let file = override;
  if (!file) {
    const page = Object.values((await json(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}`)).query.pages)[0];
    file = page?.pageimage;
  }
  if (!file || NOT_A_VIEW.test(file)) return { rejected: file || null };
  const info = Object.values((await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&titles=${encodeURIComponent(`File:${file}`)}`)).query.pages)[0]?.imageinfo?.[0];
  const meta = info?.extmetadata || {};
  const license = meta.LicenseShortName?.value;
  if (!info?.url || !/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(info.url) || !license || !/^(CC|Public domain|PD)/i.test(license)) return { rejected: file };
  return {
    url: info.url,
    width: info.width,
    height: info.height,
    source: info.descriptionurl,
    artist: strip(meta.Artist?.value).split(/;|Camera location/)[0].trim() || "Unknown",
    license,
    licenseUrl: meta.LicenseUrl?.value || null,
    description: strip(meta.ImageDescription?.value).slice(0, 200) || null,
  };
}

// Hand-picked when the lead image isn't a view of the town.
const OVERRIDES = JSON.parse(await readFile(new URL("./town-image-overrides.json", import.meta.url), "utf8").catch(() => "{}"));

for (const [key, town] of Object.entries(GUIDE_TOWNS)) {
  const entry = file.towns[key] || {};
  if (force || !entry.climate) {
    const data = await json(`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M,PRECTOTCORR&community=RE&longitude=${town.longitude}&latitude=${town.latitude}&format=JSON`);
    const parameter = data?.properties?.parameter;
    if (parameter?.T2M) entry.climate = { latitude: town.latitude, longitude: town.longitude, t2m: MONTHS.map((month) => parameter.T2M[month]), precip: MONTHS.map((month) => parameter.PRECTOTCORR[month]) };
  }
  if (force || !entry.image || OVERRIDES[key] && !entry.image.source?.endsWith(encodeURIComponent(OVERRIDES[key]).replace(/%20/g, "_"))) {
    const found = await image(town.wiki, OVERRIDES[key]);
    if (found.url) entry.image = found; else delete entry.image;
    if (found.rejected) console.log(`${key}: lead image ${found.rejected} isn't usable; add an override`);
  }
  file.towns[key] = entry;
  await writeFile(fileUrl, `${JSON.stringify(file, null, 1)}\n`);
  await sleep(3000);
  console.log(`${key.padEnd(18)} ${entry.climate ? "climate" : "NO CLIMATE"}  ${entry.image ? `${entry.image.source.split("File:")[1]} (${entry.image.license})` : "NO IMAGE"}`);
}

file.source = { climate: "NASA POWER climatology API v2 (T2M, PRECTOTCORR; 2001–2025)", image: "Wikipedia lead image, Wikimedia Commons license" };
file.checkedAt = new Date().toISOString().slice(0, 10);
await writeFile(fileUrl, `${JSON.stringify(file, null, 1)}\n`);

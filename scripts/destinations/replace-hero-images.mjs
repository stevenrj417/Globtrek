// Replaces destination hero images that were flags or maps with real photos
// from Wikimedia Commons, recording the author and license from Commons itself.
//   node scripts/destinations/replace-hero-images.mjs
import { readFileSync, writeFileSync } from "node:fs";

const UA = "GlobTrekDataBot/1.0 (https://www.glob-trek.com; contact@glob-trek.com)";

// Destination id → Commons file, picked by looking at each photo.
export const REPLACEMENTS = {
  "hong-kong-d2eaf": "Hong Kong from Victoria Peak1.jpg",
  "menorca-20a8d": "Cala en Turqueta (16234699877).jpg",
  "isle-of-skye-97691": "Quiraing, Isle of Skye.jpg",
  "seychelles-3d2d7": "La Digue asv2024-10 img56 Anse Patates.jpg",
  "monaco-35ab1": "Panorama von Monaco-La Turbie.jpg",
  "st-barts-e3772": "Saint Barth - Vue panoramique - Octobre 2009.jpg",
  "normandy-e3772": "Mont St Michel after sunrise.jpg",
  "sardinia-ad79e": "View of La Pelosa, Sardinia (Italy) (24194280755).jpg",
  "mauritius-26160": "Mauritius 23.08.2009 11-42-31.jpg",
  "nosy-be-f92bc": "Nosy Iranja, Madagascar, 2025-09-17, DD 19.jpg",
};

// Files whose Commons page names the photographer only in its description.
const AUTHORS = { "Quiraing, Isle of Skye.jpg": "Stinging Eyes (Flickr)" };

const BATCHES = ["01", "02", "03", "04"].map((n) => new URL(`./verified-batch-${n}.json`, import.meta.url));
const text = (html) => String(html || "").replace(/<[^>]+>/g, "").replace(/\(\s*talk\W+contribs\s*\)/gi, "").replace(/\s+/g, " ").trim() || null;

async function commons(file) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&titles=${encodeURIComponent(`File:${file}`)}`;
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  const page = Object.values((await response.json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) throw new Error(`No Commons file: ${file}`);
  const meta = info.extmetadata || {};
  return {
    imageUrl: info.url,
    sourcePageUrl: info.descriptionurl,
    sourceName: "Wikimedia Commons",
    author: AUTHORS[file] || text(meta.Artist?.value),
    licenseName: text(meta.LicenseShortName?.value),
    licenseUrl: meta.LicenseUrl?.value || null,
    attributionText: text(meta.Credit?.value),
    width: info.width,
    height: info.height,
    verifiedAt: new Date().toISOString(),
    isHero: true,
  };
}

const images = {};
for (const [id, file] of Object.entries(REPLACEMENTS)) images[id] = await commons(file);

for (const path of BATCHES) {
  const batch = JSON.parse(readFileSync(path, "utf8"));
  let changed = 0;
  for (const record of batch.records || []) {
    const image = images[record.id];
    if (!image) continue;
    record.images = [image, ...(record.images || []).filter((old) => old.imageUrl !== image.imageUrl && !/\.svg(\?|$)/i.test(old.imageUrl)).map((old) => ({ ...old, isHero: false }))];
    record.primaryImageUrl = image.imageUrl;
    record.imageSource = image.sourceName;
    record.imageLicenseMetadata = image;
    changed += 1;
    console.log(`${record.id}: ${image.imageUrl.split("/").pop()} · ${image.author} · ${image.licenseName}`);
  }
  if (changed) writeFileSync(path, `${JSON.stringify(batch, null, 2)}\n`);
}

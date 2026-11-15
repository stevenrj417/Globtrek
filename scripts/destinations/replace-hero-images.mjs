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

// Master-list destinations (verified-batch-05) whose Wikipedia lead image was a
// flag, map, satellite view, collage, .tif or too small. The old image is
// dropped, not kept as a secondary photo. Each pick was checked by eye.
export const MASTER_LIST_REPLACEMENTS = {
  "mackinac-island-76868": "Aerial view of Mackinac Island 2020-09-04.jpg",
  "bocas-del-toro-1e36b": "Bocas del Toro, Panama (Unsplash).jpg",
  "kingston-5eedd": "Fort Port Royal Jamaica.JPG",
  "dominica-bc1cd": "Cascadas Trafalgar, Dominica.jpg",
  "faroe-islands-1082f": "Saksun, Faroe Islands.jpg",
  "westfjords-b3c92": "Río Dynjandisá, Vestfirðir, Islandia, 2014-08-14, DD 158-160 HDR.JPG",
  "puglia-ad79e": "Polignano a mare -Lama Monachile.jpg",
  "mallorca-20a8d": "Mallorca - Leuchtturm am Kap Formentor2.jpg",
  "sao-tome-6ddcb": "Pico Cão Grande.jpg",
  "komodo-national-park-35536": "Padar Island, Komodo National Park, Indonesia, 20250822 0911 2638.jpg",
  "tasmania-ceafb": "Boat shed and Cradle Mountain at Dove Lake, Tas.jpg",
  "perth-and-rottnest-island-ceafb": "Pinky Beach 1.jpg",
  "viti-levu-bbb7e": "2019-01-31 Coral coast, Viti Levu, Fiji 01.jpg",
  "savai-i-f5680": "Coconut trees by the sea, Savai'i, Samoa.JPG",
  "espiritu-santo-d16ad": "Champagne Beach.jpg",
  "palau-e5e0b": "Rock-Islands-Palau-1-2016-aerial-view-Luka-Peternel.jpg",
  "lake-atitlan-11760": "Lake Atitlan, Volcan San Pedro (15339126093).jpg",
  "osa-peninsula-1bf42": "Parque Nacional Corcovado.JPG",
  "great-barrier-reef-ceafb": "Coral Outcrop Flynn Reef.jpg",
  "wadi-shab-c14c3": "Wadi Shab, Oman.jpg",
  "bacalar-41937": "Bacalar Lagoon, Quintana Roo, Mexico May 2021.jpg",
  "cuenca-09f19": "Catedral de la Inmaculada Concepción, Cuenca.jpg",
  "paramaribo-b17fc": "Paramaribo - Waterkant 32 en 30 20161002.jpg",
  "wellington-a2238": "Wellington Harbour in May 2026.jpg",
  "rarotonga-4bacf": "Muri Beach, Rarotonga, Cook Islands.jpg",
  // Same photo; re-fetched so the photographer named in its description is credited.
  "bwindi-impenetrable-forest-e9290": "Bwindi.JPG",
};

// Files whose Commons page names the photographer only in its description.
const AUTHORS = { "Quiraing, Isle of Skye.jpg": "Stinging Eyes (Flickr)", "Bwindi.JPG": "Duncan Wright" };

const BATCHES = ["01", "02", "03", "04", "05"].map((n) => new URL(`./verified-batch-${n}.json`, import.meta.url));
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
for (const [id, file] of Object.entries({ ...REPLACEMENTS, ...MASTER_LIST_REPLACEMENTS })) {
  images[id] = await commons(file);
  await new Promise((resolve) => setTimeout(resolve, 300));
}

for (const path of BATCHES) {
  const batch = JSON.parse(readFileSync(path, "utf8"));
  let changed = 0;
  for (const record of batch.records || []) {
    const image = images[record.id];
    if (!image) continue;
    const previous = record.id in MASTER_LIST_REPLACEMENTS ? [] : record.images || [];
    record.images = [image, ...previous.filter((old) => old.imageUrl !== image.imageUrl && !/\.svg(\?|$)/i.test(old.imageUrl)).map((old) => ({ ...old, isHero: false }))];
    record.primaryImageUrl = image.imageUrl;
    record.imageSource = image.sourceName;
    record.imageLicenseMetadata = image;
    changed += 1;
    console.log(`${record.id}: ${image.imageUrl.split("/").pop()} · ${image.author} · ${image.licenseName}`);
  }
  if (changed) writeFileSync(path, `${JSON.stringify(batch, null, 2)}\n`);
}

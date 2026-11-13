// Lists the Commons hero photos narrower than the widest thumbnail the site
// asks for, so the photo loader never requests a thumbnail Commons can't make.
//   node scripts/destinations/build-image-widths.mjs
import { writeFileSync } from "node:fs";
import { destinations } from "../../app/data/destinations.js";

const UA = "GlobTrekDataBot/1.0 (https://www.glob-trek.com; contact@glob-trek.com)";
const LARGEST = 1920;
const ORIGINAL = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/;

const files = [...new Set(destinations.map((item) => item.image?.match(ORIGINAL)?.[1]).filter(Boolean))];
const widths = {};
for (let index = 0; index < files.length; index += 50) {
  const titles = files.slice(index, index + 50).map((file) => `File:${decodeURIComponent(file)}`);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=size&titles=${encodeURIComponent(titles.join("|"))}`;
  const data = await (await fetch(url, { headers: { "User-Agent": UA } })).json();
  const normalized = Object.fromEntries((data.query.normalized || []).map(({ from, to }) => [to, from]));
  for (const page of Object.values(data.query.pages)) {
    const width = page.imageinfo?.[0]?.width;
    if (!width || width >= LARGEST) continue;
    const title = normalized[page.title] || page.title;
    const file = files.find((name) => `File:${decodeURIComponent(name)}` === title || decodeURIComponent(name).replace(/_/g, " ") === page.title.slice(5));
    if (file) widths[file] = width;
  }
}
const sorted = Object.fromEntries(Object.entries(widths).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(new URL("../../app/data/commonsImageWidths.json", import.meta.url), `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`${Object.keys(sorted).length} of ${files.length} Commons heroes are narrower than ${LARGEST}px.`);

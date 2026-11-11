// Facts for each destination from sources already collected, merged into the
// catalog by app/data/destinations.js. Writes app/data/destinationFacts.json.
//
//   coordinates   flagship-locations.json (Wikipedia), only where the catalog has none
//   factSource    the destination's English Wikipedia article (wikidata.json)
//   climate       NASA POWER 2001–2025 monthly means (climate.json): the season
//                 text states the measured averages, and avoidMonths uses fixed
//                 thresholds, not editorial judgment
//   tags          setting and interest tags derived from verified catalog tags,
//                 Wikidata population, elevation and water, and curated places
//   imageAlt      the Wikimedia Commons file title of the hero image
//
//   node scripts/destinations/build-destination-facts.mjs
import { readFile, writeFile } from "node:fs/promises";

const read = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const factsUrl = new URL("../../app/data/destinationFacts.json", import.meta.url);
// destinations.js merges the current facts file; start from none so nothing
// derived last run feeds back into this one.
await writeFile(factsUrl, `${JSON.stringify({ checkedAt: null, facts: {} })}\n`);
const { destinations } = await import("../../app/data/destinations.js");
const flagships = (await read("./flagship-locations.json")).locations;
const climate = await read("./climate.json");
const wikidata = (await read("./wikidata.json")).destinations;
const curated = (await read("../../app/data/curatedPlaces.json")).places || {};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const today = new Date().toISOString().slice(0, 10);

// Catalog interest tags (lowercase in the verified batches) -> quiz tags.
const SETTING_FROM_TAG = { coast: "Ocean", beaches: "Ocean", diving: "Ocean", mountains: "Mountains", hiking: "Mountains", winter: "Mountains", city: "Cities", culture: "Culture", history: "Culture", architecture: "Culture", museums: "Culture", art: "Culture" };
const INTEREST_FROM_TAG = { food: "Food", wine: "Food", nightlife: "Nightlife", music: "Nightlife", nature: "Nature", wildlife: "Nature", lakes: "Nature", gardens: "Nature", hiking: "Nature", desert: "Nature", wellness: "Wellness", relaxation: "Wellness", shopping: "Shopping", culture: "Culture", history: "Culture", museums: "Culture", art: "Culture" };
const SEA = /\b(sea|ocean|bay|gulf|strait|channel|lagoon|sound|harbou?r)\b/i;
const NOT_SEA = /\blake\b|\breservoir\b|\briver\b/i;
const CULTURE_PLACE = /museum|gallery|historical|cultural|monument|church|temple|cathedral|castle|palace|mosque|shrine|archaeological/i;
const NATURE_PLACE = /park|beach|hiking|lake|mountain|natural|garden|scenic|waterfall|national/i;

const ranges = (months) => {
  const runs = [];
  for (const month of months) {
    const last = runs.at(-1);
    if (last && month === last.at(-1) + 1) last.push(month);
    else runs.push([month]);
  }
  // December runs into January.
  if (runs.length > 1 && runs[0][0] === 0 && runs.at(-1).at(-1) === 11) runs[0] = [...runs.pop(), ...runs[0]];
  return runs.map((run) => (run.length === 1 ? MONTHS[run[0]] : `${MONTHS[run[0]]}–${MONTHS[run.at(-1)]}`)).join(", ");
};

function climateFacts(record, mountain) {
  if (!record?.t2m?.length) return null;
  const { t2m, precip } = record;
  const indexes = MONTHS.map((_, index) => index);
  let mild = indexes.filter((m) => t2m[m] >= 12 && t2m[m] <= 27 && precip[m] <= 5);
  // Nowhere near that range all year: name the three months closest to 21 °C.
  if (!mild.length) mild = [...indexes].sort((a, b) => Math.abs(t2m[a] - 21) + precip[a] - (Math.abs(t2m[b] - 21) + precip[b])).slice(0, 3).sort((a, b) => a - b);
  const wettest = indexes.reduce((best, m) => (precip[m] > precip[best] ? m : best), 0);
  const round = (value) => Math.round(value);
  const temps = mild.map((m) => t2m[m]);
  // Fixed thresholds: very hot, very wet (monsoon-level) or, away from ski
  // country, deep-freeze months.
  const avoid = indexes.filter((m) => t2m[m] > 33 || precip[m] > 12 || (!mountain && t2m[m] < -10)).map((m) => m + 1);
  return {
    season: `Mildest, driest months: ${ranges(mild)} (average ${round(Math.min(...temps))}–${round(Math.max(...temps))} °C). Wettest month: ${MONTHS[wettest]}, about ${Math.round(precip[wettest] * 30)} mm of rain. Averages from NASA POWER, 2001–2025.`,
    avoidMonths: avoid.length <= 6 ? avoid : [],
  };
}

function commonsAlt(destination) {
  const url = String(destination.image || "");
  if (!/upload\.wikimedia\.org/.test(url)) return null;
  const file = decodeURIComponent(url.split("?")[0].split("/").pop() || "")
    .replace(/\.(jpe?g|png|webp|tiff?)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\d{6,}\b|\b(IMG|DSC|DSCF|P)\s?\d+\b|\(\d+\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return file.length >= 8 && /[a-z]{3}/i.test(file) ? file : null;
}

const title = (value) => String(value).toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
const facts = {};
for (const destination of destinations) {
  const id = destination.id;
  const wiki = wikidata[id];
  const fact = {};
  if (!(Number.isFinite(Number(destination.latitude)) && destination.latitude != null) && flagships[id]) {
    fact.latitude = flagships[id].latitude;
    fact.longitude = flagships[id].longitude;
  }
  if (wiki?.matched && wiki.wikipedia && !/\/(Outline|List|Index)_of/i.test(wiki.wikipedia)) fact.factSource = wiki.wikipedia;
  else if (flagships[id]?.source) fact.factSource = flagships[id].source;

  const tags = new Set(destination.tags || []);
  const raw = (destination.tags || []).map((tag) => tag.toLowerCase());
  const add = new Set();
  for (const tag of raw) {
    if (SETTING_FROM_TAG[tag]) add.add(SETTING_FROM_TAG[tag]);
    if (INTEREST_FROM_TAG[tag]) add.add(INTEREST_FROM_TAG[tag]);
  }
  if (wiki?.population >= 300000) add.add("Cities");
  if (wiki?.elevationM >= 900 || destination.destinationType === "mountain") add.add("Mountains");
  if ((wiki?.water || []).some((water) => SEA.test(`${water.label} ${water.description}`) && !NOT_SEA.test(water.label))) add.add("Ocean");
  const places = [...(curated[id]?.activities || [])].map((place) => place.category || "");
  if (places.filter((category) => CULTURE_PLACE.test(category)).length >= 2) add.add("Culture");
  if (places.filter((category) => NATURE_PLACE.test(category)).length >= 2) add.add("Nature");
  // Derived tags fill gaps only: a destination that already has a setting (or
  // interest) keeps exactly the ones its catalog record gives it.
  const SETTINGS = ["Ocean", "Mountains", "Cities", "Culture"];
  const INTERESTS = ["Food", "Nature", "Culture", "Nightlife", "Wellness", "Shopping"];
  const hasSetting = SETTINGS.some((tag) => tags.has(tag));
  const hasInterest = INTERESTS.some((tag) => tags.has(tag));
  const newTags = [...add].filter((tag) => !tags.has(tag) && ((!hasSetting && SETTINGS.includes(tag)) || (!hasInterest && INTERESTS.includes(tag))));
  if (newTags.length) fact.addTags = newTags;

  const mountain = tags.has("Mountains") || newTags.includes("Mountains");
  const weather = climateFacts(climate.climate[id], mountain);
  if (weather) fact.climate = weather;

  const alt = commonsAlt(destination);
  fact.imageAlt = alt ? `${alt} (${title(destination.city)}, ${title(destination.country)})` : `${title(destination.city)}, ${title(destination.country)}`;
  fact.checkedAt = climate.checkedAt || today;
  facts[id] = fact;
}

await writeFile(factsUrl, `${JSON.stringify({ checkedAt: today, sources: { climate: climate.source, wikidata: "Wikidata and English Wikipedia", coordinates: "Wikipedia" }, facts })}\n`);
const count = (key) => Object.values(facts).filter((fact) => fact[key]).length;
console.log(`${Object.keys(facts).length} destinations: ${count("latitude")} coordinates, ${count("factSource")} fact sources, ${count("climate")} climate, ${count("addTags")} with new tags`);

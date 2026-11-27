// Free facts for curated restaurants and sights from Wikidata (CC0, no key,
// no cost): a one-line description ("art museum in Lisbon, Portugal"), what
// kind of place it is, the admission fee when Wikidata lists one, and the
// English Wikipedia article. A place gets facts only when a Wikidata item with
// a matching name sits within reach of it (400 m, 3 km for parks and nature),
// so a card never borrows another place's details. Restaurants match only
// items that are places to eat or drink.
//
// Polite: one query at a time with a pause, Retry-After honored. A failed
// query is not recorded; rerun to fill gaps.
// Writes app/data/placeWikidata.json (keyed by Google place ID). Resumes.
//   node scripts/places/fetch-wikidata-facts.mjs
import { readFile, writeFile } from "node:fs/promises";
import { words } from "./photoNames.mjs";

const CHUNK = 15;
const UA = "GlobTrekPlaceFacts/1.0 (https://www.glob-trek.com)";
const WIDE = /park|nature|wildlife|hiking|beach|ski|national|garden|preserve|refuge|scenic/i;
const LANGS = ["en", "mul", "es", "fr", "de", "it", "pt", "nl", "pl", "cs", "hr", "sv", "da", "no", "id", "vi", "tr"];

const curated = JSON.parse(await readFile(new URL("../../app/data/curatedPlaces.json", import.meta.url), "utf8"));
const outUrl = new URL("../../app/data/placeWikidata.json", import.meta.url);
let out = { source: "Wikidata (CC0), matched by name and location", checkedAt: null, checked: {}, facts: {} };
try { const saved = JSON.parse(await readFile(outUrl, "utf8")); if (saved.checked) out = saved; } catch {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function sparql(query) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const response = await fetch("https://query.wikidata.org/sparql", { method: "POST", headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" }, body: `query=${encodeURIComponent(query)}`, signal: AbortSignal.timeout(70000) });
      if (response.status === 429 || response.status >= 500) {
        await sleep(Math.min(120, Math.max(Number(response.headers.get("retry-after")) || 0, 5 * 2 ** attempt)) * 1000);
        continue;
      }
      if (!response.ok) { console.log(`HTTP ${response.status}: ${(await response.text()).slice(0, 160).replace(/\s+/g, " ")}`); return null; }
      return await response.json();
    } catch { await sleep(5000 * (attempt + 1)); }
  }
  return null;
}

// Every meaningful word of the shorter name is in the longer one (two or more
// shared words, or both one word), e.g. "Belém Tower" ~ "Tower of Belém".
function sameName(a, b) {
  const x = words(a);
  const y = words(b);
  if (!x.length || !y.length) return false;
  const shared = x.filter((word) => y.includes(word)).length;
  // The longer name adds at most one word: "ZAABNIRAN B1 One Bangkok" is not "One Bangkok".
  return shared >= Math.min(x.length, y.length) && shared >= Math.min(2, x.length, y.length) && Math.abs(x.length - y.length) <= 1;
}
// A restaurant only matches an item that is a place to eat or drink.
const EATERY = /restaurant|caf|coffee|bar\b|pub|tavern|bakery|patisserie|food|eat|dining|bistro|brasserie|brew|winery|distillery|inn|hotel|market|diner|izakaya|teahouse/i;

const qid = (uri) => String(uri || "").split("/").pop();
const jobs = [];
for (const group of Object.values(curated.places || {})) {
  const places = ["activities", "restaurants"].flatMap((kind) => (group[kind] || []).map((place) => ({ ...place, kind })))
    .filter((place) => place.googlePlaceId && Number.isFinite(place.latitude) && Number.isFinite(place.longitude) && !(place.googlePlaceId in out.checked));
  for (let index = 0; index < places.length; index += CHUNK) jobs.push(places.slice(index, index + CHUNK));
}
console.log(`${jobs.length} queries to make`);

// Entity details from the plain API (50 per request): English description,
// what it is (P31), admission fee (P2555) and English Wikipedia article.
async function entities(ids, props) {
  const found = {};
  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=${props}&languages=en&sitefilter=enwiki&ids=${batch.join("|")}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) }).catch(() => null);
      if (response?.ok) { Object.assign(found, (await response.json()).entities || {}); break; }
      await sleep(Math.min(60, Math.max(Number(response?.headers.get("retry-after")) || 0, 2 ** attempt)) * 1000);
    }
  }
  return found;
}
const classNames = new Map();

let done = 0;
for (const places of jobs) {
  // Nearby items and their names only: anything heavier times out.
  const blocks = places.map((place, index) => `{ SERVICE wikibase:around { ?item wdt:P625 ?loc . bd:serviceParam wikibase:center "Point(${place.longitude} ${place.latitude})"^^geo:wktLiteral . bd:serviceParam wikibase:radius "${WIDE.test(place.category || "") ? 3 : 0.4}" . } BIND(${index} AS ?k) }`).join(" UNION ");
  // Without the hint Blazegraph joins labels before the nearby search and times out.
  const query = `SELECT ?k ?item ?label WHERE { hint:Query hint:optimizer "None" . ${blocks} ?item rdfs:label ?label . FILTER(LANG(?label) IN (${LANGS.map((lang) => `"${lang}"`).join(",")})) }`;
  const data = await sparql(query);
  done += 1;
  if (!data) { console.log("skip (no answer)"); continue; }
  const near = new Map();
  for (const row of data.results.bindings) {
    const key = `${row.k.value}|${qid(row.item.value)}`;
    const item = near.get(key) || { k: Number(row.k.value), qid: qid(row.item.value), labels: new Set() };
    item.labels.add(row.label.value);
    near.set(key, item);
  }
  const candidates = places.map((place, index) => [...near.values()].filter((item) => item.k === index && [...item.labels].some((label) => sameName(place.name, label))));
  const details = await entities([...new Set(candidates.flat().map((item) => item.qid))], "descriptions|claims|sitelinks");
  const pending = [...new Set(Object.values(details).flatMap((entity) => (entity.claims?.P31 || []).map((claim) => claim.mainsnak?.datavalue?.value?.id)).filter((id) => id && !classNames.has(id)))];
  for (const [id, entity] of Object.entries(await entities(pending, "labels"))) classNames.set(id, entity.labels?.en?.value || null);
  places.forEach((place, index) => {
    const rich = candidates[index].map((item) => {
      const entity = details[item.qid] || {};
      const fees = (entity.claims?.P2555 || []).map((claim) => claim.mainsnak?.datavalue?.value).filter(Boolean).map((value) => ({ amount: Number(value.amount), unit: qid(value.unit) })).filter((fee) => Number.isFinite(fee.amount) && fee.amount >= 0);
      // How close the best name is: an exact word match beats one extra word.
      const gap = Math.min(...[...item.labels].filter((label) => sameName(places[index].name, label)).map((label) => Math.abs(words(label).length - words(places[index].name).length) + (words(label).join(" ") === words(places[index].name).join(" ") ? 0 : 0.5)));
      return {
        gap,
        qid: item.qid,
        description: entity.descriptions?.en?.value || null,
        classes: (entity.claims?.P31 || []).map((claim) => classNames.get(claim.mainsnak?.datavalue?.value?.id)).filter(Boolean).slice(0, 4),
        // The adult (highest) fee when several are listed.
        fee: fees.length ? fees.sort((a, b) => b.amount - a.amount)[0] : null,
        article: entity.sitelinks?.enwiki?.title || null,
      };
    })
      // The closest name wins, then the richest item: an article, a description, classes.
      .filter((fact) => places[index].kind !== "restaurants" || EATERY.test([fact.description, ...fact.classes].join(" ")))
      .sort((a, b) => (a.gap - b.gap) || (Boolean(b.article) - Boolean(a.article)) || (Boolean(b.description) - Boolean(a.description)) || (b.classes.length - a.classes.length));
    out.checked[place.googlePlaceId] = Boolean(rich[0]);
    if (rich[0]) { const { gap, ...fact } = rich[0]; out.facts[place.googlePlaceId] = fact; }
  });
  if (done % 10 === 0) {
    out.checkedAt = new Date().toISOString().slice(0, 10);
    await writeFile(outUrl, `${JSON.stringify(out)}\n`);
    console.log(`${done}/${jobs.length} queries, ${Object.keys(out.facts).length} places matched`);
  }
  await sleep(1000);
}
out.checkedAt = new Date().toISOString().slice(0, 10);
await writeFile(outUrl, `${JSON.stringify(out)}\n`);
console.log(`done: ${Object.keys(out.facts).length} of ${Object.keys(out.checked).length} places matched`);

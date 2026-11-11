// Objective facts per destination from Wikipedia and Wikidata (CC0): the
// Wikipedia article (fact source), population, elevation and the body of water
// it sits on. Used to assign setting tags by fixed rules, never by judgment.
// A match is accepted only when Wikipedia's coordinates are within 40 km of
// the destination's own (or, without coordinates, the title names the city).
// Usage: node scripts/destinations/enrich-wikidata.mjs → scripts/destinations/wikidata.json
import { writeFile } from "node:fs/promises";

const { destinations } = await import("../../app/data/destinations.js");
// Wikimedia asks automated clients to identify themselves.
const headers = { "User-Agent": "GlobTrekDataBot/1.0 (https://www.glob-trek.com; contact@glob-trek.com)", Accept: "application/json" };
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const get = async (url) => { const reply = await fetch(url, { headers, signal: AbortSignal.timeout(20000) }); if (!reply.ok) throw new Error(`http_${reply.status}`); return reply.json(); };
const km = (a, b) => { const r = (v) => v * Math.PI / 180; const x = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2; return 6371 * 2 * Math.asin(Math.sqrt(x)); };
const title = (value) => String(value || "").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const latest = (claims = []) => claims.filter((claim) => claim.mainsnak?.datavalue).sort((a, b) => String(b.qualifiers?.P585?.[0]?.datavalue?.value?.time || "").localeCompare(String(a.qualifiers?.P585?.[0]?.datavalue?.value?.time || "")))[0]?.mainsnak.datavalue.value;

const out = {};
for (const destination of destinations) {
  const city = title(String(destination.city).split(/ & | and |,|\(/)[0].trim());
  const query = `${city} ${title(destination.country)}`;
  try {
    const search = await get(`https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageprops|coordinates&ppprop=wikibase_item`);
    const pages = Object.values(search.query?.pages || {}).sort((a, b) => a.index - b.index);
    const own = destination.latitude != null ? [Number(destination.latitude), Number(destination.longitude)] : null;
    const page = pages.find((item) => item.pageprops?.wikibase_item && (own && item.coordinates ? km(own, [item.coordinates[0].lat, item.coordinates[0].lon]) <= 40 : item.title.toLowerCase().includes(city.toLowerCase())));
    if (!page) { out[destination.id] = { matched: false, query }; console.log(destination.id.padEnd(22), "no match"); await pause(200); continue; }
    const qid = page.pageprops.wikibase_item;
    const entity = (await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${qid}&props=claims`)).entities[qid];
    const claims = entity.claims || {};
    const population = Number(latest(claims.P1082)?.amount) || null;
    const elevation = Number(latest(claims.P2044)?.amount) || null;
    const waterIds = (claims.P206 || []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
    let water = [];
    if (waterIds.length) {
      const items = (await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${waterIds.slice(0, 20).join("|")}&props=labels|descriptions&languages=en`)).entities;
      water = Object.values(items).map((item) => ({ label: item.labels?.en?.value || null, description: item.descriptions?.en?.value || null }));
    }
    out[destination.id] = {
      matched: true,
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      wikidata: `https://www.wikidata.org/wiki/${qid}`,
      population,
      elevationM: elevation,
      water,
    };
    console.log(destination.id.padEnd(22), page.title, population, elevation, water.map((item) => item.label).join("; "));
  } catch (error) {
    out[destination.id] = { matched: false, error: error.message };
    console.log(destination.id.padEnd(22), "error", error.message);
  }
  await pause(250);
}
await writeFile(new URL("./wikidata.json", import.meta.url), `${JSON.stringify({ source: "Wikipedia and Wikidata (CC0)", checkedAt: new Date().toISOString().slice(0, 10), destinations: out }, null, 1)}\n`);

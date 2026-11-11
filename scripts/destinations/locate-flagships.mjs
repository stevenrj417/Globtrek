// Coordinates and source pages for the original destinations that lack them,
// from the English Wikipedia API (coordinates of each article's subject).
//   node scripts/destinations/locate-flagships.mjs > scripts/destinations/flagship-locations.json
const TITLES = {
  KIX: "Kyoto", HND: "Tokyo", ICN: "Seoul", DPS: "Denpasar", SIN: "Singapore", MLE: "Malé", DXB: "Dubai", CPT: "Cape Town", RAK: "Marrakesh",
  NBO: "Nairobi", CDG: "Paris", MRS: "Aix-en-Provence", NAP: "Amalfi", FCO: "Rome", FLR: "Florence", JTR: "Santorini", BCN: "Barcelona",
  KEF: "Reykjavík", LHR: "London", JFK: "New York City", TQO: "Tulum", SJO: "San José, Costa Rica", GIG: "Rio de Janeiro", YVR: "Vancouver",
  OGG: "Maui", SYD: "Sydney", CHC: "Christchurch", PPT: "Papeete",
};
const out = {};
for (const [id, title] of Object.entries(TITLES)) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=coordinates&format=json&redirects=1&titles=${encodeURIComponent(title)}`;
  const json = await (await fetch(url, { headers: { "User-Agent": "GlobTrek catalog check (contact@glob-trek.com)" } })).json();
  const page = Object.values(json.query.pages)[0];
  const coord = page.coordinates?.[0];
  if (coord) out[id] = { latitude: Number(coord.lat.toFixed(4)), longitude: Number(coord.lon.toFixed(4)), source: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}` };
  else console.error(`no coordinates: ${id} ${title}`);
}
console.log(JSON.stringify({ checkedAt: new Date().toISOString().slice(0, 10), locations: out }, null, 1));

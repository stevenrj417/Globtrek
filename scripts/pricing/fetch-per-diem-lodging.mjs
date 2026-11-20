// Government per diem lodging rates by destination and month.
//
// These are the most-allowed nightly hotel rates US government travelers may
// claim, set from hotel surveys each year. They are a real, published number per
// city and season, so they anchor GlobTrek's hotel estimates far better than a
// country-wide model does. They are rates for a safe, business-standard hotel,
// not a quote and not the cheapest bed in town.
//
//   - United States: GSA CONUS rates (api.gsa.gov), one rate per month.
//   - Abroad and Hawaii/Alaska: US State Department foreign per diem
//     (allowances.state.gov), one row per city and season, with an "Other" row
//     for the rest of each country.
//
//   GSA_API_KEY=... node scripts/pricing/fetch-per-diem-lodging.mjs [--year 2026]
// GSA_API_KEY defaults to DEMO_KEY (one request is made). Writes
// app/data/pricing/perDiemLodging.json.
import { writeFile } from "node:fs/promises";

const { destinations } = await import("../../app/data/destinations.js");
const YEAR = Number(process.argv[process.argv.indexOf("--year") + 1]) || new Date().getFullYear();
const AGENT = "GlobTrekDataBot/1.0 (https://www.glob-trek.com; contact@glob-trek.com)";
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const norm = (value) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const STATES = { Alabama: "AL", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY" };

// GSA rate area for places whose name is not the rate area's name. Each value
// is [state, GSA "City" field]. Checked by hand against the GSA county lists.
const GSA_AREA = {
  JFK: ["NY", "New York City"],
  "lake-tahoe-76868": ["CA", "South Lake Tahoe"],
  "napa-valley-76868": ["CA", "Napa"],
  "yosemite-76868": ["CA", "Yosemite National Park"],
  "joshua-tree-76868": ["CA", "Barstow / Ontario / Victorville"],
  "grand-canyon-76868": ["AZ", "Grand Canyon / Flagstaff"],
  "minneapolis-76868": ["MN", "Minneapolis / St. Paul"],
  "denver-76868": ["CO", "Denver / Aurora"],
  "jackson-hole-76868": ["WY", "Jackson / Pinedale"],
  "outer-banks-76868": ["NC", "Kill Devil Hills"],
  "cape-cod-76868": ["MA", "Hyannis"],
  "portland-maine-76868": ["ME", "Portland"],
  "zion-national-park-76868": ["UT", "Washington County"],
  "rocky-mountain-national-park-76868": ["CO", "Estes Park"],
  "yellowstone-national-park-76868": ["WY", "Cody"],
  "glacier-national-park-76868": ["MT", "Kalispell / Whitefish"],
  "acadia-national-park-76868": ["ME", "Bar Harbor"],
  "sun-valley-76868": ["ID", "Sun Valley / Ketchum"],
  "oregon-coast-76868": ["OR", "Lincoln City"],
  "washington-d-c-76868": ["DC", "District of Columbia"],
  "mackinac-island-76868": ["MI", "Mackinac Island"],
};

// State Department location for places named differently there.
const STATE_LOCATION = {
  "koh-samui": "Samui Island", "phu-quoc": "Phu Quoc Island", "ho-chi-minh-city": "Ho Chi Minh City",
  "grand-cayman": "Grand Cayman", "turks-and-caicos": "Providenciales", "dead-sea": "Dead Sea",
  "gold-coast": "Gold Coast", "byron-bay": "Byron Bay", "whitsunday-islands": "Whitsunday Islands",
  "puno-and-lake-titicaca": "Puno", "sacred-valley": "Urubamba", "easter-island": "Easter Island",
  "banjul-and-the-gambian-coast": "Banjul", "lake-malawi": "Mangochi", "ngorongoro": "Karatu",
  "mexico-city": "Mexico City, D.F.", "MEX": "Mexico City, D.F.", "salvador": "Salvador da Bahia", "recife": "Recife, Pernambuco",
  "frankfurt": "Frankfurt am Main", "HND": "Tokyo City", "tokyo": "Tokyo City", "osaka": "Osaka-Kobe", "KIX": "Kyoto",
  "maui": "Maui", "OGG": "Maui", "kauai": "Kauai", "hawaii-island": "Kailua-Kona", "honolulu": "Honolulu",
  "denali-national-park": "Denali National Park", "anchorage": "Anchorage",
};

// Catalog country -> State Department country name, where they differ.
const COUNTRY = { "SOUTH KOREA": "KOREA, SOUTH", "CZECH REPUBLIC": "CZECHIA", "CAPE VERDE": "CABO VERDE", GAMBIA: "GAMBIA, THE", "SAINT LUCIA": "ST LUCIA", "RÉUNION": "REUNION", "CURAÇAO": "CURACAO", "SAO TOME AND PRINCIPE": "SAO TOME AND PRINCIPE", "ARGENTINA & CHILE": "ARGENTINA", "ARGENTINA AND BRAZIL": "ARGENTINA", "MALAYSIA AND INDONESIA": "MALAYSIA", "PUERTO RICO": "PUERTO RICO", BAHAMAS: "BAHAMAS, THE" };

const idKey = (destination) => (destination.id || destination.airport).replace(/-[0-9a-f]{5}$/, "");
// The place's own name only: catalog aliases also list its province and country
// ("Boquete", "Chiriquí", "Panama"), which must not match a capital's rate.
const names = (destination) => [destination.city, destination.aliases?.[0]].map(norm).filter(Boolean);
// A State Department location's names: "Osaka-Kobe", "Dead Sea/Jordan Valley",
// "Whistler, BC" and "Okinawa Prefecture" each also answer to their first part.
const locationNames = (location) => {
  const full = norm(location);
  const first = norm(String(location).split(/,|\/|-(?=[A-Z])/)[0]);
  return [full, first, first.replace(/ (prefecture|city|island)$/, "")];
};

async function gsaRates() {
  const key = process.env.GSA_API_KEY || "DEMO_KEY";
  const response = await fetch(`https://api.gsa.gov/travel/perdiem/v2/rates/conus/lodging/${YEAR}?api_key=${key}`, { headers: { "User-Agent": AGENT } });
  if (!response.ok) throw new Error(`GSA ${response.status}`);
  return response.json();
}

async function stateCountries() {
  const page = await (await fetch("https://allowances.state.gov/web920/per_diem.asp", { headers: { "User-Agent": AGENT } })).text();
  return new Map([...page.matchAll(/<option value='(\d+)'>([^<]+)/gi)].map(([, code, name]) => [name.trim().toUpperCase(), code]));
}

const decode = (text) => text.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code)).trim();

async function stateRows(code) {
  const response = await fetch("https://allowances.state.gov/web920/per_diem_action.asp", { method: "POST", headers: { "User-Agent": AGENT, "Content-Type": "application/x-www-form-urlencoded" }, body: `MenuHide=1&CountryCode=${code}` });
  const page = await response.text();
  return [...page.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(([, row]) => [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(([, cell]) => decode(cell)))
    .filter((cells) => cells.length >= 9 && /^\d\d\/\d\d$/.test(cells[2]) && /^\d+$/.test(cells[4]))
    .map(([country, location, start, end, lodging, mie, , , effective]) => ({ country, location, start, end, lodging: Number(lodging), mie: Number(mie), effective }));
}

// Seasons are MM/DD ranges; a month takes the rate in force on its 15th.
function monthly(rows) {
  return MONTH.map((_, index) => {
    const day = (index + 1) * 100 + 15;
    const row = rows.find((item) => {
      const [start, end] = [item.start, item.end].map((value) => Number(value.replace("/", "")));
      return start <= end ? day >= start && day <= end : day >= start || day <= end;
    }) || rows[0];
    return row.lodging;
  });
}

const fetchedAt = new Date().toISOString().slice(0, 10);
const out = {};
const report = [];

const gsa = await gsaRates();
for (const destination of destinations.filter((item) => item.country === "UNITED STATES" && item.region !== "Hawaii" && item.region !== "Alaska" && item.airport !== "OGG")) {
  const key = destination.id || destination.airport;
  const state = STATES[destination.region] || (key === "JFK" ? "NY" : null);
  const area = GSA_AREA[key] || GSA_AREA[destination.airport];
  const pool = gsa.filter((row) => row.State === state);
  let row = area ? pool.find((item) => item.City === area[1]) : null;
  row ||= pool.find((item) => names(destination).some((name) => norm(item.City).split(" / ").map(norm).includes(name) || norm(item.City) === name));
  const matchType = row ? "rate_area" : "state_standard";
  row ||= pool.find((item) => item.City === "Standard Rate");
  if (!row) { report.push(`${key}: no GSA row`); continue; }
  out[key] = { source: "gsa", area: `${row.City}, ${row.State}`, matchType, lodgingByMonth: MONTH.map((month) => Number(row[month])), mie: Number(row.Meals), year: YEAR, fetchedAt };
  report.push(`${key.padEnd(38)} ${matchType.padEnd(14)} ${row.City} ${out[key].lodgingByMonth.join(" ")}`);
}

const codes = await stateCountries();
const abroad = destinations.filter((item) => item.country !== "UNITED STATES" || ["Hawaii", "Alaska"].includes(item.region) || item.airport === "OGG");
const byCountry = new Map();
for (const destination of abroad) {
  const hawaiiAlaska = destination.country === "UNITED STATES";
  const country = hawaiiAlaska ? (destination.region === "Alaska" ? "ALASKA" : "HAWAII") : COUNTRY[destination.country] || destination.country;
  if (!byCountry.has(country)) byCountry.set(country, []);
  byCountry.get(country).push(destination);
}

for (const [country, places] of byCountry) {
  // Hawaii and Alaska are non-foreign areas published by the DoD, not on this page.
  const code = codes.get(country);
  if (!code) { report.push(`${country}: no State Department code (${places.length} places)`); continue; }
  const rows = await stateRows(code);
  await sleep(800);
  if (!rows.length) { report.push(`${country}: no rows`); continue; }
  const locations = [...new Set(rows.map((row) => row.location))];
  for (const destination of places) {
    const key = destination.id || destination.airport;
    const wanted = STATE_LOCATION[idKey(destination)] || STATE_LOCATION[destination.airport];
    let location = wanted ? locations.find((item) => norm(item) === norm(wanted)) : null;
    location ||= locations.find((item) => locationNames(item).some((name) => names(destination).includes(name)));
    const matchType = location ? "city" : "country_other";
    location ||= locations.find((item) => /^other$/i.test(item)) || (locations.length === 1 ? locations[0] : null);
    if (!location) { report.push(`${key}: no location in ${country}`); continue; }
    const seasons = rows.filter((row) => row.location === location);
    out[key] = { source: "state_department", area: `${location}, ${seasons[0].country}`, matchType, lodgingByMonth: monthly(seasons), mie: seasons[0].mie, effective: seasons[0].effective, fetchedAt };
    report.push(`${key.padEnd(38)} ${matchType.padEnd(14)} ${location} ${out[key].lodgingByMonth.join(" ")}`);
  }
}

await writeFile(new URL("../../app/data/pricing/perDiemLodging.json", import.meta.url), `${JSON.stringify(out, null, 1)}\n`);
console.log(report.join("\n"));
console.log(`\n${Object.keys(out).length}/${destinations.length} destinations with a per diem lodging rate`);

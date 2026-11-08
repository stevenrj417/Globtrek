// Import budget stays for every launch destination from GlobTrek's CJ Booking.com
// product feeds into app/data/feedStays.json.
// Usage: npm run stays:import   (needs CJ_API_TOKEN and CJ_COMPANY_ID in .env.local)
//
// The feed carries Booking.com's own listing data (photos, room types, beds, guests,
// amenities, star rating, category, free cancellation, Wi-Fi, breakfast, address and
// coordinates) plus a CJ click link credited to GlobTrek. It carries no prices
// (every price is 0.00) and no guest reviews, so prices stay in cheapStays.js and
// the picks are ranked on budget signals only: hostels and simple stays first, no
// four- or five-star hotels, no resorts or whole homes.
import { writeFile } from "node:fs/promises";
import { CJ, cjQuery } from "./client.mjs";
import { LAUNCH_AIRPORTS, LAUNCH_DATA } from "../../app/data/launchSet.js";
import { CHEAP_STAYS } from "../../app/data/cheapStays.js";

// Launch destination → feed region and the city names the feed uses.
const REGIONS = { US: "17369425", MX: "17369470", WEST_EUROPE: "17369488", SE_ASIA: "17369498", SOUTH_AMERICA: "17369475" };
const TARGETS = [
  { id: "las-vegas-76868", city: "Las Vegas", feed: REGIONS.US },
  { id: "san-diego-76868", city: "San Diego", feed: REGIONS.US },
  { id: "los-angeles-76868", city: "Los Angeles", feed: REGIONS.US, also: ["Hollywood", "Santa Monica", "Venice"] },
  { id: "san-francisco-76868", city: "San Francisco", feed: REGIONS.US },
  { id: "seattle-76868", city: "Seattle", feed: REGIONS.US },
  { id: "honolulu-76868", city: "Honolulu", feed: REGIONS.US, also: ["Waikiki"] },
  { id: "MEX", city: "Mexico City", feed: REGIONS.MX },
  { id: "oaxaca-city-41937", city: "Oaxaca City", feed: REGIONS.MX, keyword: "Oaxaca" },
  { id: "guadalajara-41937", city: "Guadalajara", feed: REGIONS.MX },
  { id: "puerto-vallarta-41937", city: "Puerto Vallarta", feed: REGIONS.MX },
  { id: "merida-41937", city: "Mérida", feed: REGIONS.MX, keyword: "Merida", also: ["Merida"] },
  { id: "LIS", city: "Lisbon", feed: REGIONS.WEST_EUROPE },
  { id: "HAN", city: "Hanoi", feed: REGIONS.SE_ASIA },
  { id: "BKK", city: "Bangkok", feed: REGIONS.SE_ASIA },
  { id: "CNX", city: "Chiang Mai", feed: REGIONS.SE_ASIA },
  { id: "EZE", city: "Buenos Aires", feed: REGIONS.SOUTH_AMERICA },
  { id: "new-orleans-76868", city: "New Orleans", feed: REGIONS.US },
  { id: "austin-76868", city: "Austin", feed: REGIONS.US },
  { id: "chicago-76868", city: "Chicago", feed: REGIONS.US },
];

// Category → budget weight. Anything not listed (resorts, villas, whole homes,
// apartments, campsites, boats) is left out.
const CATEGORY_WEIGHT = { Hostel: 6, "Capsule hotel": 6, "Guest house": 3.5, Motel: 3.5, Inn: 2.5, "Bed and breakfast": 2.5, Hotel: 1.5, Lodge: 1.5 };
const BUDGET_BRANDS = /\b(hostel|hi |motel 6|studio 6|super 8|red roof|econo lodge|travelodge|days inn|ibis|selina|generator|freehand|lub d|mad monkey|bodega|green tortoise|hostelling|backpacker)/i;
const PER_CITY = 10;

// Light fields to shortlist thousands of listings, then full fields for the shortlist.
const LIGHT = "id categoryName starRating address { city }";
const FIELDS = `id title description link imageLink additionalImageLink categoryName starRating roomType beds bedrooms bedsDescription includedGuestsCount
  amenities freeCancellation freeInternet freeBreakfast proximityCity proximityAirport lastUpdated joinedStatus
  address { city streetAddress zipCode provinceState country latitude longitude }
  linkCode(pid: "${CJ.pid}") { clickUrl }`;

// The feed stores UTF-8 text decoded as Latin-1 ("MÃ©rida"); undo that.
function clean(value) {
  if (typeof value !== "string") return value ?? null;
  const fixed = /Ã|Â|â€/.test(value) ? Buffer.from(value, "latin1").toString("utf8") : value;
  return fixed.replace(/\s+/g, " ").trim() || null;
}
const yes = (value) => /^yes$/i.test(String(value || "").trim());
const list = (value) => [...new Set(String(clean(value) || "").split(/\s*,\s*/).filter(Boolean))];
const norm = (value) => String(clean(value) || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function fetchAll(feed, keywords) {
  const rows = [];
  for (let offset = 0; offset < 3000; offset += 1000) {
    const data = await cjQuery(`{ travelExperienceProducts(companyId: "${CJ.companyId}", adIds: ["${feed}"], keywords: ${JSON.stringify(keywords)}, offset: ${offset}, limit: 1000) { totalCount count resultList { ${LIGHT} } } }`);
    const page = data.travelExperienceProducts;
    rows.push(...page.resultList);
    if (offset + page.count >= page.totalCount || page.count < 1000) break;
  }
  return rows;
}

function score(row) {
  const stars = Number(row.starRating) || 0;
  let points = CATEGORY_WEIGHT[row.categoryName] || 0;
  if (row.categoryName === "Hotel") points += stars <= 2 ? 1 : 0;
  if (BUDGET_BRANDS.test(row.title)) points += 1.5;
  if (/shared|dorm|bunk|capsule|pod/i.test(row.roomType || "")) points += 1.5;
  if (yes(row.freeCancellation)) points += 1;
  if (yes(row.freeInternet)) points += 0.5;
  if (yes(row.freeBreakfast)) points += 1;
  points += Math.min(10, (row.additionalImageLink || []).length) / 10;
  return Math.round(points * 10) / 10;
}

function shape(row) {
  const click = row.linkCode?.clickUrl || null;
  const photos = [row.imageLink, ...(row.additionalImageLink || [])].filter((src) => /^https:\/\/[a-z0-9.-]*bstatic\.com\//i.test(src || ""));
  return {
    id: `cj-${row.id}`,
    sku: String(row.id),
    name: clean(row.title),
    category: row.categoryName,
    starRating: Number(row.starRating) || null,
    bookingUrl: String(row.link || "").split("?")[0],
    // Base of the feed's CJ click link; bookingPropertyUrl adds dates and party size.
    cjTrackingBaseUrl: click ? click.split("?")[0] : null,
    photos: [...new Set(photos)].slice(0, 8),
    roomTypes: list(row.roomType).slice(0, 8),
    dorms: /shared|dorm|bunk|capsule|pod/i.test(row.roomType || ""),
    beds: row.beds ?? null,
    bedrooms: row.bedrooms ?? null,
    bedsDescription: clean(row.bedsDescription),
    maxGuests: row.includedGuestsCount ?? null,
    amenities: list(row.amenities).slice(0, 16),
    freeCancellation: yes(row.freeCancellation),
    freeWifi: yes(row.freeInternet),
    freeBreakfast: yes(row.freeBreakfast),
    address: [clean(row.address?.streetAddress), clean(row.address?.city), clean(row.address?.provinceState), clean(row.address?.zipCode)].filter(Boolean).join(", ") || null,
    latitude: Number(row.address?.latitude) || null,
    longitude: Number(row.address?.longitude) || null,
    nearAirport: clean(row.proximityAirport),
    description: (clean(row.description) || "").slice(0, 320).replace(/\s\S*$/, "") || null,
    feedUpdated: row.lastUpdated ? String(row.lastUpdated).slice(0, 10) : null,
    budgetScore: score(row),
  };
}

const output = { source: "Booking.com product feeds via CJ (GlobTrek publisher account)", checkedAt: new Date().toISOString().slice(0, 10), note: "Listing data only: the feed has no prices or guest reviews.", stays: {} };
for (const target of TARGETS) {
  const keyword = target.keyword || target.city;
  target.airport = LAUNCH_AIRPORTS[target.id];
  const seen = new Map();
  for (const words of [`${keyword} hostel`, `${keyword} motel`, keyword]) {
    for (const row of await fetchAll(target.feed, words)) seen.set(row.id, row);
  }
  const cities = [target.city, ...(target.also || [])].map(norm);
  const inCity = [...seen.values()].filter((row) => cities.includes(norm(row.address?.city)));
  const budget = inCity.filter((row) => CATEGORY_WEIGHT[row.categoryName] && (Number(row.starRating) || 0) <= 3);
  // Shortlist on category alone (other fields make the search ~8× slower), spread
  // across categories so hostels, guest houses, motels and simple hotels all compete.
  const byCategory = Object.groupBy(budget, (row) => row.categoryName);
  const shortlist = Object.entries(byCategory).sort(([a], [b]) => CATEGORY_WEIGHT[b] - CATEGORY_WEIGHT[a]).flatMap(([category, rows]) => rows.slice(0, CATEGORY_WEIGHT[category] >= 3 ? 20 : 12)).slice(0, 50).map((row) => JSON.stringify(String(row.id)));
  const full = shortlist.length ? (await cjQuery(`{ travelExperienceProducts(companyId: "${CJ.companyId}", adIds: ["${target.feed}"], productIds: [${shortlist.join(",")}], limit: 50) { resultList { ${FIELDS} } } }`)).travelExperienceProducts.resultList : [];
  const ranked = full.filter((row) => row.joinedStatus !== false && row.linkCode?.clickUrl).map(shape).filter((stay) => stay.name && stay.bookingUrl.startsWith("https://www.booking.com/hotel/") && stay.photos.length).sort((a, b) => b.budgetScore - a.budgetScore);
  output.stays[target.id] = ranked.slice(0, PER_CITY);
  // Hand-verified hotels and the priced hostel get their feed photos and rooms too,
  // whatever their category (Strip resorts, for example).
  const pagePath = (url) => String(url || "").replace(/^https:\/\/www\.booking\.com\/hotel\//, "").replace(/(\.[a-z-]+)?\.html.*$/, "");
  const have = new Set(output.stays[target.id].map((stay) => pagePath(stay.bookingUrl)));
  const picks = [...(LAUNCH_DATA[target.id]?.hotels || []).map((hotel) => ({ name: hotel.name, path: pagePath(hotel.bookingUrl) })), ...(target.airport && CHEAP_STAYS[target.airport] ? [{ name: CHEAP_STAYS[target.airport].name, path: pagePath(`https://www.booking.com/hotel/${CHEAP_STAYS[target.airport].path}`) }] : [])];
  for (const pick of picks.filter((item) => !have.has(item.path))) {
    const rows = (await cjQuery(`{ travelExperienceProducts(companyId: "${CJ.companyId}", adIds: ["${target.feed}"], keywords: ${JSON.stringify(pick.name)}, limit: 40) { resultList { id link } } }`)).travelExperienceProducts.resultList;
    const match = rows.find((row) => pagePath(String(row.link || "").split("?")[0]) === pick.path);
    if (!match) continue;
    const [row] = (await cjQuery(`{ travelExperienceProducts(companyId: "${CJ.companyId}", adIds: ["${target.feed}"], productIds: ["${match.id}"], limit: 1) { resultList { ${FIELDS} } } }`)).travelExperienceProducts.resultList;
    if (row?.linkCode?.clickUrl) output.stays[target.id].push({ ...shape(row), verifiedPick: true });
  }
  const categories = budget.reduce((counts, row) => ({ ...counts, [row.categoryName]: (counts[row.categoryName] || 0) + 1 }), {});
  console.log(`${target.city}: ${seen.size} fetched, ${inCity.length} in city, ${budget.length} budget ${JSON.stringify(categories)} → ${output.stays[target.id].map((stay) => stay.name).slice(0, 4).join(" | ")}`);
}

await writeFile(new URL("../../app/data/feedStays.json", import.meta.url), `${JSON.stringify(output, null, 1)}\n`);
console.log(`Wrote ${Object.values(output.stays).flat().length} stays to app/data/feedStays.json`);

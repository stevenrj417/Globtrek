// Curate verified activities and restaurants per destination from Google Places.
//
// Usage: node scripts/activities/curate-places.mjs [--destinations id,id] [--force]
// Writes app/data/curatedPlaces.json. Only places Google lists as OPERATIONAL are
// kept, with their place ID, rating and review count as returned on the run date.
// Photos are not stored; the site fetches them per place at request time.
// Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in the environment or .env.local.
import { readFile, writeFile } from "node:fs/promises";

try {
  const text = await readFile(new URL("../../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {}

const { destinations } = await import("../../app/data/destinations.js");
const { LAUNCH_SET, launchActivities } = await import("../../app/data/launchSet.js");
const { GooglePlacesDiscoveryProvider } = await import("../../app/lib/google-places/GooglePlacesDiscoveryProvider.js");

const ACTIVITY_TYPES = new Set(["tourist_attraction", "museum", "art_gallery", "park", "national_park", "historical_landmark", "cultural_landmark", "beach", "hiking_area", "market", "ski_resort", "lake", "scenic_spot", "observation_deck", "church", "place_of_worship", "zoo", "aquarium", "botanical_garden"]);
const RESTAURANT_TYPES = new Set(["restaurant", "cafe", "bakery", "bar", "meal_takeaway"]);
const args = process.argv.slice(2);
const only = args.includes("--destinations") ? args[args.indexOf("--destinations") + 1].split(",") : null;
const force = args.includes("--force");
// --tiers: three restaurants at each Google price level (cheap, mid-range, fine
// dining) and activities split into free-to-enter sights and ticketed attractions.
const tiers = args.includes("--tiers");
// Free to walk into: parks, beaches, viewpoints, squares, markets, trails, lakes.
const FREE_TYPES = new Set(["park", "city_park", "beach", "hiking_area", "scenic_spot", "plaza", "market", "lake", "natural_feature"]);
// Usually need a ticket: museums, galleries, aquariums, zoos, castles, palaces, decks.
const TICKET_TYPES = new Set(["museum", "art_gallery", "aquarium", "zoo", "castle", "palace", "botanical_garden", "observation_deck", "amusement_park", "water_park", "national_park", "wildlife_park", "winery"]);
const DINING_TIERS = [
  { tier: "budget", query: "cheap eats, street food and casual local restaurants", levels: ["PRICE_LEVEL_INEXPENSIVE"] },
  { tier: "mid", query: "popular local restaurants", levels: ["PRICE_LEVEL_MODERATE"] },
  { tier: "high", query: "best fine dining restaurants", levels: ["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"] },
];
const standing = (item) => (item.rating || 0) * Math.log10(10 + (item.userRatingCount || 0));
const fileUrl = new URL("../../app/data/curatedPlaces.json", import.meta.url);
const file = JSON.parse(await readFile(fileUrl, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const provider = new GooglePlacesDiscoveryProvider();

const targets = destinations.filter((destination) => (only ? only.includes(destination.id) : (LAUNCH_SET.includes(destination.id) || ["curated_budget", "curated_mountain"].includes(destination.catalogStatus))));
// Keep places a traveler can actually visit near the destination: no tour
// operators, agencies or visitor centers, and nothing more than 40 km out.
const NOT_A_PLACE = /\b(tour agency|travel agency|visitor center|lodging|hotel|service|boat rental)\b/i;
const OPERATOR_NAME = /\b(operador|receptivo|tours?|agency|travel|charters?|excursions?|safaris)\b/i;
function km(a, b) {
  const rad = (value) => value * Math.PI / 180;
  const dLat = rad(b[0] - a[0]); const dLon = rad(b[1] - a[1]);
  return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2));
}
export function visitable(destination, item) {
  if (NOT_A_PLACE.test(item.category) || OPERATOR_NAME.test(item.name)) return false;
  if (!Number.isFinite(destination.latitude) || !Number.isFinite(item.latitude)) return true;
  return km([destination.latitude, destination.longitude], [item.latitude, item.longitude]) <= 40;
}
const place = (destination, item, kind) => ({
  id: `google:${item.id}`,
  googlePlaceId: item.id,
  destinationId: destination.id,
  name: item.displayName?.text?.trim(),
  category: (item.primaryType || item.types?.find((type) => !["point_of_interest", "establishment"].includes(type)) || kind).replaceAll("_", " "),
  location: item.formattedAddress || null,
  latitude: item.location?.latitude ?? null,
  longitude: item.location?.longitude ?? null,
  rating: item.rating ?? null,
  reviewCount: item.userRatingCount ?? null,
  priceLevel: item.priceLevel || null,
  googleMapsUrl: item.googleMapsUri || null,
  websiteUrl: item.websiteUri || null,
  businessStatus: item.businessStatus || "OPERATIONAL",
  provider: "google_places",
  verifiedAt: today,
});

// Launch cities whose catalog records predate coordinates, and search names for
// destinations whose catalog name is a region rather than a town.
const CENTERS = { HAN: [21.0285, 105.8542], BKK: [13.7563, 100.5018], LIS: [38.7223, -9.1393], MEX: [19.4326, -99.1332], "atacama-desert-34950": [-22.9087, -68.1997], "serengeti-national-park-7e380": [-2.4531, 34.8233],
  // Regions and parks: search from the town travelers base in, not the map centroid.
  "denali-national-park-76868": [63.7318, -148.9139], "sun-valley-76868": [43.6807, -114.3637], "westfjords-b3c92": [66.075, -23.135], "puglia-ad79e": [41.1171, 16.8719], "kruger-national-park-35fda": [-24.9948, 31.5925], "okavango-delta-180c8": [-19.9833, 23.4167], "simien-mountains-3d91f": [12.603, 37.4521], "hokkaido-fcf29": [43.0618, 141.3545], "borneo-rainforest-7c3c7": [5.8402, 118.1179], "kyrgyzstan-s-song-kol-lake-c7879": [42.2133, 75.7547], "tasmania-ceafb": [-42.8821, 147.3272], "viti-levu-bbb7e": [-17.7765, 177.4356], "savai-i-f5680": [-13.7347, -172.2036], "wild-atlantic-way-eb213": [53.2707, -9.0568] };
// Small islands and parks where few places reach 50 reviews.
const MIN_REVIEWS = { "hydra-4902a": 15, "st-barts-e3772": 15, "serengeti-national-park-7e380": 15, "sossusvlei-bfe79": 15, "bora-bora-40f39": 20, "denali-national-park-76868": 15, "sun-valley-76868": 20, "westfjords-b3c92": 15, "kruger-national-park-35fda": 20, "okavango-delta-180c8": 15, "simien-mountains-3d91f": 15, "borneo-rainforest-7c3c7": 20, "kyrgyzstan-s-song-kol-lake-c7879": 5, "viti-levu-bbb7e": 20, "savai-i-f5680": 10 };
const SEARCH_NAME = { FTE: "El Calafate", "dolomites-mtn": "Cortina d'Ampezzo", "kazbegi-mtn": "Stepantsminda", KEF: "Reykjavík", CHC: "Christchurch", NBO: "Nairobi", PPT: "Papeete", SJO: "San José", "serengeti-national-park-7e380": "Serengeti National Park", "atacama-desert-34950": "San Pedro de Atacama", "galapagos-islands-09f19": "Puerto Ayora", "sossusvlei-bfe79": "Sossusvlei", "denali-national-park-76868": "Denali National Park", "sun-valley-76868": "Ketchum", "westfjords-b3c92": "Ísafjörður", "puglia-ad79e": "Bari", "kruger-national-park-35fda": "Kruger National Park", "okavango-delta-180c8": "Maun", "simien-mountains-3d91f": "Gondar", "hokkaido-fcf29": "Sapporo", "borneo-rainforest-7c3c7": "Sandakan", "kyrgyzstan-s-song-kol-lake-c7879": "Kochkor", "tasmania-ceafb": "Hobart", "viti-levu-bbb7e": "Nadi", "savai-i-f5680": "Salelologa", "wild-atlantic-way-eb213": "Galway" };

// Batch 06 islands, parks and regions: the town visitors base in, by catalog city name.
const BASE_TOWNS = {
  "HAWAII ISLAND": ["Kailua-Kona", 19.6400, -155.9969], KAUAI: ["Kapaa", 22.0752, -159.3190], "OUTER BANKS": ["Nags Head", 35.9574, -75.6241], "CAPE COD": ["Hyannis", 41.6526, -70.2881],
  "LAKE TAHOE": ["South Lake Tahoe", 38.9332, -119.9844], "GRAND CANYON": ["Grand Canyon Village", 36.0544, -112.1401], YOSEMITE: ["Yosemite Valley", 37.7456, -119.5936], "JOSHUA TREE": ["Joshua Tree", 34.1347, -116.3131],
  "NAPA VALLEY": ["Napa", 38.2975, -122.2869], NGORONGORO: ["Karatu", -3.3389, 35.6717], "LAKE MALAWI": ["Cape Maclear", -14.0233, 34.8444], ETOSHA: ["Okaukuejo", -19.1797, 15.9228],
  "DEAD SEA": ["Sweimeh", 31.7190, 35.5890], "SACRED VALLEY": ["Urubamba", -13.3047, -72.1158], "PUNO AND LAKE TITICACA": ["Puno", -15.8402, -70.0219], "TAROKO GORGE": ["Hualien", 23.9769, 121.6044],
  "WHITSUNDAY ISLANDS": ["Airlie Beach", -20.2683, 148.7181], "ABEL TASMAN": ["Kaiteriteri", -41.0370, 173.0170], "BAY OF ISLANDS": ["Paihia", -35.2814, 174.0910], "BLUE MOUNTAINS": ["Katoomba", -33.7140, 150.3110],
  "KANGAROO ISLAND": ["Kingscote", -35.6560, 137.6390], DRAKENSBERG: ["Winterton", -28.8100, 29.5300], KRABI: ["Ao Nang", 8.0320, 98.8220], "GILI ISLANDS": ["Gili Trawangan", -8.3510, 116.0380],
  "RAJA AMPAT": ["Waisai", -0.4320, 130.8200], SIARGAO: ["General Luna", 9.7870, 126.1570], BOHOL: ["Panglao", 9.5790, 123.7440], LOMBOK: ["Senggigi", -8.4900, 116.0400], GOA: ["Panaji", 15.4909, 73.8278],
  OKINAWA: ["Naha", 26.2124, 127.6809], SAL: ["Santa Maria", 16.5990, -22.9050], DJERBA: ["Houmt Souk", 33.8750, 10.8570], "RÉUNION": ["Saint-Denis", -20.8820, 55.4500], "EASTER ISLAND": ["Hanga Roa", -27.1490, -109.4270],
  "PRINCE EDWARD ISLAND": ["Charlottetown", 46.2380, -63.1310], "GRAND CAYMAN": ["George Town", 19.2950, -81.3810], "TURKS AND CAICOS": ["Providenciales", 21.7740, -72.2650], "ST. LUCIA": ["Rodney Bay", 14.0758, -60.9500],
  ANTIGUA: ["St. John's", 17.1200, -61.8460], MARTINIQUE: ["Fort-de-France", 14.6037, -61.0742], GRENADA: ["St. George's", 12.0561, -61.7488], "RAS AL KHAIMAH": ["Ras Al Khaimah", 25.7895, 55.9432],
  "BANJUL AND THE GAMBIAN COAST": ["Kololi", 13.4490, -16.7200], ISHIGAKI: ["Ishigaki", 24.3400, 124.1560], "KOH SAMUI": ["Chaweng", 9.5300, 100.0600], "PHU QUOC": ["Duong Dong", 10.2170, 103.9600],
  LANGKAWI: ["Pantai Cenang", 6.2900, 99.7300], COZUMEL: ["San Miguel de Cozumel", 20.5080, -86.9480], "KOH TAO": ["Mae Haad", 10.0960, 99.8270], "NIAGARA FALLS": ["Niagara Falls", 43.0896, -79.0849],
};
for (const raw of targets) {
  const base = BASE_TOWNS[raw.city];
  if (base) SEARCH_NAME[raw.id] = base[0];
  const destination = CENTERS[raw.id] ? { ...raw, latitude: CENTERS[raw.id][0], longitude: CENTERS[raw.id][1] } : base ? { ...raw, latitude: base[1], longitude: base[2] } : raw;
  if (!force && file.places[destination.id]?.activities?.length >= 4) { console.log(`skip ${destination.id}`); continue; }
  const city = SEARCH_NAME[destination.id] || destination.city.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const query = async (textQuery, includedType, allowedTypes, limit) => {
    const results = await provider.searchNearby(destination, { textQuery, includedType, limit, allowedTypes });
    return results.filter((item) => (item.userRatingCount || 0) >= (MIN_REVIEWS[destination.id] || 50));
  };
  try {
    const activities = launchActivities(destination.id).length ? [] : (await query(`top attractions and things to do in ${city}, ${destination.country}`, "tourist_attraction", ACTIVITY_TYPES, 12)).sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0)).map((item) => place(destination, item, "attraction")).filter((item) => visitable(destination, item)).slice(0, 8);
    // Small places: a second, broader search for beaches, parks and viewpoints.
    if (activities.length < 4 && !launchActivities(destination.id).length) {
      const more = (await query(`beaches, parks, viewpoints and landmarks in ${city}, ${destination.country.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`, undefined, ACTIVITY_TYPES, 12)).map((item) => place(destination, item, "attraction")).filter((item) => visitable(destination, item) && !activities.some((existing) => existing.googlePlaceId === item.googlePlaceId));
      activities.push(...more.slice(0, 8 - activities.length));
    }
    const restaurants = (await query(`popular local restaurants in ${city}, ${destination.country}`, "restaurant", RESTAURANT_TYPES, 8)).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4).map((item) => place(destination, item, "restaurant"));
    if (tiers) {
      const seen = new Set();
      const unique = (items) => items.filter((item, index) => items.findIndex((other) => other.id === item.id) === index);
      const pickTier = (items, tier, kind, count = 3) => unique(items).filter((item) => !seen.has(item.id)).sort((a, b) => standing(b) - standing(a)).slice(0, count).map((item) => { seen.add(item.id); return { ...place(destination, item, kind), tier }; });
      const near = (item) => visitable(destination, place(destination, item, "attraction"));
      const sights = [...await query(`parks, beaches, viewpoints, markets and squares in ${city}, ${destination.country}`, undefined, FREE_TYPES, 12), ...await query(`top attractions and things to do in ${city}, ${destination.country}`, "tourist_attraction", ACTIVITY_TYPES, 12)].filter(near);
      const ticketed = (await query(`museums, galleries and ticketed attractions in ${city}, ${destination.country}`, undefined, TICKET_TYPES, 12)).filter(near);
      // Judge by Google's primary type first: a memorial park is a park, even if it also counts as a landmark.
      const isFree = (item) => FREE_TYPES.has(item.primaryType) || (!TICKET_TYPES.has(item.primaryType) && (item.types || []).some((type) => FREE_TYPES.has(type)));
      const isTicketed = (item) => !isFree(item) && (TICKET_TYPES.has(item.primaryType) || (item.types || []).some((type) => TICKET_TYPES.has(type)));
      const free = pickTier(sights.filter(isFree), "free", "attraction");
      const paid = pickTier([...ticketed, ...sights].filter(isTicketed), "ticketed", "attraction");
      const tiered = [...free, ...paid];
      // The rest of the most-reviewed sights follow, so readers that ignore tiers still get a full list.
      const rest = activities.filter((item) => !tiered.some((entry) => entry.googlePlaceId === item.googlePlaceId));
      const dining = [];
      for (const level of DINING_TIERS) {
        const found = (await provider.searchNearby(destination, { textQuery: `${level.query} in ${city}, ${destination.country}`, includedType: "restaurant", limit: 10, allowedTypes: RESTAURANT_TYPES, priceLevels: level.levels }))
          .filter((item) => (item.userRatingCount || 0) >= Math.min(50, MIN_REVIEWS[destination.id] || 50) && level.levels.includes(item.priceLevel));
        dining.push(...pickTier(found, level.tier, "restaurant"));
      }
      // Too few priced restaurants on Google (small places): keep the plain list, tiered by price level where Google has one.
      const levelTier = { PRICE_LEVEL_INEXPENSIVE: "budget", PRICE_LEVEL_MODERATE: "mid", PRICE_LEVEL_EXPENSIVE: "high", PRICE_LEVEL_VERY_EXPENSIVE: "high" };
      const fallback = restaurants.filter((item) => !seen.has(item.googlePlaceId)).map((item) => ({ ...item, tier: levelTier[item.priceLevel] || null }));
      file.places[destination.id] = { activities: [...tiered, ...rest].slice(0, 12), restaurants: dining.length >= 3 ? dining : [...dining, ...fallback].slice(0, 9), checkedAt: today, tiered: true };
      console.log(`${destination.id.padEnd(26)} free ${free.length}, ticketed ${paid.length}, dining ${["budget", "mid", "high"].map((tier) => dining.filter((item) => item.tier === tier).length).join("/")}`);
      continue;
    }
    file.places[destination.id] = { activities, restaurants, checkedAt: today };
    console.log(`${destination.id.padEnd(26)} ${activities.length} activities, ${restaurants.length} restaurants`);
  } catch (error) {
    console.log(`${destination.id.padEnd(26)} failed: ${error instanceof Error ? error.message : "unknown"}`);
  }
}
file.checkedAt = today;
await writeFile(fileUrl, `${JSON.stringify(file, null, 1)}\n`);
// The browser only needs how many activities each destination has.
const counts = Object.fromEntries(Object.entries(file.places).map(([id, entry]) => [id, entry.activities?.length || 0]));
await writeFile(new URL("../../app/data/curatedPlaceCounts.json", import.meta.url), `${JSON.stringify({ checkedAt: file.checkedAt, activities: counts })}\n`);

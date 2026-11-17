// Towns that search guides cover but the destination catalog doesn't. Each one
// gets its own Booking.com stays from the CJ feed (scripts/guides/import-town-stays.mjs),
// NASA POWER weather and a Wikimedia Commons photo (scripts/guides/fetch-town-data.mjs).
//
//   feedCities  the city names Booking.com files the town's stays under
//   costs       "town" or "city": which GlobTrek US cost profile food, activities
//               and local transport come from (see COST_TWINS)
//   parent      the catalog destination the town belongs to, if there is one
export const GUIDE_TOWNS = {
  "seaside-or": { name: "Seaside", state: "Oregon", latitude: 45.9932, longitude: -123.9226, airport: "PDX", feedCities: ["Seaside", "Gearhart"], wiki: "Seaside, Oregon", costs: "town", parent: "oregon-coast-76868" },
  "cannon-beach-or": { name: "Cannon Beach", state: "Oregon", latitude: 45.8918, longitude: -123.9615, airport: "PDX", feedCities: ["Cannon Beach", "Tolovana Park"], wiki: "Cannon Beach, Oregon", costs: "town", parent: "oregon-coast-76868" },
  "astoria-or": { name: "Astoria", state: "Oregon", latitude: 46.1879, longitude: -123.8313, airport: "PDX", feedCities: ["Astoria", "Warrenton"], wiki: "Astoria, Oregon", costs: "town", parent: "oregon-coast-76868" },
  "pacific-city-or": { name: "Pacific City", state: "Oregon", latitude: 45.2023, longitude: -123.9626, airport: "PDX", feedCities: ["Pacific City", "Cloverdale", "Neskowin"], wiki: "Pacific City, Oregon", costs: "town", parent: "oregon-coast-76868" },
  "florence-or": { name: "Florence", state: "Oregon", latitude: 43.9826, longitude: -124.0998, airport: "EUG", feedCities: ["Florence"], wiki: "Florence, Oregon", costs: "town", parent: "oregon-coast-76868" },
  "bandon-or": { name: "Bandon", state: "Oregon", latitude: 43.119, longitude: -124.4084, airport: "OTH", feedCities: ["Bandon"], wiki: "Bandon, Oregon", costs: "town", parent: "oregon-coast-76868" },
  "hood-river-or": { name: "Hood River", state: "Oregon", latitude: 45.7054, longitude: -121.5215, airport: "PDX", feedCities: ["Hood River"], wiki: "Hood River, Oregon", costs: "town" },
  "bend-or": { name: "Bend", state: "Oregon", latitude: 44.0582, longitude: -121.3153, airport: "RDM", feedCities: ["Bend"], wiki: "Bend, Oregon", costs: "city" },
  "sisters-or": { name: "Sisters", state: "Oregon", latitude: 44.291, longitude: -121.5492, airport: "RDM", feedCities: ["Sisters"], wiki: "Sisters, Oregon", costs: "town" },
  "ashland-or": { name: "Ashland", state: "Oregon", latitude: 42.1946, longitude: -122.7095, airport: "MFR", feedCities: ["Ashland"], wiki: "Ashland, Oregon", costs: "town" },
  "joseph-or": { name: "Joseph", state: "Oregon", latitude: 45.3543, longitude: -117.2296, airport: "PDX", feedCities: ["Joseph", "Enterprise"], wiki: "Joseph, Oregon", costs: "town" },
  "crater-lake-or": { name: "Crater Lake", state: "Oregon", latitude: 42.9446, longitude: -122.109, airport: "MFR", feedCities: ["Prospect", "Fort Klamath", "Diamond Lake", "Chiloquin", "Crater Lake"], wiki: "Crater Lake", costs: "town" },
  "leavenworth-wa": { name: "Leavenworth", state: "Washington", latitude: 47.5962, longitude: -120.6615, airport: "EAT", feedCities: ["Leavenworth"], wiki: "Leavenworth, Washington", costs: "town" },
  "lake-tahoe": { name: "Lake Tahoe", state: "California and Nevada", latitude: 38.9399, longitude: -119.9772, airport: "RNO", feedCities: ["South Lake Tahoe", "Stateline", "Tahoe City", "Kings Beach", "Incline Village", "Zephyr Cove", "Tahoe Vista"], wiki: "Lake Tahoe", costs: "town" },
  "boise-id": { name: "Boise", state: "Idaho", latitude: 43.615, longitude: -116.2023, airport: "BOI", feedCities: ["Boise"], wiki: "Boise, Idaho", costs: "city" },
  "denver-co": { name: "Denver", state: "Colorado", latitude: 39.7392, longitude: -104.9903, airport: "DEN", feedCities: ["Denver"], wiki: "Denver", costs: "city" },
};

// Food, activities and local transport come from an existing GlobTrek US
// estimate: small towns and parks all model the same, as do mid-size US cities.
export const COST_TWINS = { town: "oregon-coast-76868", city: "portland-76868" };
export const COST_TWIN_LABEL = { town: "small US towns and parks", city: "mid-size US cities" };

// The master list's general US lodging band (shared by 14 US places).
export const US_BAND_SOURCE = "seattle-76868";

// Photos for guides about a town inside a bigger catalog destination, so each
// guide shows its own place (guide.photo → Wikipedia page).
export const GUIDE_PHOTOS = {
  "lincoln-city": "Lincoln City, Oregon",
  "newport-or": "Newport, Oregon",
};

export const townId = (key) => `town:${key}`;

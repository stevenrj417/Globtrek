// Search-led guides (/guides/[slug]). Each one answers one search phrase with
// real data only: Booking.com stays from the CJ feed, verified Google Places
// dinners and things to do, and GlobTrek's cost models. The page is built in
// app/lib/guides/buildGuide.js; a guide without 4 matching stays isn't published.
//
// kind:
//   weekend   "weekend in X": 2 nights, Saturday and Sunday plan
//   budget    "X on a budget": 4 nights, a day-by-day plan
//   hotels    "cheap hotels in/near X": stays first, 2-night plan
//   feature   "X hotels with Y": only stays with evidence of Y
//   list      ranked places from the catalog (month, climate, region or fares)
//   versus    two places side by side
//
// area: hotels within radiusKm of a landmark, or in one feed town (town).

const AREA = {
  amsterdamCentral: { name: "Amsterdam Centraal", latitude: 52.3791, longitude: 4.9003, radiusKm: 1.5 },
  alfama: { name: "Alfama", latitude: 38.7118, longitude: -9.13, radiusKm: 1.4 },
  laRambla: { name: "La Rambla", latitude: 41.3809, longitude: 2.1734, radiusKm: 1.2 },
  termini: { name: "Roma Termini", latitude: 41.901, longitude: 12.5016, radiusKm: 1.2 },
  pragueOldTown: { name: "Old Town Square", latitude: 50.0875, longitude: 14.4213, radiusKm: 1.2 },
  kingsCross: { name: "King's Cross", latitude: 51.5308, longitude: -0.1238, radiusKm: 1.8 },
  romaNorte: { name: "Roma Norte", latitude: 19.417, longitude: -99.16, radiusKm: 1.3 },
  shinjuku: { name: "Shinjuku Station", latitude: 35.6896, longitude: 139.7006, radiusKm: 1.5 },
  unionSquare: { name: "Union Square", latitude: 37.788, longitude: -122.4075, radiusKm: 1.2 },
  frenchQuarter: { name: "the French Quarter", latitude: 29.9584, longitude: -90.0644, radiusKm: 1.5 },
  timesSquare: { name: "Times Square", latitude: 40.758, longitude: -73.9855, radiusKm: 1.5 },
  eiffelTower: { name: "the Eiffel Tower", latitude: 48.8584, longitude: 2.2945, radiusKm: 1.8 },
  downtownPortland: { name: "downtown Portland", latitude: 45.5189, longitude: -122.6794, radiusKm: 1.5 },
  pdx: { name: "PDX airport", latitude: 45.5898, longitude: -122.5951, radiusKm: 6 },
};

// City centers for older catalog records that have no coordinates.
export const GUIDE_CENTERS = {
  LIS: { latitude: 38.7223, longitude: -9.1393 },
  MEX: { latitude: 19.4326, longitude: -99.1332 },
  EZE: { latitude: -34.6037, longitude: -58.3816 },
  BKK: { latitude: 13.7563, longitude: 100.5018 },
  HAN: { latitude: 21.0285, longitude: 105.8542 },
};

export const GUIDES = [
  // Oregon coast and the Pacific Northwest
  { slug: "weekend-in-lincoln-city-oregon", phrase: "weekend in lincoln city oregon", title: "Weekend in Lincoln City, Oregon", kind: "weekend", destinationId: "oregon-coast-76868", place: "Lincoln City", area: { name: "Lincoln City", town: "Lincoln City", latitude: 44.9582, longitude: -124.0179 } },
  { slug: "cheap-oceanfront-hotels-lincoln-city", phrase: "cheap oceanfront hotels lincoln city", title: "Cheap oceanfront hotels in Lincoln City", kind: "feature", feature: "oceanfront", destinationId: "oregon-coast-76868", place: "Lincoln City", area: { name: "Lincoln City", town: "Lincoln City", latitude: 44.9582, longitude: -124.0179 } },
  { slug: "weekend-in-newport-oregon", phrase: "weekend in newport oregon", title: "Weekend in Newport, Oregon", kind: "weekend", destinationId: "oregon-coast-76868", place: "Newport", area: { name: "Newport", town: "Newport", latitude: 44.6368, longitude: -124.0535 } },
  { slug: "newport-oregon-hotels-on-a-budget", phrase: "newport oregon hotels on a budget", title: "Newport, Oregon hotels on a budget", kind: "hotels", destinationId: "oregon-coast-76868", place: "Newport", area: { name: "Newport", town: "Newport", latitude: 44.6368, longitude: -124.0535 } },
  { slug: "romantic-weekend-oregon-coast-on-a-budget", phrase: "romantic weekend oregon coast on a budget", title: "Romantic weekend on the Oregon coast on a budget", kind: "weekend", feature: "romantic", destinationId: "oregon-coast-76868", place: "the Oregon coast", area: { name: "the central Oregon coast", latitude: 44.8, longitude: -124.06, radiusKm: 35 } },
  { slug: "weekend-in-portland-on-a-budget", phrase: "weekend in portland on a budget", title: "Weekend in Portland on a budget", kind: "weekend", destinationId: "portland-76868", place: "Portland" },
  { slug: "cheap-hotels-downtown-portland", phrase: "cheap hotels downtown portland", title: "Cheap hotels in downtown Portland", kind: "hotels", destinationId: "portland-76868", place: "downtown Portland", area: AREA.downtownPortland },
  { slug: "cheap-hotels-near-pdx-airport", phrase: "cheap hotels near pdx airport", title: "Cheap hotels near PDX airport", kind: "hotels", destinationId: "portland-76868", place: "PDX airport", area: AREA.pdx },
  { slug: "weekend-in-seattle-on-a-budget", phrase: "weekend in seattle on a budget", title: "Weekend in Seattle on a budget", kind: "weekend", destinationId: "seattle-76868", place: "Seattle" },
  { slug: "weekend-in-victoria-bc", phrase: "weekend in victoria bc", title: "Weekend in Victoria, BC", kind: "weekend", destinationId: "victoria-cd6a7", place: "Victoria" },
  { slug: "weekend-in-vancouver-bc-on-a-budget", phrase: "weekend in vancouver bc on a budget", title: "Weekend in Vancouver, BC on a budget", kind: "weekend", destinationId: "YVR", place: "Vancouver" },
  { slug: "cheap-weekend-getaways-from-portland", phrase: "cheap weekend getaways from portland", title: "Cheap weekend getaways from Portland", kind: "list", list: { near: { name: "Portland", latitude: 45.5152, longitude: -122.6784, maxKm: 500 }, exclude: ["portland-76868"], nights: 2 } },

  // Near a landmark
  { slug: "weekend-in-amsterdam-near-central-station", phrase: "weekend in amsterdam near central station", title: "Weekend in Amsterdam near Central Station", kind: "weekend", destinationId: "amsterdam-fb61c", place: "Amsterdam", area: AREA.amsterdamCentral },
  { slug: "cheap-hotels-amsterdam-near-central-station", phrase: "cheap hotels amsterdam near central station", title: "Cheap hotels in Amsterdam near Central Station", kind: "hotels", destinationId: "amsterdam-fb61c", place: "Amsterdam", area: AREA.amsterdamCentral },
  { slug: "cheap-hotels-lisbon-alfama", phrase: "cheap hotels lisbon alfama", title: "Cheap hotels in Lisbon's Alfama", kind: "hotels", destinationId: "LIS", place: "Lisbon", area: AREA.alfama },
  { slug: "cheap-hotels-barcelona-near-la-rambla", phrase: "cheap hotels barcelona near la rambla", title: "Cheap hotels in Barcelona near La Rambla", kind: "hotels", destinationId: "BCN", place: "Barcelona", area: AREA.laRambla },
  { slug: "cheap-hotels-rome-near-termini", phrase: "cheap hotels rome near termini", title: "Cheap hotels in Rome near Termini", kind: "hotels", destinationId: "FCO", place: "Rome", area: AREA.termini },
  { slug: "cheap-hotels-prague-old-town", phrase: "cheap hotels prague old town", title: "Cheap hotels in Prague's Old Town", kind: "hotels", destinationId: "prague-1fef4", place: "Prague", area: AREA.pragueOldTown },
  { slug: "cheap-hotels-london-near-kings-cross", phrase: "cheap hotels london near kings cross", title: "Cheap hotels in London near King's Cross", kind: "hotels", destinationId: "LHR", place: "London", area: AREA.kingsCross },
  { slug: "cheap-hotels-mexico-city-roma-norte", phrase: "cheap hotels mexico city roma norte", title: "Cheap hotels in Mexico City's Roma Norte", kind: "hotels", destinationId: "MEX", place: "Mexico City", area: AREA.romaNorte },
  { slug: "cheap-hotels-tokyo-near-shinjuku-station", phrase: "cheap hotels tokyo near shinjuku station", title: "Cheap hotels in Tokyo near Shinjuku Station", kind: "hotels", destinationId: "HND", place: "Tokyo", area: AREA.shinjuku },
  { slug: "cheap-hotels-san-francisco-near-union-square", phrase: "cheap hotels san francisco near union square", title: "Cheap hotels in San Francisco near Union Square", kind: "hotels", destinationId: "san-francisco-76868", place: "San Francisco", area: AREA.unionSquare },
  { slug: "cheap-hotels-new-orleans-near-french-quarter", phrase: "cheap hotels new orleans near french quarter", title: "Cheap hotels in New Orleans near the French Quarter", kind: "hotels", destinationId: "new-orleans-76868", place: "New Orleans", area: AREA.frenchQuarter },
  { slug: "cheap-hotels-nyc-near-times-square", phrase: "cheap hotels nyc near times square", title: "Cheap hotels in NYC near Times Square", kind: "hotels", destinationId: "JFK", place: "New York City", area: AREA.timesSquare },
  { slug: "cheap-hotels-paris-near-eiffel-tower", phrase: "cheap hotels paris near eiffel tower", title: "Cheap hotels in Paris near the Eiffel Tower", kind: "hotels", destinationId: "CDG", place: "Paris", area: AREA.eiffelTower },
  { slug: "cheap-hotels-las-vegas-off-the-strip", phrase: "cheap hotels las vegas off the strip", title: "Cheap hotels in Las Vegas off the Strip", kind: "hotels", feature: "offStrip", destinationId: "las-vegas-76868", place: "Las Vegas" },

  // Weekends in US and Canadian cities
  { slug: "weekend-in-san-francisco-on-a-budget", phrase: "weekend in san francisco on a budget", title: "Weekend in San Francisco on a budget", kind: "weekend", destinationId: "san-francisco-76868", place: "San Francisco" },
  { slug: "weekend-in-san-diego-on-a-budget", phrase: "weekend in san diego on a budget", title: "Weekend in San Diego on a budget", kind: "weekend", destinationId: "san-diego-76868", place: "San Diego" },
  { slug: "weekend-in-las-vegas-on-a-budget", phrase: "weekend in las vegas on a budget", title: "Weekend in Las Vegas on a budget", kind: "weekend", destinationId: "las-vegas-76868", place: "Las Vegas" },
  { slug: "weekend-in-palm-springs-on-a-budget", phrase: "weekend in palm springs on a budget", title: "Weekend in Palm Springs on a budget", kind: "weekend", destinationId: "palm-springs-76868", place: "Palm Springs" },
  { slug: "weekend-in-nashville-on-a-budget", phrase: "weekend in nashville on a budget", title: "Weekend in Nashville on a budget", kind: "weekend", destinationId: "nashville-76868", place: "Nashville" },
  { slug: "weekend-in-new-orleans-on-a-budget", phrase: "weekend in new orleans on a budget", title: "Weekend in New Orleans on a budget", kind: "weekend", destinationId: "new-orleans-76868", place: "New Orleans" },
  { slug: "weekend-in-chicago-on-a-budget", phrase: "weekend in chicago on a budget", title: "Weekend in Chicago on a budget", kind: "weekend", destinationId: "chicago-76868", place: "Chicago" },
  { slug: "weekend-in-austin-on-a-budget", phrase: "weekend in austin on a budget", title: "Weekend in Austin on a budget", kind: "weekend", destinationId: "austin-76868", place: "Austin" },
  { slug: "weekend-in-savannah-on-a-budget", phrase: "weekend in savannah on a budget", title: "Weekend in Savannah on a budget", kind: "weekend", destinationId: "savannah-76868", place: "Savannah" },
  { slug: "cheap-weekend-in-new-york-city", phrase: "cheap weekend in new york city", title: "Cheap weekend in New York City", kind: "weekend", destinationId: "JFK", place: "New York City" },
  { slug: "weekend-in-sedona-on-a-budget", phrase: "weekend in sedona on a budget", title: "Weekend in Sedona on a budget", kind: "weekend", destinationId: "sedona-76868", place: "Sedona" },
  { slug: "honolulu-on-a-budget", phrase: "honolulu on a budget", title: "Honolulu on a budget", kind: "budget", destinationId: "honolulu-76868", place: "Honolulu" },

  // Europe
  { slug: "weekend-in-lisbon-on-a-budget", phrase: "weekend in lisbon on a budget", title: "Weekend in Lisbon on a budget", kind: "weekend", destinationId: "LIS", place: "Lisbon" },
  { slug: "weekend-in-barcelona-on-a-budget", phrase: "weekend in barcelona on a budget", title: "Weekend in Barcelona on a budget", kind: "weekend", destinationId: "BCN", place: "Barcelona" },
  { slug: "weekend-in-rome-on-a-budget", phrase: "weekend in rome on a budget", title: "Weekend in Rome on a budget", kind: "weekend", destinationId: "FCO", place: "Rome" },
  { slug: "weekend-in-paris-on-a-budget", phrase: "weekend in paris on a budget", title: "Weekend in Paris on a budget", kind: "weekend", destinationId: "CDG", place: "Paris" },
  { slug: "weekend-in-prague-on-a-budget", phrase: "weekend in prague on a budget", title: "Weekend in Prague on a budget", kind: "weekend", destinationId: "prague-1fef4", place: "Prague" },
  { slug: "weekend-in-vienna-on-a-budget", phrase: "weekend in vienna on a budget", title: "Weekend in Vienna on a budget", kind: "weekend", destinationId: "vienna-59390", place: "Vienna" },
  { slug: "weekend-in-edinburgh-on-a-budget", phrase: "weekend in edinburgh on a budget", title: "Weekend in Edinburgh on a budget", kind: "weekend", destinationId: "edinburgh-97691", place: "Edinburgh" },
  { slug: "amsterdam-on-a-budget", phrase: "amsterdam on a budget", title: "Amsterdam on a budget", kind: "budget", destinationId: "amsterdam-fb61c", place: "Amsterdam" },
  { slug: "porto-on-a-budget", phrase: "porto on a budget", title: "Porto on a budget", kind: "budget", destinationId: "porto-a4951", place: "Porto" },
  { slug: "budapest-on-a-budget", phrase: "budapest on a budget", title: "Budapest on a budget", kind: "budget", destinationId: "budapest-f14e4", place: "Budapest" },
  { slug: "krakow-on-a-budget", phrase: "krakow on a budget", title: "Kraków on a budget", kind: "budget", destinationId: "krakow-5ff03", place: "Kraków" },
  { slug: "dublin-on-a-budget", phrase: "dublin on a budget", title: "Dublin on a budget", kind: "budget", destinationId: "dublin-eb213", place: "Dublin" },
  { slug: "lisbon-vs-porto-for-budget-travel", phrase: "lisbon vs porto for budget travel", title: "Lisbon vs Porto for budget travel", kind: "versus", versus: ["LIS", "porto-a4951"] },

  // Latin America, Asia and Africa
  { slug: "mexico-city-on-a-budget", phrase: "mexico city on a budget", title: "Mexico City on a budget", kind: "budget", destinationId: "MEX", place: "Mexico City" },
  { slug: "cancun-on-a-budget", phrase: "cancun on a budget", title: "Cancún on a budget", kind: "budget", destinationId: "cancun-41937", place: "Cancún" },
  { slug: "puerto-vallarta-on-a-budget", phrase: "puerto vallarta on a budget", title: "Puerto Vallarta on a budget", kind: "budget", destinationId: "puerto-vallarta-41937", place: "Puerto Vallarta" },
  { slug: "medellin-on-a-budget", phrase: "medellin on a budget", title: "Medellín on a budget", kind: "budget", destinationId: "medellin-2f737", place: "Medellín" },
  { slug: "buenos-aires-on-a-budget", phrase: "buenos aires on a budget", title: "Buenos Aires on a budget", kind: "budget", destinationId: "EZE", place: "Buenos Aires" },
  { slug: "tokyo-on-a-budget", phrase: "tokyo on a budget", title: "Tokyo on a budget", kind: "budget", destinationId: "HND", place: "Tokyo" },
  { slug: "kyoto-on-a-budget", phrase: "kyoto on a budget", title: "Kyoto on a budget", kind: "budget", destinationId: "KIX", place: "Kyoto" },
  { slug: "bangkok-on-a-budget", phrase: "bangkok on a budget", title: "Bangkok on a budget", kind: "budget", destinationId: "BKK", place: "Bangkok" },
  { slug: "bali-on-a-budget", phrase: "bali on a budget", title: "Bali on a budget", kind: "budget", destinationId: "DPS", place: "Bali" },
  { slug: "hanoi-on-a-budget", phrase: "hanoi on a budget", title: "Hanoi on a budget", kind: "budget", destinationId: "HAN", place: "Hanoi" },
  { slug: "cape-town-on-a-budget", phrase: "cape town on a budget", title: "Cape Town on a budget", kind: "budget", destinationId: "CPT", place: "Cape Town" },
  { slug: "marrakech-on-a-budget", phrase: "marrakech on a budget", title: "Marrakech on a budget", kind: "budget", destinationId: "RAK", place: "Marrakech" },

  // Lists built from the catalog
  { slug: "cheapest-places-to-travel-in-december", phrase: "cheapest places to travel in december", title: "Cheapest places to travel in December", kind: "list", list: { month: 12 } },
  { slug: "cheapest-places-to-travel-in-january", phrase: "cheapest places to travel in january", title: "Cheapest places to travel in January", kind: "list", list: { month: 1 } },
  { slug: "cheapest-places-to-travel-in-february", phrase: "cheapest places to travel in february", title: "Cheapest places to travel in February", kind: "list", list: { month: 2 } },
  { slug: "cheapest-places-to-travel-in-march", phrase: "cheapest places to travel in march", title: "Cheapest places to travel in March", kind: "list", list: { month: 3 } },
  { slug: "cheapest-places-to-travel-in-april", phrase: "cheapest places to travel in april", title: "Cheapest places to travel in April", kind: "list", list: { month: 4 } },
  { slug: "cheap-warm-places-to-go-in-winter", phrase: "cheap warm places to go in winter", title: "Cheap warm places to go in winter", kind: "list", list: { warmWinter: true } },
  { slug: "cheapest-european-cities-to-visit", phrase: "cheapest european cities to visit", title: "Cheapest European cities to visit", kind: "list", list: { continent: "Europe", city: true } },
  { slug: "best-budget-cities-in-europe-for-first-timers", phrase: "best budget cities in europe for first timers", title: "Best budget cities in Europe for first-timers", kind: "list", list: { continent: "Europe", city: true, minKnownness: 75 } },
  { slug: "cheapest-beach-vacations-in-the-us", phrase: "cheapest beach vacations in the us", title: "Cheapest beach vacations in the US", kind: "list", list: { country: "United States", beach: true } },
  { slug: "cheap-international-trips-from-the-west-coast", phrase: "cheap international trips from the west coast", title: "Cheap international trips from the West Coast", kind: "list", list: { fromWestCoast: true } },
];

// Searches from the first-100 list that have no page, and why.
export const SKIPPED_GUIDES = [
  ["weekend in cannon beach", "No hotel data for Cannon Beach yet"],
  ["cannon beach hotels with hot tub", "No hotel data for Cannon Beach yet"],
  ["cheap hotels in cannon beach", "No hotel data for Cannon Beach yet"],
  ["dog friendly hotels cannon beach", "No hotel data for Cannon Beach yet"],
  ["weekend in seaside oregon", "No hotel data for Seaside yet"],
  ["cheap hotels seaside oregon", "No hotel data for Seaside yet"],
  ["weekend in astoria oregon", "No hotel data for Astoria yet"],
  ["astoria hotels with river view", "No hotel data for Astoria yet"],
  ["weekend in pacific city oregon", "No hotel data for Pacific City yet"],
  ["depoe bay hotels with ocean view", "Only 2 Depoe Bay stays show an ocean view"],
  ["weekend in florence oregon", "No hotel data for Florence, Oregon yet"],
  ["weekend in bandon oregon", "No hotel data for Bandon yet"],
  ["weekend in hood river", "No hotel data for Hood River yet"],
  ["hood river hotels near downtown", "No hotel data for Hood River yet"],
  ["weekend in bend oregon", "No hotel data for Bend yet"],
  ["cheap hotels in bend oregon", "No hotel data for Bend yet"],
  ["weekend in sisters oregon", "No hotel data for Sisters yet"],
  ["weekend in ashland oregon", "No hotel data for Ashland yet"],
  ["weekend in joseph oregon", "No hotel data for Joseph yet"],
  ["where to stay near crater lake", "No hotel data for Crater Lake yet"],
  ["weekend in leavenworth wa", "No hotel data for Leavenworth yet"],
  ["cheap hotels in leavenworth wa", "No hotel data for Leavenworth yet"],
  ["cheapest oregon coast towns to stay", "No per-town hotel prices to rank towns honestly"],
  ["best oregon coast hotels under $150", "No per-hotel prices to check the $150 cap"],
  ["cheap weekend in lake tahoe", "No hotel data for Lake Tahoe yet"],
  ["weekend in boise idaho", "No hotel data for Boise yet"],
  ["weekend in denver on a budget", "No hotel data for Denver yet"],
];

export function guideBySlug(slug) {
  return GUIDES.find((guide) => guide.slug === slug) || null;
}

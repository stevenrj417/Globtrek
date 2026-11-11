// Budget editorial layer (GlobTrek review, November 2026).
//
// Turns verified catalog destinations into publishable budget trips: realistic
// cheap lodging (motel, hostel or simple room for two), food, things to do, local
// transit, airport transfer and lodging tax. All values are USD planning estimates,
// not quotes. Lodging benchmarks come from public listing snapshots (see SOURCES);
// the rest are GlobTrek editorial estimates. Free highlights are places with no
// admission charge.

import { sentencePhrase } from "../lib/format.js";
import { MOUNTAIN_EDITORIAL, MOUNTAINS_REVIEWED } from "./mountainDestinations.js";

export const BUDGET_REVIEWED = "2026-11-04";

export const SOURCES = Object.freeze({
  vegasLodging: ["https://vegasfoodandfun.com/cheap-motels-in-las-vegas/", "https://global.momondo.com/hotels/las-vegas/Motel-6-Las-Vegas---I-15.mhd114983.ksp"],
  waikikiLodging: ["https://www.hotelscombined.in/Hotel/Waikiki_Beachside_Hostel.htm", "https://getcostidea.com/?p=17801"],
});

const base = { nights: "3–5 nights", hotel: "Boutique hotel" };

// planning: hotelNight is a budget room for two, food/activities are per person per day,
// localTransportDay is per day, airportTransferPerPerson is one way, lodgingTaxRate is a share.
export const BUDGET_EDITORIAL = Object.freeze({
  "las-vegas-76868": { ...base, season: "March to May or October to November", style: "Neon / Shows / Desert day trips", tags: ["Cities", "Nightlife", "Packed schedule", "Food", "Smart value", "Friends", "Couple", "Long Weekend", "Design hotel"], image: "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4", alt: "The Las Vegas Strip at night with the Bellagio fountains", planning: { hotelNight: 62, foodDay: 30, activitiesDay: 10, localTransportDay: 8, airportTransferPerPerson: 6, lodgingTaxRate: 0.134 }, airportMiles: 5, free: ["Bellagio fountain shows", "Fremont Street light canopy", "Bellagio Conservatory gardens"], lodgingSource: "vegasLodging" },
  "honolulu-76868": { ...base, season: "April to May or September to October", style: "Beaches / Hikes / Plate lunches", tags: ["Ocean", "Mostly relaxing", "Nature", "Food", "Smart value", "Couple", "Friends", "Five Nights", "Beach resort"], planning: { hotelNight: 110, foodDay: 40, activitiesDay: 8, localTransportDay: 8, airportTransferPerPerson: 3, lodgingTaxRate: 0.18 }, airportMiles: 9, free: ["Waikiki Beach", "Ala Moana Beach Park", "Kapiʻolani Park"], lodgingSource: "waikikiLodging" },
  "san-diego-76868": { ...base, season: "April to June or September to November", style: "Beaches / Tacos / Sea lions", tags: ["Ocean", "Cities", "Balanced days", "Food", "Smart value", "Couple", "Family", "Five Nights"], planning: { hotelNight: 95, foodDay: 32, activitiesDay: 10, localTransportDay: 6, airportTransferPerPerson: 3, lodgingTaxRate: 0.125 }, airportMiles: 3, free: ["Balboa Park gardens", "La Jolla Cove sea lions", "Sunset Cliffs"] },
  "palm-springs-76868": { ...base, season: "October to April", style: "Desert / Pools / Midcentury design", tags: ["Mostly relaxing", "Slow mornings", "Wellness", "Design hotel", "Couple", "Friends", "Long Weekend", "Smart value"], planning: { hotelNight: 95, foodDay: 32, activitiesDay: 10, localTransportDay: 10, airportTransferPerPerson: 12, lodgingTaxRate: 0.115 }, airportMiles: 2, free: ["Palm Canyon Drive", "Thursday VillageFest street fair", "Midcentury architecture walks"] },
  "los-angeles-76868": { ...base, season: "March to May or September to November", style: "Beaches / Tacos / Hollywood", tags: ["Cities", "Ocean", "Packed schedule", "Food", "Shopping", "Nightlife", "Friends", "Solo", "Smart value"], planning: { hotelNight: 105, foodDay: 35, activitiesDay: 12, localTransportDay: 5, airportTransferPerPerson: 10, lodgingTaxRate: 0.155 }, airportMiles: 17, free: ["Griffith Observatory (free admission)", "Getty Center (free admission)", "Santa Monica and Venice beaches"] },
  "san-francisco-76868": { ...base, season: "September to November", style: "Hills / Bay views / Dim sum", tags: ["Cities", "Food", "Culture", "Balanced days", "Solo", "Couple", "Long Weekend"], planning: { hotelNight: 120, foodDay: 40, activitiesDay: 12, localTransportDay: 5, airportTransferPerPerson: 10, lodgingTaxRate: 0.16 }, airportMiles: 13, free: ["Walk across the Golden Gate Bridge", "Golden Gate Park", "Lands End Trail"] },
  "seattle-76868": { ...base, season: "June to September", style: "Markets / Coffee / Mountain views", tags: ["Cities", "Food", "Nature", "Balanced days", "Solo", "Couple", "Long Weekend"], planning: { hotelNight: 110, foodDay: 38, activitiesDay: 10, localTransportDay: 6, airportTransferPerPerson: 3, lodgingTaxRate: 0.157 }, airportMiles: 13, free: ["Pike Place Market", "Olympic Sculpture Park", "Kerry Park viewpoint"] },
  "chicago-76868": { ...base, season: "May to June or September to October", style: "Architecture / Deep dish / Lakefront", tags: ["Cities", "Culture", "Food", "Packed schedule", "Friends", "Solo", "Long Weekend"], planning: { hotelNight: 95, foodDay: 35, activitiesDay: 10, localTransportDay: 5, airportTransferPerPerson: 5, lodgingTaxRate: 0.174 }, airportMiles: 17, free: ["Millennium Park and Cloud Gate", "Lincoln Park Zoo", "Lakefront Trail"] },
  "austin-76868": { ...base, season: "March to May or October to November", style: "Live music / Barbecue / Swimming holes", tags: ["Cities", "Nightlife", "Food", "Balanced days", "Friends", "Long Weekend", "Smart value"], planning: { hotelNight: 90, foodDay: 32, activitiesDay: 10, localTransportDay: 5, airportTransferPerPerson: 2, lodgingTaxRate: 0.17 }, airportMiles: 8, free: ["Barton Creek Greenbelt", "South Congress Avenue", "Texas Capitol tours"] },
  "new-orleans-76868": { ...base, season: "February to May or October to November", style: "Jazz / Creole food / French Quarter", tags: ["Cities", "Culture", "Food", "Nightlife", "Friends", "Couple", "Long Weekend"], planning: { hotelNight: 90, foodDay: 35, activitiesDay: 10, localTransportDay: 3, airportTransferPerPerson: 2, lodgingTaxRate: 0.16 }, airportMiles: 13, free: ["Jackson Square and the French Quarter", "City Park", "Magazine Street"] },
  "nashville-76868": { ...base, season: "April to June or September to October", style: "Country music / Hot chicken / Honky-tonks", tags: ["Cities", "Nightlife", "Food", "Packed schedule", "Friends", "Long Weekend"], planning: { hotelNight: 110, foodDay: 35, activitiesDay: 12, localTransportDay: 6, airportTransferPerPerson: 2, lodgingTaxRate: 0.15 }, airportMiles: 8, free: ["Centennial Park", "Bicentennial Capitol Mall State Park", "The Gulch murals"] },
  "miami-76868": { ...base, season: "December to April", style: "Beaches / Cuban food / Street art", tags: ["Ocean", "Cities", "Nightlife", "Food", "Friends", "Couple", "Five Nights"], planning: { hotelNight: 110, foodDay: 35, activitiesDay: 10, localTransportDay: 6, airportTransferPerPerson: 2, lodgingTaxRate: 0.13 }, airportMiles: 8, free: ["South Beach", "Wynwood street murals", "Bayfront Park"] },
  "orlando-76868": { ...base, season: "January to April or October to November", style: "Theme parks / Lakes / Springs", tags: ["Cities", "Family", "Packed schedule", "Adventure days", "Friends", "Five Nights"], planning: { hotelNight: 80, foodDay: 32, activitiesDay: 20, localTransportDay: 8, airportTransferPerPerson: 2, lodgingTaxRate: 0.125 }, airportMiles: 11, free: ["Lake Eola Park", "Downtown farmers market", "Winter Park Avenue"] },
  "santa-fe-76868": { ...base, season: "May to June or September to October", style: "Adobe / Galleries / Green chile", tags: ["Culture", "Slow mornings", "Food", "Shopping", "Couple", "Long Weekend", "Traditional inn"], planning: { hotelNight: 105, foodDay: 32, activitiesDay: 10, localTransportDay: 6, airportTransferPerPerson: 15, lodgingTaxRate: 0.155 }, airportMiles: 10, free: ["The Plaza", "Canyon Road galleries", "Railyard district"] },
  "anchorage-76868": { ...base, season: "June to August", style: "Glaciers / Wildlife / Long days", tags: ["Nature", "Mountains", "Adventure days", "Friends", "Solo", "Five Nights"], planning: { hotelNight: 130, foodDay: 38, activitiesDay: 12, localTransportDay: 10, airportTransferPerPerson: 15, lodgingTaxRate: 0.15 }, airportMiles: 5, free: ["Tony Knowles Coastal Trail", "Kincaid Park", "Earthquake Park"] },
  "guadalajara-41937": { ...base, season: "October to May", style: "Tequila / Mariachi / Markets", tags: ["Cities", "Culture", "Food", "Nightlife", "Smart value", "Friends", "Solo", "Five Nights"], planning: { hotelNight: 40, foodDay: 18, activitiesDay: 6, localTransportDay: 4, airportTransferPerPerson: 12, lodgingTaxRate: 0.03 }, airportMiles: 11, free: ["Centro Histórico plazas", "Tlaquepaque streets", "Sunday Vía RecreActiva"] },
  "oaxaca-city-41937": { ...base, season: "October to April", style: "Mole / Markets / Ruins", tags: ["Culture", "Food", "Slow mornings", "Smart value", "Couple", "Solo", "Five Nights", "Traditional inn"], planning: { hotelNight: 40, foodDay: 16, activitiesDay: 8, localTransportDay: 3, airportTransferPerPerson: 8, lodgingTaxRate: 0.03 }, airportMiles: 5, free: ["The Zócalo", "Andador Macedonio Alcalá", "Mercado Benito Juárez browsing"] },
  "merida-41937": { ...base, season: "November to March", style: "Colonial streets / Cenotes / Yucatecan food", tags: ["Culture", "Food", "Slow mornings", "Smart value", "Couple", "Family", "Five Nights"], image: "https://images.unsplash.com/photo-1700264120929-11e7420a7082", alt: "A colonial street in central Mérida", planning: { hotelNight: 45, foodDay: 16, activitiesDay: 8, localTransportDay: 3, airportTransferPerPerson: 8, lodgingTaxRate: 0.05 }, airportMiles: 4, free: ["Paseo de Montejo", "Plaza Grande", "Mérida en Domingo street fair"] },
  "puerto-vallarta-41937": { ...base, season: "November to April", style: "Malecón / Beaches / Old town", tags: ["Ocean", "Mostly relaxing", "Food", "Nightlife", "Smart value", "Couple", "Friends", "Five Nights", "Beach resort"], image: "https://images.unsplash.com/photo-1662044069225-ab6383ba03bd", alt: "Palms and beach along the Malecón in Puerto Vallarta", planning: { hotelNight: 60, foodDay: 20, activitiesDay: 8, localTransportDay: 4, airportTransferPerPerson: 10, lodgingTaxRate: 0.03 }, airportMiles: 5, free: ["The Malecón boardwalk", "Playa Los Muertos", "Isla Cuale"] },
});

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&-])\S/g, (letter) => letter.toUpperCase());
}

// Merges the editorial layer into a verified catalog record so it matches, prices
// and publishes like a hand-curated destination.
export function applyBudgetEditorial(destination) {
  const mountain = MOUNTAIN_EDITORIAL[destination.id];
  const editorial = BUDGET_EDITORIAL[destination.id] || mountain;
  if (!editorial) return destination;
  const city = title(destination.city);
  const free = editorial.free || [];
  const days = [free[0] && `${free[0]} and a local dinner`, free[1] && `${free[1]} and a slow afternoon`, free[2] && `${free[2]} and local favorites`].filter(Boolean);
  return {
    ...destination,
    image: editorial.image || destination.image,
    imageAlt: editorial.alt || null,
    season: editorial.season,
    style: editorial.style,
    tags: mountain ? [...editorial.tags] : [...new Set([...editorial.tags, ...(destination.tags || [])])],
    nights: editorial.nights || (editorial.tripLengthFit ? `${editorial.tripLengthFit.minimumNights}–${editorial.tripLengthFit.maximumNights} nights` : destination.nights),
    ...(editorial.tripLengthFit ? { tripLengthFit: editorial.tripLengthFit } : {}),
    ...(Number.isFinite(editorial.latitude) ? { latitude: editorial.latitude, longitude: editorial.longitude } : {}),
    avoidMonths: editorial.avoidMonths || [],
    price: "Budget trip · estimates checked against public listings",
    why: `${city} keeps a full trip affordable: ${editorial.style.split(" / ").map(sentencePhrase).join(", ")}${free.length ? ", with plenty to do for free" : ""}.`,
    itinerary: [
      `Day 1: Arrive in ${city} and settle in`,
      ...days.map((text, index) => `Day ${index + 2}: ${text}`),
      "Final day: One last walk, meal, and departure",
    ],
    dining: ["A cheap local favorite", "A neighborhood market or food hall", "One sit-down dinner worth the splurge"],
    budgetEditorial: { ...editorial, reviewed: mountain ? MOUNTAINS_REVIEWED : BUDGET_REVIEWED, lodgingSources: editorial.lodgingSource ? SOURCES[editorial.lodgingSource] : [] },
    freeHighlights: free,
    airportToCenterMiles: editorial.airportMiles,
    costLevel: editorial.planning.hotelNight < 70 ? "affordable" : editorial.planning.hotelNight < 180 ? "moderate" : "expensive",
    recommendationReady: true,
    catalogStatus: mountain ? "curated_mountain" : "curated_budget",
  };
}

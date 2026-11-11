// Mountain destinations (GlobTrek review, November 2026).
//
// Twelve mountain trips across three price levels. Locations come from
// Wikipedia; hero images are Wikimedia Commons files with the license recorded.
// planning values are USD planning estimates, not quotes: hotelNight is a
// budget-to-midrange room for two, food and activities are per person per day,
// localTransportDay is per day, airportTransferPerPerson is one way. They are
// GlobTrek editorial estimates informed by the BudgetYourTrip pages listed in
// each entry's sources (traveler-reported spending and hotel-price averages),
// checked on MOUNTAINS_REVIEWED. avoidMonths are months when the trip is not
// recommended (monsoon, closed lifts and hotels, or closed roads).

export const MOUNTAINS_REVIEWED = "2026-11-11";

const BYT = "https://www.budgetyourtrip.com";
const commons = (path, file) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/1920px-${file}`;

// New catalog records (not in the verified batches).
export const MOUNTAIN_BASE = [
  { id: "zakopane-mtn", city: "ZAKOPANE", country: "POLAND", region: "Europe", airport: "KRK", recognition: 35, latitude: 49.3, longitude: 19.95, wiki: "https://en.wikipedia.org/wiki/Zakopane", image: commons("5/58", "Zakopane_T58.jpg"), license: { sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Zakopane_T58.jpg", author: "Jerzy Opioła", licenseName: "CC BY-SA 4.0" } },
  { id: "kazbegi-mtn", city: "KAZBEGI", country: "GEORGIA", region: "Europe", airport: "TBS", recognition: 25, latitude: 42.6575, longitude: 44.6453, wiki: "https://en.wikipedia.org/wiki/Stepantsminda", image: commons("a/a1", "View_of_Stepantsminda_09.23.jpg"), license: { sourcePageUrl: "https://commons.wikimedia.org/wiki/File:View_of_Stepantsminda_09.23.jpg", author: "Supanut Arunoprayote", licenseName: "CC BY 4.0" } },
  { id: "pokhara-mtn", city: "POKHARA", country: "NEPAL", region: "Asia", airport: "PKR", recognition: 55, latitude: 28.2083, longitude: 83.9889, wiki: "https://en.wikipedia.org/wiki/Pokhara", image: commons("9/9a", "Pokhara_Valley.jpg"), license: { sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Pokhara_Valley.jpg", author: "Utsab Raj Giri", licenseName: "CC BY-SA 4.0" } },
  { id: "bled-mtn", city: "BLED", country: "SLOVENIA", region: "Europe", airport: "LJU", recognition: 60, latitude: 46.3644, longitude: 14.0947, wiki: "https://en.wikipedia.org/wiki/Lake_Bled", image: commons("8/84", "Lake_Bled_from_the_Mountain.jpg"), license: { sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Lake_Bled_from_the_Mountain.jpg", author: "Canadianhockey91", licenseName: "CC BY-SA 3.0" } },
  { id: "dolomites-mtn", city: "CORTINA D'AMPEZZO", country: "ITALY", region: "Europe", airport: "VCE", recognition: 75, latitude: 46.5403, longitude: 12.1361, wiki: "https://en.wikipedia.org/wiki/Cortina_d%27Ampezzo", image: commons("3/36", "Faloria_Cortina_d%27Ampezzo_10.jpg"), license: { sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Faloria_Cortina_d%27Ampezzo_10.jpg", author: "kallerna", licenseName: "CC BY-SA 4.0" } },
].map((item) => ({
  id: item.id,
  name: `${item.city}, ${item.country}`,
  city: item.city,
  country: item.country,
  region: item.region,
  airport: item.airport,
  recognition: item.recognition,
  knownnessScore: item.recognition,
  latitude: item.latitude,
  longitude: item.longitude,
  image: item.image,
  imageLicenseMetadata: { imageUrl: item.image, sourceName: "Wikimedia Commons", ...item.license, verifiedAt: MOUNTAINS_REVIEWED },
  verificationSource: item.wiki,
  tags: [],
  style: "",
  season: "",
  nights: "3–7 nights",
  costs: [],
  itinerary: [],
  dining: [],
  destinationType: "town",
  catalogStatus: "curated_mountain",
}));

// Editorial layer for all twelve, keyed by catalog id.
export const MOUNTAIN_EDITORIAL = Object.freeze({
  "zakopane-mtn": { season: "June to September for hiking, or January to March for snow", avoidMonths: [4, 11], style: "Tatra peaks / Highlander food / Wooden villas", tags: ["Mountains", "Nature", "Food", "Culture", "Adventure days", "Balanced days", "Smart value", "Friends", "Couple", "Family", "Long Weekend", "Five Nights"], alt: "Zakopane's rooftops below the snowy Tatra Mountains", planning: { hotelNight: 55, foodDay: 28, activitiesDay: 12, localTransportDay: 6, airportTransferPerPerson: 15, lodgingTaxRate: 0.02 }, airportMiles: 62, tripLengthFit: { minimumNights: 3, maximumNights: 10 }, free: ["Krupówki Street", "Old Church and Pęksowy Brzyzek Cemetery", "Walk up Gubałówka hill"], sources: [`${BYT}/hotels/poland/zakopane-3080866`, `${BYT}/poland`] },
  "brasov-d6b89": { season: "May to September, or December for the Christmas market", avoidMonths: [], style: "Carpathian forests / Old town / Castles", tags: ["Mountains", "Culture", "Nature", "Food", "Balanced days", "Smart value", "Couple", "Friends", "Solo", "Long Weekend", "Five Nights"], alt: "Brașov's Council Square with Tâmpa Mountain behind", planning: { hotelNight: 50, foodDay: 30, activitiesDay: 12, localTransportDay: 5, airportTransferPerPerson: 10, lodgingTaxRate: 0.01 }, airportMiles: 9, tripLengthFit: { minimumNights: 3, maximumNights: 10 }, free: ["Council Square (Piața Sfatului)", "Rope Street (Strada Sforii)", "Hike up Tâmpa Mountain"], sources: [`${BYT}/romania/brasov`] },
  "kazbegi-mtn": { season: "June to September", avoidMonths: [1, 2], style: "Caucasus peaks / Mountain churches / Georgian feasts", tags: ["Mountains", "Nature", "Culture", "Food", "Adventure days", "Smart value", "Solo", "Friends", "Couple", "Long Weekend", "Five Nights"], alt: "Stepantsminda village beneath the Caucasus Mountains", planning: { hotelNight: 40, foodDay: 18, activitiesDay: 8, localTransportDay: 6, airportTransferPerPerson: 34, lodgingTaxRate: 0 }, airportMiles: 95, tripLengthFit: { minimumNights: 3, maximumNights: 7 }, free: ["Hike to Gergeti Trinity Church", "Gveleti Waterfall trail", "Stepantsminda village"], sources: [`${BYT}/georgia`, `${BYT}/georgia/tbilisi`] },
  "pokhara-mtn": { season: "October to November or March to April", avoidMonths: [6, 7, 8], style: "Himalaya views / Lakeside / Short treks", tags: ["Mountains", "Nature", "Wellness", "Adventure days", "Slow mornings", "Mostly relaxing", "Smart value", "Solo", "Couple", "Friends", "Five Nights", "One Week"], alt: "Pokhara and Phewa Lake beneath the Annapurna range", planning: { hotelNight: 30, foodDay: 12, activitiesDay: 8, localTransportDay: 4, airportTransferPerPerson: 5, lodgingTaxRate: 0.13 }, airportMiles: 2, tripLengthFit: { minimumNights: 4, maximumNights: 14 }, free: ["Phewa Lake lakeside promenade", "Hike to the World Peace Pagoda", "Old Bazaar"], sources: [`${BYT}/nepal/pokhara`] },
  "bled-mtn": { season: "May to September", avoidMonths: [], style: "Alpine lake / Julian Alps / Cream cake", tags: ["Mountains", "Nature", "Wellness", "Slow mornings", "Balanced days", "Couple", "Family", "Long Weekend", "Five Nights"], alt: "Lake Bled and its island church seen from the hills", planning: { hotelNight: 101, foodDay: 55, activitiesDay: 20, localTransportDay: 12, airportTransferPerPerson: 15, lodgingTaxRate: 0.03 }, airportMiles: 22, tripLengthFit: { minimumNights: 2, maximumNights: 7 }, free: ["Walk around Lake Bled", "Ojstrica viewpoint hike", "Mala Osojnica viewpoint"], sources: [`${BYT}/slovenia/bled`] },
  "innsbruck-59390": { season: "June to September for hiking, or December to March for skiing", avoidMonths: [], style: "Alpine city / Cable cars / Old town", tags: ["Mountains", "Cities", "Nature", "Culture", "Food", "Balanced days", "Adventure days", "Couple", "Friends", "Solo", "Long Weekend", "Five Nights"], alt: "Colorful houses in Innsbruck with the Alps behind", planning: { hotelNight: 161, foodDay: 70, activitiesDay: 25, localTransportDay: 10, airportTransferPerPerson: 5, lodgingTaxRate: 0.03 }, airportMiles: 2, tripLengthFit: { minimumNights: 2, maximumNights: 7 }, free: ["Old Town and the Golden Roof", "Inn River promenade", "Hofgarten park"], sources: [`${BYT}/austria/innsbruck`] },
  "dolomites-mtn": { season: "Late June to September, or mid-December to March for skiing", avoidMonths: [4, 5, 10, 11], style: "Dolomite peaks / Rifugio lunches / Via ferrata", tags: ["Mountains", "Nature", "Wellness", "Food", "Adventure days", "Balanced days", "Couple", "Friends", "Five Nights", "One Week"], alt: "Cortina d'Ampezzo in its valley ringed by Dolomite peaks", planning: { hotelNight: 142, foodDay: 60, activitiesDay: 25, localTransportDay: 12, airportTransferPerPerson: 35, lodgingTaxRate: 0.04 }, airportMiles: 100, tripLengthFit: { minimumNights: 3, maximumNights: 10 }, free: ["Corso Italia", "Walk to Lago Ghedina", "Olympic ice stadium area"], sources: [`${BYT}/hotels/italy/cortina-d039ampezzo-p66506`, `${BYT}/italy/trieste`] },
  "chamonix-e3772": { season: "June to September, or December to April for skiing", avoidMonths: [5, 11], style: "Mont Blanc / Glaciers / Alpine trails", tags: ["Mountains", "Nature", "Adventure days", "Packed schedule", "Food", "Friends", "Couple", "Solo", "Five Nights", "One Week"], alt: "The Chamonix valley below the Mont Blanc massif", planning: { hotelNight: 208, foodDay: 70, activitiesDay: 60, localTransportDay: 12, airportTransferPerPerson: 40, lodgingTaxRate: 0.03 }, airportMiles: 55, tripLengthFit: { minimumNights: 3, maximumNights: 10 }, free: ["Lac des Gaillands", "Chamonix town center", "Petit Balcon Sud trail"], sources: [`${BYT}/france/chamonix-mont-blanc`] },
  YYC: { latitude: 51.1784, longitude: -115.5708, season: "June to September, or December to March for skiing", avoidMonths: [], style: "Rockies / Turquoise lakes / Wildlife", tags: ["Mountains", "Nature", "Adventure days", "Wellness", "Family", "Friends", "Couple", "Five Nights", "One Week"], alt: "Snow-capped peaks above a turquoise lake in Banff National Park", planning: { hotelNight: 161, foodDay: 48, activitiesDay: 25, localTransportDay: 15, airportTransferPerPerson: 54, lodgingTaxRate: 0.09 }, airportMiles: 90, tripLengthFit: { minimumNights: 3, maximumNights: 10 }, free: [], sources: [`${BYT}/canada/banff`] },
  "zermatt-77dcd": { season: "July to September, or December to April for skiing", avoidMonths: [5, 11], style: "Matterhorn / Car-free village / Glacier trains", tags: ["Mountains", "Nature", "Wellness", "Adventure days", "Couple", "Friends", "Long Weekend", "Five Nights"], alt: "Zermatt village at dusk with the Matterhorn above", planning: { hotelNight: 244, foodDay: 90, activitiesDay: 50, localTransportDay: 20, airportTransferPerPerson: 90, lodgingTaxRate: 0.03 }, airportMiles: 145, tripLengthFit: { minimumNights: 2, maximumNights: 7 }, free: ["Matterhorn view from the Kirchbrücke", "Hinterdorf old quarter", "Zermatt village walk"], sources: [`${BYT}/switzerland/zermatt`] },
  "aspen-76868": { season: "June to September, or December to March for skiing", avoidMonths: [5, 11], style: "Rockies / Ski town / Galleries", tags: ["Mountains", "Nature", "Wellness", "Shopping", "Food", "Adventure days", "Couple", "Friends", "Long Weekend", "Five Nights"], alt: "Downtown Aspen with the mountains behind", planning: { hotelNight: 339, foodDay: 120, activitiesDay: 50, localTransportDay: 15, airportTransferPerPerson: 5, lodgingTaxRate: 0.11 }, airportMiles: 3, tripLengthFit: { minimumNights: 2, maximumNights: 7 }, free: ["Aspen Art Museum (free admission)", "John Denver Sanctuary", "Rio Grande Trail"], sources: [`${BYT}/united-states-of-america/aspen`] },
  FTE: { latitude: -50.3379, longitude: -72.2648, season: "November to March", avoidMonths: [5, 6, 7, 8, 9], style: "Glaciers / Granite towers / Big skies", tags: ["Mountains", "Nature", "Adventure days", "Packed schedule", "Friends", "Couple", "Solo", "One Week", "Ten Days"], alt: "Granite peaks and glacial water in Patagonia", planning: { hotelNight: 71, foodDay: 25, activitiesDay: 40, localTransportDay: 8, airportTransferPerPerson: 10, lodgingTaxRate: 0 }, airportMiles: 14, tripLengthFit: { minimumNights: 5, maximumNights: 14 }, free: ["Lago Argentino lakeshore walk", "Avenida del Libertador in El Calafate"], sources: [`${BYT}/argentina/el-calafate`] },
});

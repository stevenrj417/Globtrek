// Seed records for the master-list destinations that aren't on GlobTrek yet
// (outcomes with no destinationId in app/data/destinationOutcomes.json).
//   node scripts/destinations/build-seed-batch-05.mjs
//   node scripts/destinations/verify-wikimedia.mjs scripts/destinations/seed-batch-05.json scripts/destinations/verified-batch-05.json --delay 400
//
// Editorial choices per place, made by hand on 2026-11-15:
//   wiki      Wikipedia article that identifies the place (coordinates + Commons hero photo)
//   airport   the airport most travelers fly into (a gateway when the nearest strip has
//             few flights), checked against app/data/airports.json
//   known     knownness 0–100 on GlobTrek's scale (low = hidden gem)
//   tags      quiz interest tags from the existing vocabulary
//   who       traveler types
// Cost level comes from the workbook's typical three-star hotel price.
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const ALL = ["couple", "friends", "solo", "family"];
const ADULT = ["couple", "friends", "solo"];
const PLACES = {
  "GT-0001": { wiki: "Oregon Coast", airport: "PDX", known: 55, tags: ["coast", "nature", "food"], who: ALL },
  "GT-0007": { wiki: "Denali National Park and Preserve", airport: "FAI", known: 70, tags: ["nature", "mountains", "wildlife", "hiking"], who: ALL },
  "GT-0009": { wiki: "Zion National Park", airport: "LAS", known: 85, tags: ["nature", "hiking", "mountains", "adventure"], who: ALL },
  "GT-0010": { wiki: "Rocky Mountain National Park", airport: "DEN", known: 75, tags: ["nature", "hiking", "mountains", "wildlife"], who: ALL },
  "GT-0011": { wiki: "Yellowstone National Park", airport: "BZN", known: 92, tags: ["nature", "wildlife", "hiking"], who: ALL },
  "GT-0012": { wiki: "Glacier National Park (U.S.)", airport: "FCA", known: 78, tags: ["nature", "hiking", "mountains", "lakes"], who: ALL },
  "GT-0019": { wiki: "Acadia National Park", airport: "BGR", known: 65, tags: ["nature", "coast", "hiking"], who: ALL },
  "GT-0022": { wiki: "Asheville, North Carolina", airport: "AVL", known: 55, tags: ["food", "mountains", "art", "music"], who: ADULT },
  "GT-0023": { wiki: "Mackinac Island", airport: "PLN", known: 40, tags: ["history", "nature", "family"], who: ALL },
  "GT-0024": { wiki: "Philadelphia", airport: "PHL", known: 80, tags: ["history", "food", "culture", "city"], who: ALL },
  "GT-0026": { wiki: "Sun Valley, Idaho", airport: "SUN", known: 35, tags: ["mountains", "winter", "hiking", "luxury"], who: ALL },
  "GT-0029": { wiki: "Tofino", airport: "YVR", known: 40, tags: ["coast", "nature", "adventure", "wellness"], who: ADULT },
  "GT-0031": { wiki: "Jasper National Park", airport: "YEG", known: 60, tags: ["nature", "mountains", "wildlife", "hiking"], who: ALL },
  "GT-0035": { wiki: "Fogo Island, Newfoundland and Labrador", airport: "YQX", known: 15, tags: ["nature", "coast", "design", "luxury"], who: ["couple", "solo"] },
  "GT-0036": { wiki: "Gros Morne National Park", airport: "YDF", known: 25, tags: ["nature", "hiking", "coast"], who: ALL },
  "GT-0042": { wiki: "Isla Holbox", airport: "CUN", known: 45, tags: ["beaches", "wildlife", "relaxation"], who: ADULT },
  "GT-0043": { wiki: "Guanajuato (city)", airport: "BJX", known: 40, tags: ["culture", "architecture", "history", "art"], who: ADULT },
  "GT-0044": { wiki: "Copper Canyon", airport: "CUU", known: 35, tags: ["nature", "adventure", "hiking"], who: ADULT },
  "GT-0045": { wiki: "Bacalar", airport: "CTM", known: 35, tags: ["lakes", "water", "relaxation", "nature"], who: ADULT },
  "GT-0046": { wiki: "Todos Santos, Baja California Sur", airport: "SJD", known: 30, tags: ["beaches", "art", "food"], who: ADULT },
  "GT-0048": { wiki: "Lake Atitlán", airport: "GUA", known: 50, tags: ["lakes", "culture", "nature", "hiking"], who: ADULT },
  "GT-0049": { wiki: "Tikal", airport: "FRS", known: 60, tags: ["history", "nature", "wildlife"], who: ALL },
  "GT-0050": { wiki: "Caye Caulker", airport: "BZE", known: 45, tags: ["beaches", "diving", "relaxation"], who: ADULT },
  "GT-0051": { wiki: "San Ignacio, Belize", airport: "BZE", known: 25, tags: ["adventure", "history", "nature"], who: ALL },
  "GT-0052": { wiki: "Arenal Volcano", airport: "SJO", known: 70, tags: ["nature", "adventure", "wellness"], who: ALL },
  "GT-0053": { wiki: "Monteverde", airport: "SJO", known: 60, tags: ["nature", "wildlife", "hiking"], who: ALL },
  "GT-0054": { wiki: "Osa Peninsula", airport: "SJO", known: 30, tags: ["wildlife", "nature", "beaches", "adventure"], who: ADULT },
  "GT-0056": { wiki: "Bocas del Toro Archipelago", airport: "BOC", known: 45, tags: ["beaches", "diving", "nightlife"], who: ADULT },
  "GT-0058": { wiki: "Trinidad, Cuba", airport: "HAV", known: 40, tags: ["history", "culture", "music", "architecture"], who: ADULT },
  "GT-0060": { wiki: "Vieques, Puerto Rico", airport: "SJU", known: 35, tags: ["beaches", "nature", "relaxation"], who: ALL },
  "GT-0062": { wiki: "Samaná Peninsula", airport: "AZS", known: 35, tags: ["beaches", "nature"], who: ALL },
  "GT-0063": { wiki: "Kingston, Jamaica", airport: "KIN", known: 50, tags: ["music", "culture", "food"], who: ADULT },
  "GT-0064": { wiki: "Port Antonio", airport: "KIN", known: 25, tags: ["beaches", "nature", "relaxation"], who: ADULT },
  "GT-0066": { wiki: "Dominica", airport: "DOM", known: 25, tags: ["nature", "hiking", "diving", "adventure"], who: ADULT },
  "GT-0069": { wiki: "Salento, Quindío", airport: "PEI", known: 45, tags: ["nature", "hiking", "food"], who: ADULT },
  "GT-0072": { wiki: "Cuenca, Ecuador", airport: "CUE", known: 45, tags: ["architecture", "culture", "history"], who: ALL },
  "GT-0075": { wiki: "Machu Picchu", airport: "CUZ", known: 95, tags: ["history", "hiking", "mountains"], who: ALL },
  "GT-0081": { wiki: "Torres del Paine National Park", airport: "PUQ", known: 70, tags: ["hiking", "mountains", "nature", "adventure"], who: ADULT },
  "GT-0085": { wiki: "El Chaltén", airport: "FTE", known: 45, tags: ["hiking", "mountains", "adventure"], who: ADULT },
  "GT-0086": { wiki: "Iguazu Falls", airport: "IGR", known: 85, tags: ["nature", "water", "adventure"], who: ALL },
  "GT-0090": { wiki: "Lençóis Maranhenses National Park", airport: "SLZ", known: 35, tags: ["nature", "desert", "adventure", "photography"], who: ADULT },
  "GT-0092": { wiki: "José Ignacio, Uruguay", airport: "MVD", known: 25, tags: ["beaches", "luxury", "food"], who: ["couple", "friends"] },
  "GT-0093": { wiki: "Paramaribo", airport: "PBM", known: 15, tags: ["culture", "architecture", "food", "history"], who: ADULT },
  "GT-0094": { wiki: "Kaieteur Falls", airport: "GEO", known: 15, tags: ["nature", "adventure", "water"], who: ADULT },
  "GT-0100": { wiki: "Cliffs of Moher", airport: "SNN", known: 65, tags: ["coast", "nature", "food", "music"], who: ALL },
  "GT-0103": { wiki: "Riquewihr", airport: "SXB", known: 45, tags: ["wine", "food", "architecture"], who: ["couple", "friends"] },
  "GT-0110": { wiki: "Black Forest", airport: "BSL", known: 65, tags: ["nature", "hiking", "food"], who: ALL },
  "GT-0114": { wiki: "Faroe Islands", airport: "FAE", known: 45, tags: ["nature", "hiking", "photography"], who: ADULT },
  "GT-0116": { wiki: "Westfjords", airport: "KEF", known: 25, tags: ["nature", "hiking", "photography"], who: ADULT },
  "GT-0120": { wiki: "Vilnius", airport: "VNO", known: 45, tags: ["architecture", "culture", "food"], who: ADULT },
  "GT-0122": { wiki: "Kraków", airport: "KRK", known: 80, tags: ["history", "architecture", "food", "nightlife"], who: ADULT },
  "GT-0123": { wiki: "Wrocław", airport: "WRO", known: 45, tags: ["architecture", "culture", "nightlife"], who: ADULT },
  "GT-0133": { wiki: "Mostar", airport: "SJJ", known: 50, tags: ["history", "architecture", "culture"], who: ALL },
  "GT-0134": { wiki: "Berat", airport: "TIA", known: 25, tags: ["history", "architecture", "culture"], who: ADULT },
  "GT-0137": { wiki: "Naxos", airport: "JNX", known: 55, tags: ["beaches", "food", "history"], who: ALL },
  "GT-0141": { wiki: "Dolomites", airport: "VCE", known: 85, tags: ["mountains", "hiking", "winter", "nature"], who: ALL },
  "GT-0142": { wiki: "Apulia", airport: "BRI", known: 70, tags: ["beaches", "food", "architecture"], who: ALL },
  "GT-0150": { wiki: "Mallorca", airport: "PMI", known: 88, tags: ["beaches", "nightlife", "food", "hiking"], who: ALL },
  "GT-0158": { wiki: "Merzouga", airport: "RAK", known: 70, tags: ["desert", "adventure", "stargazing"], who: ADULT },
  "GT-0162": { wiki: "Knysna", airport: "GRJ", known: 55, tags: ["coast", "nature", "adventure"], who: ALL },
  "GT-0163": { wiki: "Kruger National Park", airport: "MQP", known: 85, tags: ["wildlife", "nature", "adventure"], who: ALL },
  "GT-0165": { wiki: "Okavango Delta", airport: "MUB", known: 70, tags: ["wildlife", "nature", "luxury", "adventure"], who: ["couple", "friends", "family"] },
  "GT-0169": { wiki: "Lamu Island", airport: "LAU", known: 25, tags: ["beaches", "culture", "history", "relaxation"], who: ADULT },
  "GT-0170": { wiki: "Bwindi Impenetrable National Park", airport: "EBB", known: 50, tags: ["wildlife", "hiking", "adventure"], who: ADULT },
  "GT-0172": { wiki: "Simien Mountains National Park", airport: "GDQ", known: 25, tags: ["mountains", "hiking", "wildlife"], who: ADULT },
  "GT-0174": { wiki: "São Tomé Island", airport: "TMS", known: 10, tags: ["beaches", "nature", "relaxation"], who: ADULT },
  "GT-0177": { wiki: "Naoshima", airport: "OKJ", known: 40, tags: ["art", "design", "coast"], who: ADULT },
  "GT-0178": { wiki: "Hokkaido", airport: "CTS", known: 75, tags: ["nature", "food", "winter", "hiking"], who: ALL },
  "GT-0183": { wiki: "Yangshuo County", airport: "KWL", known: 60, tags: ["nature", "hiking", "culture"], who: ALL },
  "GT-0186": { wiki: "Mã Pí Lèng Pass", airport: "HAN", known: 35, tags: ["adventure", "mountains", "culture"], who: ["friends", "solo"] },
  "GT-0187": { wiki: "Japanese Covered Bridge", airport: "DAD", known: 80, tags: ["culture", "food", "architecture", "beaches"], who: ALL },
  "GT-0190": { wiki: "Ko Lanta Yai", airport: "KBV", known: 50, tags: ["beaches", "diving", "relaxation"], who: ALL },
  "GT-0196": { wiki: "Danum Valley Conservation Area", airport: "BKI", known: 50, tags: ["wildlife", "nature", "adventure"], who: ADULT },
  "GT-0198": { wiki: "Komodo National Park", airport: "LBJ", known: 70, tags: ["wildlife", "diving", "beaches", "adventure"], who: ADULT },
  "GT-0199": { wiki: "Yogyakarta", airport: "YIA", known: 60, tags: ["culture", "history", "food"], who: ALL },
  "GT-0200": { wiki: "Manila", airport: "MNL", known: 70, tags: ["city", "food", "history", "nightlife"], who: ADULT },
  "GT-0202": { wiki: "Banaue Rice Terraces", airport: "MNL", known: 35, tags: ["hiking", "culture", "nature"], who: ADULT },
  "GT-0203": { wiki: "Kathmandu Valley", airport: "KTM", known: 75, tags: ["culture", "history", "hiking"], who: ADULT },
  "GT-0204": { wiki: "Thorong La", airport: "KTM", known: 65, tags: ["hiking", "mountains", "adventure"], who: ["friends", "solo"] },
  "GT-0205": { wiki: "Paro Taktsang", airport: "PBH", known: 60, tags: ["culture", "mountains", "hiking", "wellness"], who: ["couple", "solo"] },
  "GT-0207": { wiki: "Jaipur", airport: "JAI", known: 80, tags: ["culture", "history", "architecture", "food"], who: ALL },
  "GT-0208": { wiki: "Kerala backwaters", airport: "COK", known: 60, tags: ["nature", "relaxation", "food"], who: ALL },
  "GT-0209": { wiki: "Varanasi", airport: "VNS", known: 75, tags: ["culture", "history", "photography"], who: ADULT },
  "GT-0210": { wiki: "Sigiriya", airport: "CMB", known: 55, tags: ["history", "culture", "nature"], who: ALL },
  "GT-0212": { wiki: "Samarkand", airport: "SKD", known: 55, tags: ["history", "architecture", "culture"], who: ALL },
  "GT-0213": { wiki: "Almaty", airport: "ALA", known: 45, tags: ["mountains", "hiking", "city", "food"], who: ADULT },
  "GT-0214": { wiki: "Song-Köl", airport: "BSZ", known: 15, tags: ["nature", "adventure", "lakes"], who: ["friends", "solo"] },
  "GT-0217": { wiki: "Tiwi, Oman", airport: "MCT", known: 30, tags: ["nature", "water", "hiking", "adventure"], who: ADULT },
  "GT-0219": { wiki: "Wadi Rum", airport: "AQJ", known: 70, tags: ["desert", "adventure", "stargazing"], who: ADULT },
  "GT-0225": { wiki: "Great Barrier Reef", airport: "CNS", known: 92, tags: ["diving", "beaches", "nature", "wildlife"], who: ALL },
  "GT-0226": { wiki: "Tasmania", airport: "HBA", known: 60, tags: ["nature", "food", "hiking", "wildlife"], who: ALL },
  "GT-0227": { wiki: "Uluru", airport: "AYQ", known: 80, tags: ["desert", "culture", "nature"], who: ALL },
  "GT-0228": { wiki: "Rottnest Island", airport: "PER", known: 50, tags: ["beaches", "wildlife", "city"], who: ALL },
  "GT-0229": { wiki: "Auckland", airport: "AKL", known: 75, tags: ["city", "food", "coast"], who: ALL },
  "GT-0231": { wiki: "Fiordland National Park", airport: "ZQN", known: 70, tags: ["nature", "hiking", "mountains"], who: ALL },
  "GT-0232": { wiki: "Wellington", airport: "WLG", known: 55, tags: ["food", "culture", "city"], who: ADULT },
  "GT-0233": { wiki: "Rarotonga", airport: "RAR", known: 35, tags: ["beaches", "relaxation", "diving"], who: ALL },
  "GT-0234": { wiki: "Viti Levu", airport: "NAN", known: 60, tags: ["beaches", "relaxation", "diving"], who: ALL },
  "GT-0235": { wiki: "Savaiʻi", airport: "APW", known: 10, tags: ["beaches", "nature", "culture"], who: ADULT },
  "GT-0236": { wiki: "Espiritu Santo", airport: "SON", known: 15, tags: ["diving", "beaches", "nature"], who: ADULT },
  "GT-0237": { wiki: "Palau", airport: "ROR", known: 40, tags: ["diving", "beaches", "nature"], who: ADULT },
};

// Typical three-star hotel night (USD) → GlobTrek cost level.
const costLevel = (nightly) => (nightly <= 90 ? "affordable" : nightly <= 150 ? "moderate" : nightly <= 250 ? "upscale" : "luxury");

const outcomes = JSON.parse(readFileSync(new URL("app/data/destinationOutcomes.json", root), "utf8")).outcomes;
const guide = JSON.parse(readFileSync(new URL("app/data/lodgingPriceGuide.json", root), "utf8")).byOutcome;
const airports = new Map(JSON.parse(readFileSync(new URL("app/data/airports.json", root), "utf8")).map((airport) => [airport.code, airport]));
const pending = outcomes.filter((outcome) => !outcome.destinationId);
const problems = [];
for (const outcome of pending) if (!PLACES[outcome.outcomeId]) problems.push(`${outcome.outcomeId} ${outcome.exactMatch}: no editorial entry`);
for (const id of Object.keys(PLACES)) if (!pending.some((outcome) => outcome.outcomeId === id)) problems.push(`${id}: editorial entry but the outcome is linked to an existing destination`);
for (const [id, place] of Object.entries(PLACES)) if (!airports.get(place.airport)?.scheduled) problems.push(`${id}: ${place.airport} is not a scheduled airport`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

const seeds = pending.map((outcome) => {
  const place = PLACES[outcome.outcomeId];
  const threeStar = guide[outcome.outcomeId].find((row) => /three-star/i.test(row.option))?.averageNightly;
  return {
    outcomeId: outcome.outcomeId,
    exactMatch: outcome.exactMatch,
    name: outcome.destination,
    country: outcome.country,
    region: outcome.stateProvince || outcome.region,
    destinationType: outcome.destinationType,
    nearestAirport: place.airport,
    wikiTitle: place.wiki,
    interestTags: place.tags,
    knownnessScore: place.known,
    costLevel: costLevel(threeStar),
    travelerTypeTags: place.who,
    aliases: [outcome.destination, place.wiki].filter((value, index, list) => list.indexOf(value) === index),
    searchTerms: [outcome.destination, outcome.stateProvince, outcome.country].filter(Boolean),
  };
});
writeFileSync(new URL("scripts/destinations/seed-batch-05.json", root), `${JSON.stringify(seeds, null, 2)}\n`);
console.log(`${seeds.length} seeds written`);

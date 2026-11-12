import { destinations } from "../../data/destinations.js";
import { LAUNCH_SET } from "../../data/launchSet.js";
import { verifiedStays } from "../../data/launchStays.js";

// City names the feed uses that differ from GlobTrek's (feed spelling → destination).
const FEED_CITY_ALIASES = {
  "los-angeles-76868": ["Hollywood", "Santa Monica", "Venice"],
  "honolulu-76868": ["Waikiki"],
  "merida-41937": ["Merida"],
  KIX: ["Kyoto"],
  HND: ["Tokyo"],
  JFK: ["New York", "Brooklyn", "Manhattan"],
  NAP: ["Amalfi", "Positano", "Sorrento", "Praiano", "Ravello"],
  JTR: ["Fira", "Oia", "Imerovigli", "Kamari"],
  "chamonix-e3772": ["Chamonix-Mont-Blanc", "Chamonix Mont Blanc"],
  "kazbegi-mtn": ["Stepantsminda", "Kazbegi", "Gergeti"],
  "brasov-d6b89": ["Brasov", "Brașov"],
  "dolomites-mtn": ["Cortina d'Ampezzo", "Cortina dʼAmpezzo"],
  // Islands, regions and places the feed files under a town or local name.
  "sao-miguel-island-a4951": ["Ponta Delgada", "Furnas", "Ribeira Grande", "Vila Franca do Campo", "Lagoa"],
  "lofoten-98845": ["Svolvær", "Svolvaer", "Henningsvær", "Reine", "Leknes", "Kabelvåg", "Ballstad"],
  "jeju-island-04653": ["Jeju", "Seogwipo", "Jeju City", "Aewol"],
  "cartagena-2f737": ["Cartagena de Indias"],
  "paros-4902a": ["Parikia", "Naousa", "Paros"],
  "tbilisi-9113c": ["Tbilisi", "T'bilisi"],
  "yerevan-5f459": ["Yerevan"],
  "san-sebastian-20a8d": ["Donostia", "Donostia-San Sebastian", "San Sebastian"],
  "menorca-20a8d": ["Mahón", "Maó", "Ciutadella", "Ciutadella de Menorca", "Es Castell", "Fornells"],
  "isle-of-skye-97691": ["Portree", "Broadford", "Kyleakin", "Dunvegan", "Uig"],
  "lake-como-ad79e": ["Como", "Bellagio", "Varenna", "Menaggio", "Cernobbio", "Tremezzo"],
  "seychelles-3d2d7": ["Beau Vallon", "Victoria", "Praslin", "La Digue", "Baie Sainte Anne", "Anse Royale"],
  "monaco-35ab1": ["Monte Carlo", "Monte-Carlo", "Beausoleil"],
  "st-barts-e3772": ["Gustavia", "Saint-Jean", "Saint Barthelemy"],
  "washington-d-c-76868": ["Washington", "Washington D.C."],
  "roatan-5aa58": ["West Bay", "West End", "Roatan", "Coxen Hole", "French Harbour"],
  "havana-c484b": ["La Habana", "Havana"],
  "galapagos-islands-09f19": ["Puerto Ayora", "Puerto Baquerizo Moreno", "Puerto Villamil"],
  "atacama-desert-34950": ["San Pedro de Atacama"],
  "bariloche-354bf": ["San Carlos de Bariloche"],
  "frankfurt-17d53": ["Frankfurt am Main", "Frankfurt", "Frankfurt/Main"],
  "brighton-97691": ["Brighton & Hove", "Hove"],
  "tenerife-20a8d": ["Santa Cruz de Tenerife", "Puerto de la Cruz", "Adeje", "Costa Adeje", "Los Cristianos", "Playa de las Americas", "La Laguna"],
  "lanzarote-20a8d": ["Arrecife", "Puerto del Carmen", "Playa Blanca", "Costa Teguise"],
  "normandy-e3772": ["Bayeux", "Caen", "Honfleur", "Rouen", "Étretat"],
  "sardinia-ad79e": ["Cagliari", "Alghero", "Olbia", "Sassari"],
  "mykonos-4902a": ["Mykonos City", "Ornos", "Platis Gialos"],
  "crete-4902a": ["Heraklion", "Chania", "Rethymno", "Agios Nikolaos"],
  "meteora-4902a": ["Kalabaka", "Kalambaka", "Kastraki"],
  "lucerne-77dcd": ["Luzern"],
  "cappadocia-d7153": ["Göreme", "Goreme", "Ürgüp", "Urgup", "Uçhisar", "Avanos", "Nevşehir"],
  "chefchaouen-32e08": ["Chefchaouene", "Chefchaouen", "Chaouen"],
  "sossusvlei-bfe79": ["Sesriem", "Solitaire"],
  "mauritius-26160": ["Grand Baie", "Flic en Flac", "Trou aux Biches", "Port Louis", "Mahébourg", "Belle Mare"],
  "mestia-9113c": ["Mestia"],
};

// Where to look for stays when the destination's own point is the middle of a
// desert or park rather than the town travelers sleep in.
const STAY_CENTERS = {
  "atacama-desert-34950": [-22.9087, -68.1997], // San Pedro de Atacama
  "sardinia-ad79e": [39.2238, 9.1217], // Cagliari
  "crete-4902a": [35.3387, 25.1442], // Heraklion
};

// Every destination GlobTrek can recommend, launch cities first.
export function catalogDestinations({ all = false } = {}) {
  const ready = destinations.filter((destination) => all || destination.recommendationReady !== false || LAUNCH_SET.includes(destination.id));
  const ordered = [...ready].sort((a, b) => Number(LAUNCH_SET.includes(b.id)) - Number(LAUNCH_SET.includes(a.id)));
  return ordered.map((destination) => ({
    id: destination.id,
    city: destination.city,
    country: destination.country,
    hotelSearchCenters: destination.hotelSearchCenters || [],
    hotelSearchAliases: destination.hotelSearchAliases || [],
    feedCityAliases: FEED_CITY_ALIASES[destination.id] || [],
    latitude: STAY_CENTERS[destination.id]?.[0] ?? destination.latitude ?? null,
    longitude: STAY_CENTERS[destination.id]?.[1] ?? destination.longitude ?? null,
    // Hand-verified stays are always fetched, so their cards get catalog photos and details.
    pinnedStays: verifiedStays(destination.id).map((stay) => ({ name: stay.name, bookingUrl: stay.bookingUrl })),
  }));
}

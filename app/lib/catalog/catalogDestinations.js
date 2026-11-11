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
    latitude: destination.latitude ?? null,
    longitude: destination.longitude ?? null,
    // Hand-verified stays are always fetched, so their cards get catalog photos and details.
    pinnedStays: verifiedStays(destination.id).map((stay) => ({ name: stay.name, bookingUrl: stay.bookingUrl })),
  }));
}

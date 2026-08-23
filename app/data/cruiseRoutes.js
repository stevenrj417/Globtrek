import { destinations } from "./destinations.js";
import { cruiseQuizForRecommendations, cruiseTravelerCount } from "./cruiseQuiz.js";
import { destinationCostProfile } from "../lib/recommendation/costProfiles.js";
import { estimateFlight } from "../lib/recommendation/travelFeasibility.js";
import { destinationCountryCodes } from "../lib/recommendation/travelArea.js";

const byId = new Map(destinations.map((destination) => [destination.id, destination]));
const definitions = [
  { id: "caribbean-island-passage", title: "Caribbean Island Passage", dek: "Bright water, generous island days, and an easy rhythm between ports.", portIds: ["miami-76868", "nassau-1f797", "montego-bay-5eedd", "san-juan-fe23c"], experience: "Tropical islands", moods: ["Relaxed and slow", "Balanced exploring and relaxing"], priorities: ["Beautiful beaches", "Nightlife and entertainment", "Family experiences"], durations: ["6–8 nights", "9–14 nights"] },
  { id: "adriatic-cities", title: "Adriatic Cities Passage", dek: "Old stone ports, clear coves, and dinners that stretch into the evening.", portIds: ["venice-ad79e", "split-d7e04", "hvar-d7e04", "dubrovnik-d7e04", "kotor-479fb"], experience: "Coastal cities", moods: ["Balanced exploring and relaxing", "Luxury escape"], priorities: ["Amazing food", "Historic cities", "Nightlife and entertainment"], durations: ["6–8 nights", "9–14 nights"] },
  { id: "norwegian-coast", title: "Norwegian Coast Passage", dek: "Glacial light, deep fjords, and a northern landscape that keeps unfolding.", portIds: ["bergen-98845", "alesund-98845", "lofoten-98845", "troms-98845"], experience: "Dramatic landscapes", moods: ["Balanced exploring and relaxing", "Adventure every day"], priorities: ["Nature and wildlife"], durations: ["9–14 nights", "15+ nights"] },
  { id: "north-atlantic", title: "North Atlantic Passage", dek: "A more remote arc through volcanic shores, fjords, and high-latitude light.", portIds: ["reykjavik-b3c92", "bergen-98845", "alesund-98845", "lofoten-98845"], experience: "Remote exploration", moods: ["Adventure every day", "Balanced exploring and relaxing"], priorities: ["Nature and wildlife"], durations: ["9–14 nights", "15+ nights"] },
  { id: "alaska-inside-passage", title: "Alaska Inside Passage", dek: "Glacial water, forested channels, and immense northern landscapes.", portIds: ["anchorage-76868"], customPorts: [
    { id: "google:ChIJjzpqb2zeAFQREfNprlryXgY", city: "JUNEAU", country: "UNITED STATES", airport: "JNU", latitude: 58.3004933, longitude: -134.4201306, placeId: "ChIJjzpqb2zeAFQREfNprlryXgY", image: null, style: "Glaciers / Mountains", verificationSource: "google_places" },
    { id: "google:ChIJW-EphwglDFQRdAbGz2vlkH4", city: "KETCHIKAN", country: "UNITED STATES", airport: "KTN", latitude: 55.3422222, longitude: -131.6461111, placeId: "ChIJW-EphwglDFQRdAbGz2vlkH4", image: null, style: "Inside Passage / Forest", verificationSource: "google_places" },
    { id: "google:ChIJQZHeACWpqlYRalM6MncXJV4", city: "SKAGWAY", country: "UNITED STATES", airport: "SGY", latitude: 59.457178, longitude: -135.3145346, placeId: "ChIJQZHeACWpqlYRalM6MncXJV4", image: null, style: "Historic port / Mountains", verificationSource: "google_places" },
  ], hotelDestinationId: "anchorage-76868", experience: "Dramatic landscapes", moods: ["Adventure every day", "Balanced exploring and relaxing", "Relaxed and slow"], priorities: ["Nature and wildlife", "Family experiences"], durations: ["6–8 nights", "9–14 nights"] },
  { id: "japan-coast", title: "Japan Coast Passage", dek: "Harbor cities, regional food, and a coast that changes as the journey moves north.", portIds: [], customPorts: [
    { id: "google:ChIJCWW2u-xbGGARAFQoYPaDlgY", city: "YOKOHAMA", country: "JAPAN", airport: "HND", latitude: 35.4436739, longitude: 139.6379639, placeId: "ChIJCWW2u-xbGGARAFQoYPaDlgY", image: null, style: "Harbor / Food / City", verificationSource: "google_places" },
    { id: "google:ChIJIU281S1cnl8RW8N4lip9fZE", city: "HAKODATE", country: "JAPAN", airport: "HKD", latitude: 41.7686961, longitude: 140.7290599, placeId: "ChIJIU281S1cnl8RW8N4lip9fZE", image: null, style: "Harbor / Hokkaido", verificationSource: "google_places" },
  ], hotelDestinationId: "HND", experience: "Coastal cities", moods: ["Balanced exploring and relaxing", "Luxury escape"], priorities: ["Amazing food", "Historic cities"], durations: ["6–8 nights", "9–14 nights"] },
];

function hydrate(definition) {
  const catalogPorts = definition.portIds.map((id) => byId.get(id)).filter(Boolean);
  const ports = [...catalogPorts, ...(definition.customPorts || [])];
  if (catalogPorts.length !== definition.portIds.length || !ports.length || ports.some((port) => !Number.isFinite(port.latitude) || !Number.isFinite(port.longitude))) throw new Error(`Cruise concept ${definition.id} references incomplete destination data.`);
  const hotelDestination = byId.get(definition.hotelDestinationId) || catalogPorts[0] || ports[0];
  return { ...definition, ports, embarkation: ports[0], hotelDestination, hotelDestinationId: hotelDestination.id, heroImage: ports.find((port) => port.image)?.image || null };
}
export const cruiseRoutes = Object.freeze(definitions.map(hydrate));

function cabinPreference(answers) {
  if (answers.mood === "Luxury escape") return "Balcony preference, subject to a verified sailing fare";
  if (answers.experience === "Dramatic landscapes" || answers.experience === "Remote exploration") return "Ocean-view preference, subject to a verified sailing fare";
  return "Inside or ocean-view preference, selected after verified fares are available";
}

export function estimateCruiseLogistics(route, answers = {}) {
  const travelers = cruiseTravelerCount(answers);
  const rooms = Math.max(1, Math.ceil(travelers / 2));
  const flight = estimateFlight({ origin: answers.originDetails?.airportCode }, route.embarkation);
  const radians = (value) => Number(value) * Math.PI / 180;
  const lat1 = radians(answers.originDetails?.latitude); const lat2 = radians(route.embarkation.latitude); const deltaLat = lat2 - lat1; const deltaLon = radians(route.embarkation.longitude) - radians(answers.originDetails?.longitude); const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2; const normalizedHaversine = Math.min(1, Math.max(0, h)); const distanceMiles = Number.isFinite(h) ? 3958.8 * 2 * Math.atan2(Math.sqrt(normalizedHaversine), Math.sqrt(1 - normalizedHaversine)) : null;
  const sameCountry = destinationCountryCodes(route.embarkation).includes(answers.originDetails?.countryCode);
  const drive = answers.originDetails?.airportCode === route.embarkation.airport || (sameCountry && distanceMiles != null && distanceMiles <= 350);
  const cost = destinationCostProfile(route.hotelDestination || route.embarkation);
  const accessLow = drive ? Math.max(30, Math.round(distanceMiles * 0.22)) : flight.low * travelers;
  const accessHigh = drive ? Math.max(90, Math.round(distanceMiles * 0.48)) : flight.high * travelers;
  const hotelLow = Math.round(cost.typicalHotelNightLow * rooms);
  const hotelHigh = Math.round(cost.typicalHotelNightHigh * rooms);
  const transferLow = Math.round(cost.transportDailyLow * travelers);
  const transferHigh = Math.round(cost.transportDailyHigh * travelers);
  const knownLow = accessLow + hotelLow + transferLow;
  const knownHigh = accessHigh + hotelHigh + transferHigh;
  const budget = Number(answers.budget);
  const reserve = Math.max(800, Math.round(budget * 0.45));
  const level = knownHigh + reserve <= budget ? "excellent" : knownLow + reserve <= budget * 1.12 ? "acceptable" : "poor";
  return { mode: drive ? "drive" : "flight", access: { low: accessLow, high: accessHigh, distanceMiles: drive ? Math.round(distanceMiles) : null }, preCruiseHotel: { low: hotelLow, high: hotelHigh }, portTransport: { low: transferLow, high: transferHigh }, knownSubtotal: { low: knownLow, high: knownHigh }, cruiseAllowance: Math.max(0, budget - knownHigh), reservedCruiseAllowance: reserve, compatibility: { level }, currency: "USD", isLive: false, source: "GlobTrek deterministic planning estimates" };
}

export function selectCruise(answers = {}) {
  const ranked = cruiseRoutes.map((route) => {
    const logistics = estimateCruiseLogistics(route, answers);
    let score = route.experience === answers.experience ? 70 : 0;
    if (route.moods.includes(answers.mood)) score += 35;
    if (route.priorities.includes(answers.priority)) score += 28;
    if (route.durations.includes(answers.duration)) score += 24;
    if (logistics.compatibility.level === "excellent") score += 35;
    if (logistics.compatibility.level === "acceptable") score += 8;
    if (logistics.compatibility.level === "poor") score -= 1_000;
    return { ...route, logistics, cabinPreference: cabinPreference(answers), score };
  }).sort((a, b) => b.score - a.score || a.logistics.knownSubtotal.low - b.logistics.knownSubtotal.low);
  if (answers.requestedRouteId) return ranked.find((route) => route.id === answers.requestedRouteId) || null;
  return ranked.find((route) => route.logistics.compatibility.level !== "poor") || ranked[0] || null;
}

export { cruiseQuizForRecommendations };

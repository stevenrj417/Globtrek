import { destinations } from "./destinations.js";
import { cruiseQuizForRecommendations, cruiseTravelerCount } from "./cruiseQuiz.js";
import { destinationCostProfile } from "../lib/recommendation/costProfiles.js";
import { estimateFlight } from "../lib/recommendation/travelFeasibility.js";

const byId = new Map(destinations.map((destination) => [destination.id, destination]));
const definitions = [
  { id: "caribbean-island-passage", title: "Caribbean Island Passage", dek: "Bright water, generous island days, and an easy rhythm between ports.", portIds: ["miami-76868", "nassau-1f797", "montego-bay-5eedd", "san-juan-fe23c"], experience: "Tropical islands", moods: ["Relaxed and slow", "Balanced exploring and relaxing"], priorities: ["Beautiful beaches", "Nightlife and entertainment", "Family experiences"], durations: ["6–8 nights", "9–14 nights"] },
  { id: "adriatic-cities", title: "Adriatic Cities Passage", dek: "Old stone ports, clear coves, and dinners that stretch into the evening.", portIds: ["venice-ad79e", "split-d7e04", "hvar-d7e04", "dubrovnik-d7e04", "kotor-479fb"], experience: "Coastal cities", moods: ["Balanced exploring and relaxing", "Luxury escape"], priorities: ["Amazing food", "Historic cities", "Nightlife and entertainment"], durations: ["6–8 nights", "9–14 nights"] },
  { id: "norwegian-coast", title: "Norwegian Coast Passage", dek: "Glacial light, deep fjords, and a northern landscape that keeps unfolding.", portIds: ["bergen-98845", "alesund-98845", "lofoten-98845", "troms-98845"], experience: "Dramatic landscapes", moods: ["Balanced exploring and relaxing", "Adventure every day"], priorities: ["Nature and wildlife"], durations: ["9–14 nights", "15+ nights"] },
  { id: "north-atlantic", title: "North Atlantic Passage", dek: "A more remote arc through volcanic shores, fjords, and high-latitude light.", portIds: ["reykjavik-b3c92", "bergen-98845", "alesund-98845", "lofoten-98845"], experience: "Remote exploration", moods: ["Adventure every day", "Balanced exploring and relaxing"], priorities: ["Nature and wildlife"], durations: ["9–14 nights", "15+ nights"] },
];

function hydrate(definition) {
  const ports = definition.portIds.map((id) => byId.get(id)).filter(Boolean);
  if (ports.length !== definition.portIds.length || ports.some((port) => !Number.isFinite(port.latitude) || !Number.isFinite(port.longitude))) throw new Error(`Cruise concept ${definition.id} references incomplete destination data.`);
  return { ...definition, ports, embarkation: ports[0], heroImage: ports[1]?.image || ports[0].image };
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
  const drive = answers.originDetails?.airportCode === route.embarkation.airport;
  const cost = destinationCostProfile(route.embarkation);
  const accessLow = drive ? 50 : flight.low * travelers;
  const accessHigh = drive ? 180 : flight.high * travelers;
  const hotelLow = Math.round(cost.typicalHotelNightLow * rooms);
  const hotelHigh = Math.round(cost.typicalHotelNightHigh * rooms);
  const transferLow = Math.round(cost.transportDailyLow * travelers);
  const transferHigh = Math.round(cost.transportDailyHigh * travelers);
  const knownLow = accessLow + hotelLow + transferLow;
  const knownHigh = accessHigh + hotelHigh + transferHigh;
  const budget = Number(answers.budget);
  const reserve = Math.max(800, Math.round(budget * 0.45));
  const level = knownHigh + reserve <= budget ? "excellent" : knownLow + reserve <= budget * 1.12 ? "acceptable" : "poor";
  return { mode: drive ? "drive" : "flight", access: { low: accessLow, high: accessHigh }, preCruiseHotel: { low: hotelLow, high: hotelHigh }, portTransport: { low: transferLow, high: transferHigh }, knownSubtotal: { low: knownLow, high: knownHigh }, cruiseAllowance: Math.max(0, budget - knownHigh), reservedCruiseAllowance: reserve, compatibility: { level }, currency: "USD", isLive: false, source: "GlobTrek deterministic planning estimates" };
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
  return ranked.find((route) => route.logistics.compatibility.level !== "poor") || ranked[0] || null;
}

export { cruiseQuizForRecommendations };

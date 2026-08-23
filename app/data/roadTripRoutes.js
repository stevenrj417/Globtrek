import { destinations } from "./destinations.js";
import { destinationCostProfile } from "../lib/recommendation/costProfiles.js";
import { roadTripQuestions, roadTripQuizForRecommendations, roadTripTravelerCount } from "./roadTripQuiz.js";

const destinationById = new Map(destinations.map((destination) => [destination.id || destination.airport, destination]));

const routeDefinitions = [
  {
    id: "california-coast",
    title: "California Coast Road Trip",
    dek: "Pacific light, coastal cities, and room to linger between them.",
    stopIds: ["san-francisco-76868", "los-angeles-76868", "san-diego-76868"],
    distanceMiles: 590,
    days: 7,
    landscapes: ["Coastline", "Cities"],
    kinds: ["Slow scenic journey", "Food and culture", "Luxury escape"],
    driving: ["Balanced", "Long driving days"],
  },
  {
    id: "desert-and-red-rock",
    title: "Desert & Red Rock",
    dek: "Wide horizons, high-desert towns, and a changing palette after every long bend.",
    stopIds: ["las-vegas-76868", "sedona-76868", "santa-fe-76868"],
    distanceMiles: 860,
    days: 8,
    landscapes: ["Desert", "Mountains"],
    kinds: ["Adventure route", "Hidden places", "Food and culture"],
    driving: ["Balanced", "Long driving days"],
  },
  {
    id: "pacific-northwest",
    title: "Pacific Northwest Passage",
    dek: "Evergreen cities, salt air, and the quiet pull of the northern coast.",
    stopIds: ["portland-76868", "seattle-76868", "victoria-cd6a7"],
    distanceMiles: 390,
    days: 5,
    landscapes: ["Forest", "Coastline", "Cities"],
    kinds: ["Slow scenic journey", "Food and culture", "Hidden places"],
    driving: ["Short drives, more stops", "Balanced"],
  },
  {
    id: "alpine-cities",
    title: "Alpine Cities Escape",
    dek: "Mountain horizons and old cities connected by an unhurried road.",
    stopIds: ["munich-17d53", "innsbruck-59390", "salzburg-59390"],
    distanceMiles: 310,
    days: 5,
    landscapes: ["Mountains", "Countryside", "Cities"],
    kinds: ["Slow scenic journey", "Food and culture", "Luxury escape"],
    driving: ["Short drives, more stops", "Balanced"],
  },
  {
    id: "western-light",
    title: "The Great Western Light",
    dek: "A long-form journey from red desert to Pacific coast.",
    stopIds: ["santa-fe-76868", "sedona-76868", "san-diego-76868", "los-angeles-76868", "san-francisco-76868"],
    distanceMiles: 1_950,
    days: 14,
    landscapes: ["Desert", "Coastline", "Mountains"],
    kinds: ["Adventure route", "National parks", "Hidden places"],
    driving: ["Long driving days", "Balanced"],
  },
  {
    id: "lakes-to-mountains",
    title: "Lakes to Mountains",
    dek: "A measured arc through water, valleys, and high alpine towns.",
    stopIds: ["lake-como-ad79e", "interlaken-77dcd", "chamonix-e3772"],
    distanceMiles: 420,
    days: 7,
    landscapes: ["Lakes", "Mountains", "Countryside"],
    kinds: ["Slow scenic journey", "Adventure route", "Luxury escape"],
    driving: ["Short drives, more stops", "Balanced"],
  },
];

function routeWithDestinations(definition) {
  const stops = definition.stopIds.map((id) => destinationById.get(id)).filter(Boolean);
  if (stops.length !== definition.stopIds.length || stops.some((stop) => !Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude))) {
    throw new Error(`Road-trip route ${definition.id} references an incomplete destination.`);
  }
  return { ...definition, stops, heroImage: stops[Math.floor(stops.length / 2)].image, hotelDestinationId: stops[Math.floor(stops.length / 2)].id };
}

export const roadTripRoutes = Object.freeze(routeDefinitions.map(routeWithDestinations));

const desiredMiles = { "Weekend escape": 280, "500 miles": 500, "1,000 miles": 1_000, "2,000+ miles": 2_000 };

export function estimateRoadTrip(route, answers = {}) {
  const travelers = roadTripTravelerCount(answers);
  const rooms = Math.max(1, Math.ceil(travelers / 2));
  const profiles = route.stops.map(destinationCostProfile);
  const average = (field) => profiles.reduce((sum, profile) => sum + Number(profile[field] || 0), 0) / profiles.length;
  const nights = Math.max(2, route.days - 1);
  const stayLow = average("typicalHotelNightLow") * nights * rooms;
  const stayHigh = average("typicalHotelNightHigh") * nights * rooms;
  const foodLow = average("foodDailyLow") * route.days * travelers;
  const foodHigh = average("foodDailyHigh") * route.days * travelers;
  const experiencesLow = average("activitiesDailyLow") * route.days * travelers * 0.55;
  const experiencesHigh = average("activitiesDailyHigh") * route.days * travelers * 0.7;
  const roadLow = route.distanceMiles * 0.2 + route.days * 18;
  const roadHigh = route.distanceMiles * 0.42 + route.days * 45;
  return {
    low: Math.round((stayLow + foodLow + experiencesLow + roadLow) / 50) * 50,
    high: Math.round((stayHigh + foodHigh + experiencesHigh + roadHigh) / 50) * 50,
    currency: "USD",
    confidence: Math.min(...profiles.map((profile) => Number(profile.confidence || 0.3))),
    source: "GlobTrek planning estimate",
  };
}

export function budgetCompatibility(estimate, budget) {
  const amount = Number(budget);
  if (!Number.isFinite(amount) || amount <= 0) return { level: "unknown", difference: null };
  if (estimate.high <= amount) return { level: "excellent", difference: amount - estimate.high };
  if (estimate.low <= amount * 1.12) return { level: "acceptable", difference: amount - estimate.low };
  return { level: "poor", difference: amount - estimate.low };
}

export function matchRoadTrips(answers = {}) {
  const wantedDistance = answers.distance === "Custom distance" ? Number(answers.customDistance) : desiredMiles[answers.distance];
  return roadTripRoutes.map((route) => {
    const estimate = estimateRoadTrip(route, answers);
    const compatibility = budgetCompatibility(estimate, answers.budget);
    let score = 0;
    if (route.landscapes.includes(answers.landscape)) score += 60;
    if (route.kinds.includes(answers.kind)) score += 42;
    if (route.driving.includes(answers.driving)) score += 24;
    if (Number.isFinite(wantedDistance)) score += Math.max(0, 30 - Math.abs(route.distanceMiles - wantedDistance) / 35);
    if (compatibility.level === "excellent") score += 35;
    if (compatibility.level === "acceptable") score += 8;
    if (compatibility.level === "poor") score -= 1_000;
    return { ...route, estimate, compatibility, score };
  }).sort((a, b) => b.score - a.score || a.estimate.low - b.estimate.low);
}

export function selectRoadTrip(answers = {}) {
  const ranked = matchRoadTrips(answers);
  return ranked.find((route) => route.compatibility.level !== "poor") || ranked[0] || null;
}

export { roadTripQuestions, roadTripQuizForRecommendations, roadTripTravelerCount };

import { destinations } from "./destinations.js";
import { destinationCostProfile } from "../lib/recommendation/costProfiles.js";
import { estimateFlight } from "../lib/recommendation/travelFeasibility.js";
import { destinationCountryCodes } from "../lib/recommendation/travelArea.js";
import { roadTripQuestions, roadTripQuizForRecommendations, roadTripTravelerCount } from "./roadTripQuiz.js";

const destinationById = new Map(destinations.map((destination) => [destination.id || destination.airport, destination]));

const routeDefinitions = [
  {
    id: "joshua-tree", title: "Joshua Tree Desert Escape", dek: "Desert light, granite monoliths, and quiet roads beneath an enormous sky.",
    stopIds: ["palm-springs-76868"], customStops: [{ id: "google:ChIJe6hluYWP2oAR4p3rOqftdxk", city: "JOSHUA TREE NATIONAL PARK", country: "UNITED STATES", airport: "PSP", latitude: 33.873415, longitude: -115.9009923, placeId: "ChIJe6hluYWP2oAR4p3rOqftdxk", image: null, style: "Desert / National park / Open skies", verificationSource: "google_places" }],
    distanceMiles: 95, days: 4, landscapes: ["Desert"], kinds: ["Slow scenic journey", "Adventure route", "National parks"], driving: ["Short drives, more stops", "Balanced"], hotelDestinationId: "palm-springs-76868",
  },
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
    id: "iceland-ring-road", title: "Iceland Ring Road", dek: "Waterfalls, black-sand shores, and a road that keeps finding wilder light.",
    stopIds: ["reykjavik-b3c92"], customStops: [
      { id: "google:ChIJ0bA2SUJK10gRjXdtABtTg74", city: "VÍK", country: "ICELAND", airport: "KEF", latitude: 63.4176505, longitude: -18.9974395, placeId: "ChIJ0bA2SUJK10gRjXdtABtTg74", image: null, style: "Black sand / South coast", verificationSource: "google_places" },
      { id: "google:ChIJnwecWlisz0gR7eDbKciB7rA", city: "HÖFN", country: "ICELAND", airport: "KEF", latitude: 64.2551913, longitude: -15.2088449, placeId: "ChIJnwecWlisz0gR7eDbKciB7rA", image: null, style: "Glaciers / Harbor", verificationSource: "google_places" },
      { id: "google:ChIJp7-wHAeP0kgR0f1xjHkytr0", city: "AKUREYRI", country: "ICELAND", airport: "AEY", latitude: 65.6825509, longitude: -18.0906858, placeId: "ChIJp7-wHAeP0kgR0f1xjHkytr0", image: null, style: "North Iceland / Fjords", verificationSource: "google_places" },
    ], distanceMiles: 820, days: 10, landscapes: ["Mountains", "Coastline", "Lakes"], kinds: ["Adventure route", "National parks", "Hidden places"], driving: ["Balanced", "Long driving days"], hotelDestinationId: "reykjavik-b3c92",
  },
  {
    id: "scottish-highlands", title: "Scottish Highlands Journey", dek: "Lochs, old mountain roads, and stone towns held in shifting northern weather.",
    stopIds: ["edinburgh-97691"], customStops: [
      { id: "google:ChIJK94XLVtxj0gRPcQ-LtEJQ2I", city: "INVERNESS", country: "UNITED KINGDOM", airport: "INV", latitude: 57.477773, longitude: -4.224721, placeId: "ChIJK94XLVtxj0gRPcQ-LtEJQ2I", image: null, style: "Lochs / Highland gateway", verificationSource: "google_places" },
      { id: "google:ChIJGwMcNyMziUgRIUhUCOM-oM0", city: "FORT WILLIAM", country: "UNITED KINGDOM", airport: "GLA", latitude: 56.819817, longitude: -5.105218, placeId: "ChIJGwMcNyMziUgRIUhUCOM-oM0", image: null, style: "Mountains / Scenic roads", verificationSource: "google_places" },
      { id: "google:ChIJ_8G9YSIxjEgRGGLI6W81XFg", city: "ISLE OF SKYE", country: "UNITED KINGDOM", airport: "INV", latitude: 57.2736278, longitude: -6.2155022, placeId: "ChIJ_8G9YSIxjEgRGGLI6W81XFg", image: null, style: "Island / Coastal mountains", verificationSource: "google_places" },
    ], distanceMiles: 560, days: 8, landscapes: ["Mountains", "Coastline", "Countryside"], kinds: ["Slow scenic journey", "Hidden places", "Food and culture"], driving: ["Short drives, more stops", "Balanced"], hotelDestinationId: "edinburgh-97691",
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
  const catalogStops = definition.stopIds.map((id) => destinationById.get(id)).filter(Boolean);
  const stops = [...catalogStops, ...(definition.customStops || [])];
  if (catalogStops.length !== definition.stopIds.length || stops.some((stop) => !Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude))) {
    throw new Error(`Road-trip route ${definition.id} references an incomplete destination.`);
  }
  const hotelDestinationId = definition.hotelDestinationId || stops[Math.floor(stops.length / 2)].id;
  return { ...definition, stops, heroImage: stops.find((stop) => stop.image)?.image || null, hotelDestinationId, hotelDestination: destinationById.get(hotelDestinationId) || catalogStops[0] };
}

export const roadTripRoutes = Object.freeze(routeDefinitions.map(routeWithDestinations));

const desiredMiles = { "Weekend escape": 280, "500 miles": 500, "1,000 miles": 1_000, "2,000+ miles": 2_000 };
const requestedDays = { "3–5 days": 4, "6–8 days": 7, "9–14 days": 10, "15+ days": 16 };

export function estimateRoadTrip(route, answers = {}) {
  const travelers = roadTripTravelerCount(answers);
  const rooms = Math.max(1, Math.ceil(travelers / 2));
  const profiles = route.stops.filter((stop) => stop.costProfile || destinationById.has(stop.id)).map(destinationCostProfile);
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
  const origin = answers.originDetails;
  const destinationCodes = destinationCountryCodes(route.hotelDestination || route.stops[0]);
  const domestic = Boolean(origin?.countryCode && destinationCodes.includes(origin.countryCode));
  const radians = (value) => Number(value) * Math.PI / 180;
  const lat1 = radians(origin?.latitude); const lat2 = radians(route.stops[0].latitude); const deltaLat = lat2 - lat1; const deltaLon = radians(route.stops[0].longitude) - radians(origin?.longitude);
  const haversine = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const normalizedHaversine = Math.min(1, Math.max(0, haversine));
  const straightMiles = Number.isFinite(lat1) && Number.isFinite(lat2) ? 3958.8 * 2 * Math.atan2(Math.sqrt(normalizedHaversine), Math.sqrt(1 - normalizedHaversine)) : null;
  const travelersAccess = roadTripTravelerCount(answers);
  const flight = estimateFlight({ origin: origin?.airportCode }, route.hotelDestination || route.stops[0]);
  const access = domestic ? { mode: "drive", distanceMiles: Math.round((straightMiles || 0) * 1.18), low: Math.round((straightMiles || 0) * 0.22), high: Math.round((straightMiles || 0) * 0.48), isLive: false } : { mode: "flight_and_rental", distanceMiles: null, low: flight.low * travelersAccess, high: flight.high * travelersAccess, isLive: false };
  return {
    low: Math.round((stayLow + foodLow + experiencesLow + roadLow + access.low) / 50) * 50,
    high: Math.round((stayHigh + foodHigh + experiencesHigh + roadHigh + access.high) / 50) * 50,
    currency: "USD",
    confidence: Math.min(...profiles.map((profile) => Number(profile.confidence || 0.3))),
    source: "GlobTrek planning estimate", access,
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
    const plannedRoute = requestedDays[answers.duration] ? { ...route, days: requestedDays[answers.duration] } : route;
    const estimate = estimateRoadTrip(plannedRoute, answers);
    const compatibility = budgetCompatibility(estimate, answers.budget);
    let score = 0;
    if (route.landscapes.includes(answers.landscape)) score += 60;
    if (route.kinds.includes(answers.kind)) score += 42;
    if (route.driving.includes(answers.driving)) score += 24;
    if (Number.isFinite(wantedDistance)) score += Math.max(0, 30 - Math.abs(route.distanceMiles - wantedDistance) / 35);
    if (compatibility.level === "excellent") score += 35;
    if (compatibility.level === "acceptable") score += 8;
    if (compatibility.level === "poor") score -= 1_000;
    return { ...plannedRoute, estimate, compatibility, score };
  }).sort((a, b) => b.score - a.score || a.estimate.low - b.estimate.low);
}

export function selectRoadTrip(answers = {}) {
  const ranked = matchRoadTrips(answers);
  if (answers.requestedRouteId) return ranked.find((route) => route.id === answers.requestedRouteId) || null;
  return ranked.find((route) => route.compatibility.level !== "poor") || ranked[0] || null;
}

export { roadTripQuestions, roadTripQuizForRecommendations, roadTripTravelerCount };

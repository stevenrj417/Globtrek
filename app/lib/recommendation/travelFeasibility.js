const UPDATED = "2026-08-16";

const AIRPORT_REGIONS = {
  PDX: "north_america_west", SEA: "north_america_west", SFO: "north_america_west", LAX: "north_america_west",
  OGG: "hawaii", HNL: "hawaii",
  JFK: "north_america_east", EWR: "north_america_east", ATL: "north_america_east", ORD: "north_america_central", DEN: "north_america_central",
  LHR: "europe", LGW: "europe", MRS: "europe", CDG: "europe", NAP: "europe", FCO: "europe", FLR: "europe", JTR: "europe", LIS: "europe", BCN: "europe", KEF: "europe",
  HND: "east_asia", KIX: "east_asia", ICN: "east_asia", SIN: "southeast_asia", BKK: "southeast_asia", CNX: "southeast_asia", DPS: "southeast_asia", HAN: "southeast_asia",
  SYD: "oceania", CHC: "oceania", PPT: "south_pacific", MLE: "indian_ocean", CPT: "africa", NBO: "africa",
};

const ROUTE_OVERRIDES = {
  "PDX:OGG": { flightHours: 5.8, connections: 0, low: 360, high: 720, popularity: "established" },
  "PDX:MRS": { flightHours: 14.5, connections: 1, low: 850, high: 1450, popularity: "connecting" },
  "LHR:MRS": { flightHours: 2, connections: 0, low: 110, high: 360, popularity: "established" },
};

function regionFor(code) {
  return AIRPORT_REGIONS[String(code || "").toUpperCase()] || "unknown";
}

function genericRoute(origin, destination) {
  const from = regionFor(origin);
  const to = regionFor(destination);
  if (origin === destination) return { flightHours: 0, connections: 0, low: 0, high: 0, popularity: "local" };
  if (from === to && from !== "unknown") return { flightHours: 2.5, connections: 0, low: 180, high: 520, popularity: "regional" };
  if ([from, to].includes("hawaii") && [from, to].some((region) => region.startsWith("north_america"))) return { flightHours: 6, connections: 0, low: 380, high: 800, popularity: "established" };
  if ([from, to].includes("europe") && [from, to].some((region) => region.startsWith("north_america"))) return { flightHours: from === "north_america_east" || to === "north_america_east" ? 8 : 12, connections: 1, low: 650, high: 1350, popularity: "connecting" };
  if ([from, to].some((region) => ["east_asia", "southeast_asia", "oceania", "south_pacific", "indian_ocean", "africa"].includes(region))) return { flightHours: 15, connections: 1, low: 850, high: 1850, popularity: "long_haul" };
  return { flightHours: 7, connections: 1, low: 450, high: 1200, popularity: "estimated" };
}

function seasonMultiplier(profile) {
  const month = profile?.dates?.start ? new Date(`${profile.dates.start}T00:00:00Z`).getUTCMonth() + 1 : null;
  if ([6, 7, 12].includes(month)) return 1.22;
  if ([1, 2, 9, 10, 11].includes(month)) return 0.92;
  return 1;
}

export function estimateFlight(profile, destination) {
  const origin = String(profile?.origin || "").toUpperCase();
  const airport = String(destination?.airport || "").toUpperCase();
  if (!origin || !airport) return { low: 500, high: 1500, currency: "USD", priceSource: "route_market_estimate_without_origin", priceLastChecked: UPDATED, confidence: 0.25, isLive: false };
  const route = ROUTE_OVERRIDES[`${origin}:${airport}`] || genericRoute(origin, airport);
  const multiplier = seasonMultiplier(profile);
  return {
    low: Math.round(route.low * multiplier), high: Math.round(route.high * multiplier), currency: "USD",
    priceSource: "deterministic_route_market_estimate", priceLastChecked: UPDATED,
    confidence: ROUTE_OVERRIDES[`${origin}:${airport}`] ? 0.62 : regionFor(origin) === "unknown" ? 0.3 : 0.45, isLive: false,
  };
}

export function assessTravelFeasibility(profile, destination) {
  const origin = String(profile?.origin || "").toUpperCase();
  const airport = String(destination?.airport || "").toUpperCase();
  if (!origin || !airport) return { score: 50, status: "unknown", reason: "Origin airport required for route feasibility", estimatedFlightDuration: null, estimatedConnections: null, airportBuffer: 4, timeZoneShift: null, estimatedDoorToDestinationTime: null, travelDayImpact: null, usableDestinationTime: null };
  const route = ROUTE_OVERRIDES[`${origin}:${airport}`] || genericRoute(origin, airport);
  const airportBuffer = route.flightHours === 0 ? 0 : 4 + route.connections * 1.5;
  const doorHoursEachWay = route.flightHours + airportBuffer;
  const tripHours = Math.max(24, Number(profile.tripLength || 1) * 24);
  const travelDayImpact = Math.min(1, (doorHoursEachWay * 2) / tripHours);
  const usableDestinationTime = Math.max(0, Number(profile.tripLength || 1) - (doorHoursEachWay * 2) / 24);
  const connectionPenalty = route.connections * 8;
  const score = Math.max(0, Math.min(100, Math.round(105 - travelDayImpact * 150 - connectionPenalty)));
  return {
    score, status: score < 35 ? "unreasonable" : score < 60 ? "strained" : "reasonable",
    reason: score < 35 ? "Travel consumes too much of this trip" : score < 60 ? "Route is possible but materially reduces destination time" : "Travel time is proportionate to trip length",
    estimatedFlightDuration: route.flightHours, estimatedConnections: route.connections, airportBuffer,
    timeZoneShift: null, estimatedDoorToDestinationTime: doorHoursEachWay,
    travelDayImpact: Number(travelDayImpact.toFixed(2)), usableDestinationTime: Number(usableDestinationTime.toFixed(1)),
  };
}

import flightPrices from "../../data/flightPrices.json" with { type: "json" };
import { fareForDate } from "../flights/travelpayouts.js";
import { FARE_SNAPSHOT_CHECKED, monthLabel, snapshotFare } from "../../data/fareSnapshots.js";
import { pricingMonth } from "../trip/period.js";

const UPDATED = "2026-08-16";
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const AIRPORT_REGIONS = {
  PDX: "north_america_west", SEA: "north_america_west", SFO: "north_america_west", LAX: "north_america_west",
  OGG: "hawaii", HNL: "hawaii",
  JFK: "north_america_east", EWR: "north_america_east", BOS: "north_america_east", IAD: "north_america_east", MIA: "north_america_east", YYZ: "north_america_east", YUL: "north_america_east", ATL: "north_america_east", ORD: "north_america_central", DEN: "north_america_central", DFW: "north_america_central", MEX: "north_america_central", CUN: "north_america_central", YVR: "north_america_west", YYC: "north_america_west", SJO: "north_america_central",
  LHR: "europe", LGW: "europe", MRS: "europe", CDG: "europe", NAP: "europe", FCO: "europe", FLR: "europe", JTR: "europe", LIS: "europe", BCN: "europe", KEF: "europe",
  HND: "east_asia", KIX: "east_asia", ICN: "east_asia", SIN: "southeast_asia", BKK: "southeast_asia", CNX: "southeast_asia", DPS: "southeast_asia", HAN: "southeast_asia",
  SYD: "oceania", CHC: "oceania", PPT: "south_pacific", MLE: "indian_ocean", CPT: "africa", NBO: "africa",
  EZE: "south_america", LIM: "south_america", SCL: "south_america", GIG: "south_america", GRU: "south_america",
};

// Coordinates cover the original hand-curated catalog and common departure
// airports. Newer catalog destinations already carry their own coordinates.
const AIRPORT_COORDINATES = {
  PDX: [45.59, -122.6], SEA: [47.45, -122.31], SFO: [37.62, -122.38], LAX: [33.94, -118.41],
  JFK: [40.64, -73.78], EWR: [40.69, -74.17], BOS: [42.37, -71.01], IAD: [38.95, -77.46], MIA: [25.8, -80.29], ATL: [33.64, -84.43], ORD: [41.98, -87.9], DEN: [39.86, -104.67], DFW: [32.9, -97.04],
  YYZ: [43.68, -79.63], YUL: [45.47, -73.74], YVR: [49.19, -123.18], YYC: [51.13, -114.01],
  KIX: [34.43, 135.24], HND: [35.55, 139.78], ICN: [37.46, 126.44], BKK: [13.69, 100.75], CNX: [18.77, 98.96], DPS: [-8.75, 115.17], SIN: [1.36, 103.99], HAN: [21.22, 105.81],
  MLE: [4.19, 73.53], DXB: [25.25, 55.36], CPT: [-33.97, 18.6], RAK: [31.61, -8.04], NBO: [-1.32, 36.93],
  CDG: [49.01, 2.55], MRS: [43.44, 5.22], NAP: [40.89, 14.29], FCO: [41.8, 12.25], FLR: [43.81, 11.21], JTR: [36.4, 25.48], LIS: [38.77, -9.13], BCN: [41.3, 2.08], KEF: [63.99, -22.62], LHR: [51.47, -0.45],
  MEX: [19.44, -99.07], TQO: [20.17, -87.66], SJO: [9.99, -84.21], GIG: [-22.81, -43.25], EZE: [-34.82, -58.54], FTE: [-50.28, -72.05],
  OGG: [20.9, -156.43], SYD: [-33.94, 151.18], CHC: [-43.49, 172.53], PPT: [-17.55, -149.61],
};

const COUNTRY_REGIONS = {
  "united states": "north_america", canada: "north_america", mexico: "north_america", "costa rica": "north_america",
  argentina: "south_america", brazil: "south_america", chile: "south_america", peru: "south_america", colombia: "south_america",
  japan: "east_asia", china: "east_asia", "south korea": "east_asia", thailand: "southeast_asia", vietnam: "southeast_asia", indonesia: "southeast_asia", malaysia: "southeast_asia", singapore: "southeast_asia", cambodia: "southeast_asia", laos: "southeast_asia",
  australia: "oceania", "new zealand": "oceania", morocco: "africa", kenya: "africa", egypt: "africa", "south africa": "africa",
};
const EUROPE_COUNTRIES = new Set(["france", "italy", "spain", "portugal", "united kingdom", "ireland", "iceland", "greece", "germany", "austria", "switzerland", "belgium", "netherlands", "denmark", "norway", "sweden", "finland", "poland", "estonia", "slovenia", "croatia", "bosnia and herzegovina", "montenegro", "albania", "north macedonia", "bulgaria", "romania", "hungary", "czech republic", "turkey", "georgia", "armenia", "monaco"]);

function countryRegion(country) {
  const normalized = String(country || "").toLowerCase();
  return COUNTRY_REGIONS[normalized] || (EUROPE_COUNTRIES.has(normalized) ? "europe" : "unknown");
}

// Researched economy round-trip benchmarks (November 2026 public fare snapshots):
// low = a well-timed deal, high = a typical fare. See DECISIONS.md for sources.
const ROUTE_OVERRIDES = {
  "PDX:OGG": { flightHours: 5.8, connections: 0, low: 360, high: 720, popularity: "established" },
  "PDX:LAS": { flightHours: 2.2, connections: 0, low: 160, high: 350, popularity: "established" },
  "PDX:HNL": { flightHours: 5.8, connections: 0, low: 480, high: 600, popularity: "established" },
  "PDX:LAX": { flightHours: 2.4, connections: 0, low: 110, high: 180, popularity: "established" },
  "PDX:BUR": { flightHours: 2.3, connections: 0, low: 120, high: 190, popularity: "established" },
  "PDX:SAN": { flightHours: 2.5, connections: 0, low: 150, high: 200, popularity: "established" },
  "PDX:PSP": { flightHours: 2.4, connections: 0, low: 145, high: 200, popularity: "established" },
  "PDX:PHX": { flightHours: 2.6, connections: 0, low: 106, high: 200, popularity: "established" },
  "PDX:MEX": { flightHours: 5.5, connections: 0, low: 597, high: 700, popularity: "established" },
  "PDX:OAX": { flightHours: 8, connections: 1, low: 664, high: 800, popularity: "connecting" },
  "PDX:GDL": { flightHours: 4.5, connections: 0, low: 491, high: 620, popularity: "established" },
  "PDX:PVR": { flightHours: 4.2, connections: 0, low: 511, high: 600, popularity: "established" },
  "PDX:MID": { flightHours: 8.5, connections: 1, low: 666, high: 800, popularity: "connecting" },
  "PDX:MRS": { flightHours: 14.5, connections: 1, low: 850, high: 1450, popularity: "connecting" },
  "LHR:MRS": { flightHours: 2, connections: 0, low: 110, high: 360, popularity: "established" },
};

function regionFor(code) {
  const airportCode = String(code || "").toUpperCase();
  return AIRPORT_REGIONS[airportCode] || "unknown";
}

function genericRoute(origin, destination, country) {
  const from = regionFor(origin);
  const to = regionFor(destination) === "unknown" ? countryRegion(country) : regionFor(destination);
  if (origin === destination) return { flightHours: 0, connections: 0, low: 0, high: 0, popularity: "local" };
  if (from === to && from !== "unknown") return { flightHours: 2.5, connections: 0, low: 180, high: 520, popularity: "regional" };
  if (from.startsWith("north_america") && to === "north_america") return { flightHours: 4.5, connections: 0, low: 260, high: 720, popularity: "regional" };
  if (from.startsWith("north_america") && to.startsWith("north_america")) return { flightHours: 5, connections: 0, low: 280, high: 760, popularity: "established" };
  if ([from, to].includes("south_america") && [from, to].some((region) => region.startsWith("north_america"))) return { flightHours: 12, connections: 1, low: 700, high: 1500, popularity: "connecting" };
  if ([from, to].includes("hawaii") && [from, to].some((region) => region.startsWith("north_america"))) return { flightHours: 6, connections: 0, low: 380, high: 800, popularity: "established" };
  if ([from, to].includes("europe") && [from, to].some((region) => region.startsWith("north_america"))) return { flightHours: from === "north_america_east" || to === "north_america_east" ? 8 : 12, connections: 1, low: 650, high: 1350, popularity: "connecting" };
  if ([from, to].some((region) => ["east_asia", "southeast_asia", "oceania", "south_pacific", "indian_ocean", "africa"].includes(region))) return { flightHours: 15, connections: 1, low: 850, high: 1850, popularity: "long_haul" };
  return { flightHours: 7, connections: 1, low: 450, high: 1200, popularity: "estimated" };
}

function monthMultiplier(month) {
  if ([6, 7, 12].includes(month)) return 1.22;
  if ([1, 2, 9, 10, 11].includes(month)) return 0.92;
  return 1;
}

function profileMonth(profile) {
  return pricingMonth(profile);
}

function routeAverage(route) {
  if (Number.isFinite(route.average)) return Math.round(route.average / 10) * 10;
  return Math.round((route.low + (route.high - route.low) * 0.25) / 10) * 10;
}

function radians(value) {
  return value * Math.PI / 180;
}

function distanceMiles([fromLatitude, fromLongitude], [toLatitude, toLongitude]) {
  const latitudeDistance = radians(toLatitude - fromLatitude);
  const longitudeDistance = radians(toLongitude - fromLongitude);
  const a = Math.sin(latitudeDistance / 2) ** 2 + Math.cos(radians(fromLatitude)) * Math.cos(radians(toLatitude)) * Math.sin(longitudeDistance / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function coordinates(value) {
  const latitude = Number(value?.latitude);
  const longitude = Number(value?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

function distanceFareAverage(miles, international) {
  const base = miles <= 350 ? 170
    : miles <= 800 ? 220
      : miles <= 1500 ? 300
        : miles <= 2500 ? 390
          : miles <= 4000 ? 500
            : miles <= 5500 ? 720
              : miles <= 7500 ? 900
                : 1080;
  return base + (international && miles < 1500 ? 40 : 0);
}

function coordinateRoute(profile, destination) {
  const originCode = String(profile?.origin || "").toUpperCase();
  const destinationCode = String(destination?.airport || "").toUpperCase();
  const originCoordinates = coordinates(profile?.originDetails) || AIRPORT_COORDINATES[originCode];
  const destinationCoordinates = coordinates(destination) || AIRPORT_COORDINATES[destinationCode];
  if (!originCoordinates || !destinationCoordinates) return null;
  const miles = distanceMiles(originCoordinates, destinationCoordinates);
  const originCountry = String(profile?.originCountry || "").trim().toUpperCase();
  const destinationCountry = String(destination?.country || "").trim().toUpperCase();
  const international = Boolean(originCountry && destinationCountry && originCountry !== destinationCountry);
  const remoteFactor = ["island", "resort_area", "nature_area", "multi_stop"].includes(destination?.destinationType) ? 1.08 : 1;
  const average = Math.round(distanceFareAverage(miles, international) * remoteFactor / 10) * 10;
  const connections = miles > 7000 ? 1 : miles > 3500 && regionFor(originCode) !== regionFor(destinationCode) ? 1 : 0;
  return {
    flightHours: Number(Math.max(1, miles / 520 + 0.7).toFixed(1)),
    connections,
    average,
    low: Math.round(average * 0.78),
    high: Math.round(average * 1.35),
    popularity: connections ? "connecting" : "established",
    distanceMiles: Math.round(miles),
  };
}

function routeFor(profile, destination) {
  const origin = String(profile?.origin || "").toUpperCase();
  const airport = String(destination?.airport || "").toUpperCase();
  return ROUTE_OVERRIDES[`${origin}:${airport}`] || coordinateRoute(profile, destination) || genericRoute(origin, airport, destination?.country);
}

const CARRIERS = { NK: "Spirit", F9: "Frontier", G4: "Allegiant", WN: "Southwest", AS: "Alaska", B6: "JetBlue", SY: "Sun Country", MX: "Breeze", HA: "Hawaiian", DL: "Delta", UA: "United", AA: "American" };
const QUARTER_LABEL = { 1: "Jan–Mar", 2: "Apr–Jun", 3: "Jul–Sep", 4: "Oct–Dec" };

// DOT fares are one way; a round trip is two. Cheapest mode uses the lowest-fare
// airline's average, comfortable the all-airline average, best value the midpoint.
function dotFare(route, profile) {
  if (!route?.quarters || !Object.keys(route.quarters).length) return null;
  const month = profileMonth(profile);
  const quarter = month ? Math.ceil(month / 3) : null;
  const picked = quarter && route.quarters[quarter] ? [route.quarters[quarter]] : Object.values(route.quarters);
  const mean = (key) => picked.reduce((sum, item) => sum + item[key], 0) / picked.length;
  const fare = mean("fare");
  const fareLow = mean("fareLow");
  const style = profile?.spendStyle || "value";
  const oneWay = style === "cheapest" ? fareLow : style === "comfortable" ? fare : (fare + fareLow) / 2;
  const average = Math.round(oneWay * 2);
  const single = picked.length === 1 ? picked[0] : null;
  const when = single ? `${QUARTER_LABEL[quarter]} ${single.year}` : "year-round";
  return {
    low: Math.round(fareLow * 2), high: Math.round(fare * 2), average, currency: "USD",
    priceSource: "us_dot_average_fare_paid", priceLastChecked: flightPrices.latestPeriod || flightPrices.checkedAt, confidence: 0.8, isLive: false,
    cabinClass: "economy", tripType: "round_trip",
    basis: `U.S. DOT average fare actually paid, ${when}${style === "cheapest" && single?.carrierLow ? ` on the cheapest airline (${CARRIERS[single.carrierLow] || single.carrierLow})` : ""}, taxes included`,
    fareQuarter: single ? { quarter, year: single.year, carrierLow: single.carrierLow } : null,
    // Each month gets its quarter's real average (or the year-round mean if that quarter is missing).
    monthlyAverageEconomyRoundTrip: MONTH_NAMES.map((monthName, index) => {
      const row = route.quarters[Math.ceil((index + 1) / 3)];
      const value = row ? (style === "cheapest" ? row.fareLow : style === "comfortable" ? row.fare : (row.fare + row.fareLow) / 2) : oneWay;
      return { month: index + 1, monthName, average: Math.round(value * 2) };
    }),
  };
}

export function estimateFlight(profile, destination) {
  const origin = String(profile?.origin || "").toUpperCase();
  const airport = String(destination?.airport || "").toUpperCase();
  if (!origin || !airport) {
    const average = 850;
    return {
      low: Math.round(average * 0.88), high: Math.round(average * 1.12), average, currency: "USD",
      priceSource: "route_market_estimate_without_origin", priceLastChecked: UPDATED, confidence: 0.25, isLive: false,
      cabinClass: "economy", tripType: "round_trip", basis: "Modeled monthly planning average; origin required for a route-specific estimate",
      monthlyAverageEconomyRoundTrip: MONTH_NAMES.map((monthName, index) => ({ month: index + 1, monthName, average: Math.round(average * monthMultiplier(index + 1)) })),
    };
  }
  // Real fares first: Google Flights fares for the traveler's month, then U.S. DOT quarterly averages of fares actually paid (domestic),
  // or Travelpayouts two-week averages when that feed is configured.
  const snapshot = snapshotFare(origin, airport, profile?.dates?.start, profile?.dates?.flexible || !profile?.dates?.start, profile?.dates?.period?.months);
  if (snapshot) {
    const average = profile?.spendStyle === "cheapest" ? snapshot.typical : Math.round(snapshot.typical * (profile?.spendStyle === "comfortable" ? 1.25 : 1.1));
    return {
      low: snapshot.cheapest, high: Math.round(snapshot.typical * 1.3), average, currency: "USD",
      priceSource: "google_flights_snapshot", priceLastChecked: FARE_SNAPSHOT_CHECKED, confidence: 0.85, isLive: false,
      cabinClass: "economy", tripType: "round_trip",
      basis: `${snapshot.cheapestMonth ? `Cheapest month to fly: ${monthLabel(snapshot.month)}. ` : ""}Real round-trip fares for ${monthLabel(snapshot.month)} on Google Flights${snapshot.days > 1 ? ` (lowest $${snapshot.cheapest}, most days about $${snapshot.typical})` : ` (cheapest airline, sampled midweek)`}, checked ${FARE_SNAPSHOT_CHECKED}; personal item only on budget airlines`,
      fareMonth: snapshot.month,
      cheapestMonth: Boolean(snapshot.cheapestMonth),
      monthlyAverageEconomyRoundTrip: [],
    };
  }
  const dot = dotFare(flightPrices.routes?.[`${origin}:${airport}`], profile);
  if (dot) return dot;
  const observed = fareForDate(flightPrices.routes?.[`${origin}:${airport}`], profile?.dates?.start || null);
  if (observed) {
    const average = profile?.spendStyle === "cheapest" ? observed.cheapest : observed.average;
    return {
      low: observed.cheapest, high: Math.round(observed.average * 1.12), average, currency: "USD",
      priceSource: "aviasales_cached_fares", priceLastChecked: flightPrices.checkedAt, confidence: 0.8, isLive: false,
      cabinClass: "economy", tripType: "round_trip",
      basis: observed.yearRound
        ? `Year-round average of round-trip fares travelers found from ${origin} (checked ${flightPrices.checkedAt})`
        : `Average round-trip fare travelers found for departures ${observed.start} to ${observed.end} (checked ${flightPrices.checkedAt})`,
      fareWindow: observed,
      monthlyAverageEconomyRoundTrip: [],
    };
  }
  const route = routeFor(profile, destination);
  const multiplier = monthMultiplier(profileMonth(profile));
  // "Absolute cheapest" plans around a well-timed deal fare rather than a typical one.
  const base = profile?.spendStyle === "cheapest" && Number.isFinite(route.low) ? route.low : routeAverage(route);
  const average = Math.round(base * multiplier);
  return {
    low: Math.round(average * 0.88), high: Math.round(average * 1.12), average, currency: "USD",
    priceSource: "deterministic_route_market_estimate", priceLastChecked: UPDATED,
    confidence: ROUTE_OVERRIDES[`${origin}:${airport}`] ? 0.62 : route.distanceMiles ? 0.5 : regionFor(origin) === "unknown" ? 0.3 : 0.4, isLive: false,
    cabinClass: "economy", tripType: "round_trip", basis: "Modeled monthly planning average; confirm a live fare before booking",
    monthlyAverageEconomyRoundTrip: MONTH_NAMES.map((monthName, index) => ({ month: index + 1, monthName, average: Math.round(routeAverage(route) * monthMultiplier(index + 1)) })),
  };
}

export function assessTravelFeasibility(profile, destination) {
  const origin = String(profile?.origin || "").toUpperCase();
  const airport = String(destination?.airport || "").toUpperCase();
  if (!origin || !airport) return { score: 50, status: "unknown", reason: "Origin airport required for route feasibility", estimatedFlightDuration: null, estimatedConnections: null, airportBuffer: 4, timeZoneShift: null, estimatedDoorToDestinationTime: null, travelDayImpact: null, usableDestinationTime: null };
  const route = routeFor(profile, destination);
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

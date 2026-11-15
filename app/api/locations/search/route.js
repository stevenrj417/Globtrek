import airports from "../../../data/airports.json" with { type: "json" };
import airportCoords from "../../../data/airportCoords.json" with { type: "json" };
import { GooglePlacesHotelProvider } from "../../../lib/google-places/GooglePlacesHotelProvider";
import { airportByIata } from "../../../lib/recommendation/travelArea";
import { normalizeLocationPlace } from "../../../lib/recommendation/locationSearch";
import { sharedRateLimit } from "../../../lib/security/rateLimit";

const cache = globalThis.__globtrekLocationSearchCache || new Map();
globalThis.__globtrekLocationSearchCache = cache;
const airportIndex = airports.filter((airport) => airport.scheduled);

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

// Airports matching a code, city or airport name, from our own list. Used when Google Places
// is unavailable, so travelers can still pick a starting point.
function localAirportResults(query, limit = 6) {
  const value = query.trim().toLowerCase();
  if (value.length < 2) return [];
  return airportIndex
    .map((airport) => {
      const code = airport.code.toLowerCase(); const city = airport.city.toLowerCase(); const name = airport.name.toLowerCase();
      const rank = code === value ? 0 : city === value ? 1 : city.startsWith(value) ? 2 : code.startsWith(value) ? 3 : name.startsWith(value) ? 4 : `${city} ${name}`.includes(value) ? 5 : 99;
      return { airport, rank };
    })
    .filter(({ airport, rank }) => rank < 99 && airportCoords[airport.code])
    .sort((a, b) => a.rank - b.rank || a.airport.city.localeCompare(b.airport.city))
    .slice(0, limit)
    .map(({ airport }) => {
      const [latitude, longitude] = airportCoords[airport.code];
      const place = `${airport.city || airport.name}${airport.region ? `, ${airport.region}` : ""}`;
      return { type: "airport", placeId: `airport:${airport.code}`, city: airport.city || airport.name, countryCode: airport.country, countryName: regionNames.of(airport.country) || airport.country, latitude, longitude, airportCode: airport.code, airportName: airport.name, formattedAddress: `${airport.name}, ${place}`, googleMapsUri: null, verificationSource: "ourairports" };
    });
}

function airportMatch(query) {
  const exact = airportByIata(query);
  if (exact) return exact;
  const value = query.toLowerCase();
  return airportIndex.find((airport) => airport.name.toLowerCase() === value) || null;
}

export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "locations", limit: 60 });
  if (limited) return limited;
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) || "";
  if (query.length < 2) return Response.json({ locations: [] });
  const key = query.toLowerCase();
  const hit = cache.get(key);
  if (hit?.expiresAt > Date.now()) return Response.json({ locations: hit.locations });
  const knownAirport = airportMatch(query);
  const textQuery = knownAirport ? `${knownAirport.name}, ${knownAirport.city}, ${knownAirport.country}` : query;
  try {
    const provider = new GooglePlacesHotelProvider({ maxRetries: 1 });
    const payload = await provider.request("/places:searchText", { method: "POST", body: { textQuery, maxResultCount: knownAirport ? 1 : 6 }, fieldMask: "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents,places.googleMapsUri" });
    const allowed = new Set(["airport", "locality", "postal_town", "administrative_area_level_1", "administrative_area_level_2", "street_address", "premise", "route", "postal_code"]);
    const locations = (payload.places || []).filter((place) => knownAirport || place.types?.some((type) => allowed.has(type))).map((place) => normalizeLocationPlace(place, { airportCode: knownAirport?.code || null })).filter((place) => place?.countryCode).slice(0, 6);
    cache.set(key, { locations, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    return Response.json({ locations });
  } catch {
    // Google Places is down or refusing requests: fall back to airports, which every quiz accepts.
    const locations = localAirportResults(query);
    if (locations.length) return Response.json({ locations, fallback: "airports" });
    return Response.json({ error: "Location search temporarily unavailable", locations: [] }, { status: 503 });
  }
}

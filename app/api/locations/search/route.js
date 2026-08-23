import airports from "../../../data/airports.json" with { type: "json" };
import { GooglePlacesHotelProvider } from "../../../lib/google-places/GooglePlacesHotelProvider";
import { airportByIata } from "../../../lib/recommendation/travelArea";
import { normalizeLocationPlace } from "../../../lib/recommendation/locationSearch";

const cache = globalThis.__globtrekLocationSearchCache || new Map();
globalThis.__globtrekLocationSearchCache = cache;
const airportIndex = airports.filter((airport) => airport.scheduled);

function airportMatch(query) {
  const exact = airportByIata(query);
  if (exact) return exact;
  const value = query.toLowerCase();
  return airportIndex.find((airport) => airport.name.toLowerCase() === value) || null;
}

export async function GET(request) {
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
  } catch { return Response.json({ error: "Location search temporarily unavailable", locations: [] }, { status: 503 }); }
}

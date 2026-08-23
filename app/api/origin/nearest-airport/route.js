import airports from "../../../data/airports.json" with { type: "json" };
import { GooglePlacesHotelProvider } from "../../../lib/google-places/GooglePlacesHotelProvider";
import { matchAirportPlaces } from "../../../lib/recommendation/nearestAirport";
import { structuredOrigin } from "../../../lib/recommendation/travelArea";

export async function POST(request) {
  const input = await request.json().catch(() => null);
  const latitude = Number(input?.latitude);
  const longitude = Number(input?.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return Response.json({ error: "Invalid location" }, { status: 400 });
  try {
    const provider = new GooglePlacesHotelProvider({ maxRetries: 1 });
    const payload = await provider.request("/places:searchNearby", { method: "POST", body: { includedTypes: ["airport"], maxResultCount: 8, rankPreference: "DISTANCE", locationRestriction: { circle: { center: { latitude, longitude }, radius: 100000 } } }, fieldMask: "places.displayName,places.formattedAddress,places.location,places.types" });
    const airport = matchAirportPlaces(payload.places || [], airports);
    if (!airport) return Response.json({ error: "No confident airport match" }, { status: 422 });
    return Response.json({ origin: structuredOrigin(airport.code) });
  } catch {
    return Response.json({ error: "Location lookup unavailable" }, { status: 503 });
  }
}

import { roadTripRoutes } from "../../../data/roadTripRoutes";

export const revalidate = 86_400;

function fallbackGeometry(route) { return route.stops.map((stop) => [stop.longitude, stop.latitude]); }
function waypoint(stop) { return { location: { latLng: { latitude: stop.latitude, longitude: stop.longitude } } }; }
function durationSeconds(value) { const seconds = Number(String(value || "").replace(/s$/, "")); return Number.isFinite(seconds) ? seconds : null; }
function decodePolyline(encoded) {
  const coordinates = [];
  let index = 0; let latitude = 0; let longitude = 0;
  while (index < encoded.length) {
    let result = 0; let shift = 0; let byte;
    do { byte = encoded.charCodeAt(index) - 63; index += 1; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { byte = encoded.charCodeAt(index) - 63; index += 1; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push([longitude / 1e5, latitude / 1e5]);
  }
  return coordinates;
}

export async function GET(request) {
  const routeId = new URL(request.url).searchParams.get("id");
  const route = roadTripRoutes.find((candidate) => candidate.id === routeId);
  if (!route) return Response.json({ error: "Unknown route" }, { status: 400 });
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Response.json({ coordinates: fallbackGeometry(route), source: "Verified stop progression", distanceMeters: null, durationSeconds: null });
  try {
    const [origin, ...remaining] = route.stops;
    const destination = remaining.at(-1);
    const intermediates = remaining.slice(0, -1).map(waypoint);
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: process.env.NEXT_PUBLIC_SITE_URL || "https://www.glob-trek.com/", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline" },
      body: JSON.stringify({ origin: waypoint(origin), destination: waypoint(destination), intermediates, travelMode: "DRIVE", routingPreference: "TRAFFIC_UNAWARE", polylineQuality: "OVERVIEW", polylineEncoding: "ENCODED_POLYLINE" }),
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`routes_${response.status}`);
    const payload = await response.json();
    const computed = payload?.routes?.[0];
    const coordinates = decodePolyline(computed?.polyline?.encodedPolyline || "");
    if (coordinates.length < 2) throw new Error("route_geometry_missing");
    return Response.json({ coordinates, source: "Google Routes API", distanceMeters: computed.distanceMeters || null, durationSeconds: durationSeconds(computed.duration) });
  } catch (error) {
    console.warn("Google route geometry unavailable; returning verified stop progression.", error instanceof Error ? error.message : "unknown");
    return Response.json({ coordinates: fallbackGeometry(route), source: "Verified stop progression", distanceMeters: null, durationSeconds: null });
  }
}

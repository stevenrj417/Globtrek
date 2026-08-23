import { roadTripRoutes } from "../../../data/roadTripRoutes";

export const revalidate = 86_400;

function fallbackGeometry(route) {
  return route.stops.map((stop) => [stop.longitude, stop.latitude]);
}

export async function GET(request) {
  const routeId = new URL(request.url).searchParams.get("id");
  const route = roadTripRoutes.find((candidate) => candidate.id === routeId);
  if (!route) return Response.json({ error: "Unknown route" }, { status: 400 });
  const waypoints = route.stops.map((stop) => `${stop.longitude},${stop.latitude}`).join(";");
  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`, { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`route_${response.status}`);
    const payload = await response.json();
    const coordinates = payload?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) throw new Error("route_geometry_missing");
    return Response.json({ coordinates, source: "OpenStreetMap routing", distanceMeters: payload.routes[0].distance, durationSeconds: payload.routes[0].duration });
  } catch (error) {
    console.warn("Road geometry unavailable; returning verified stop progression.", error instanceof Error ? error.message : "unknown");
    return Response.json({ coordinates: fallbackGeometry(route), source: "Verified stop progression", distanceMeters: null, durationSeconds: null });
  }
}

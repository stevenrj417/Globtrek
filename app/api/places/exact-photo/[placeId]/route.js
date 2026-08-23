import { exactPlacePhotos } from "../../../../data/journeyDiscovery";
import { GooglePlacesHotelProvider } from "../../../../lib/google-places/GooglePlacesHotelProvider";

const cache = globalThis.__globtrekExactPhotoCache || new Map();
globalThis.__globtrekExactPhotoCache = cache;

export async function GET(_request, { params }) {
  const { placeId } = await params;
  const known = exactPlacePhotos[placeId];
  if (!known) return Response.json({ error: "Unknown exact place" }, { status: 404 });
  const hit = cache.get(placeId);
  if (hit?.expiresAt > Date.now()) return Response.json(hit.value, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
  try {
    const manifest = await new GooglePlacesHotelProvider({ maxRetries: 1 }).getPhotoManifest(placeId, { limit: 1, maxWidthPx: 1800 });
    const photo = manifest.photos[0];
    if (!photo?.photoUri) return Response.json({ error: "No exact photo available", place: known }, { status: 404 });
    const value = { imageUrl: photo.photoUri, placeId, placeLabel: known.label, sourceUrl: photo.googleMapsUri || manifest.googleMapsUri || known.sourceUrl, authorAttributions: photo.authorAttributions || [], verifiedBy: "google_places" };
    cache.set(placeId, { value, expiresAt: Date.now() + 45 * 60 * 1000 });
    return Response.json(value, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
  } catch { return Response.json({ error: "Exact photo temporarily unavailable", place: known }, { status: 503 }); }
}

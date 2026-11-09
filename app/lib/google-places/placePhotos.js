import { GooglePlacesHotelProvider } from "./GooglePlacesHotelProvider.js";

// Each place's own Google photo, for cards that name a specific restaurant or
// sight. Google's photo links are short-lived, so they are fetched per request
// and cached briefly in memory. A place without a photo keeps imageUrl null and
// its card shows no picture rather than an unrelated city view.
const TTL_MS = 45 * 60 * 1000;
const cache = globalThis.__globtrekPlacePhotoCache || new Map();
globalThis.__globtrekPlacePhotoCache = cache;

async function photoFor(provider, placeId) {
  const hit = cache.get(placeId);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  let value = null;
  try {
    const manifest = await provider.getPhotoManifest(placeId, { limit: 1, maxWidthPx: 1200 });
    const photo = manifest.photos?.[0];
    if (photo?.photoUri) value = { imageUrl: photo.photoUri, imageSourceUrl: photo.googleMapsUri || manifest.googleMapsUri || null, imageAttribution: photo.authorAttributions || [] };
  } catch {}
  cache.set(placeId, { value, expiresAt: Date.now() + (value ? TTL_MS : TTL_MS / 3) });
  return value;
}

export async function withPlacePhotos(items, { provider = null } = {}) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !provider) return items;
  const places = provider || new GooglePlacesHotelProvider({ maxRetries: 1 });
  return Promise.all(items.map(async (item) => {
    if (item.imageUrl || !item.googlePlaceId) return item;
    const photo = await photoFor(places, item.googlePlaceId);
    return photo ? { ...item, ...photo } : item;
  }));
}

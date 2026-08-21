import { GooglePlacesHotelProvider, distanceMeters } from "./GooglePlacesHotelProvider.js";

const RESTAURANT_TYPES = new Set(["restaurant", "cafe", "bakery", "bar", "meal_takeaway"]);
const ACTIVITY_TYPES = new Set(["tourist_attraction", "museum", "art_gallery", "park", "national_park", "historical_landmark", "cultural_landmark", "beach", "hiking_area", "market"]);
const cache = globalThis.__globtrekPlacesDiscoveryCache || new Map();
globalThis.__globtrekPlacesDiscoveryCache = cache;

function cacheKey(kind, destination) { return `${kind}:${destination.id || destination.airport}`; }
function cached(key) { const item = cache.get(key); return item && item.expiresAt > Date.now() ? item.value : null; }
function remember(key, value) { cache.set(key, { value, expiresAt: Date.now() + 86400000 }); return value; }
function placeName(place) { return place.displayName?.text?.trim() || ""; }
function score(place) { return (Number(place.rating) || 0) * 20 + Math.log10(Math.max(1, Number(place.userRatingCount) || 0)) * 8; }
function category(place, fallback) { return (place.primaryType || place.types?.find((type) => !["point_of_interest", "establishment"].includes(type)) || fallback).replaceAll("_", " "); }

export class GooglePlacesDiscoveryProvider extends GooglePlacesHotelProvider {
  async searchNearby(destination, { textQuery, includedType, limit, allowedTypes }) {
    const hasCoordinates = Number.isFinite(Number(destination.latitude)) && Number.isFinite(Number(destination.longitude));
    const locationBias = hasCoordinates ? { circle: { center: { latitude: Number(destination.latitude), longitude: Number(destination.longitude) }, radius: 40000 } } : undefined;
    const payload = await this.request("/places:searchText", { method: "POST", body: { textQuery, includedType, strictTypeFiltering: false, maxResultCount: Math.min(20, Math.max(limit * 2, limit)), ...(locationBias ? { locationBias } : {}) }, fieldMask: "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.businessStatus,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.websiteUri,places.photos" });
    return (payload.places || []).filter((place) => placeName(place) && (!place.businessStatus || place.businessStatus === "OPERATIONAL") && (place.types || []).some((type) => allowedTypes.has(type)) && (!hasCoordinates || (distanceMeters(destination, place.location) ?? 0) <= 60000)).sort((a, b) => score(b) - score(a)).slice(0, limit);
  }

  async firstPhoto(place) {
    const photo = place.photos?.[0];
    if (!photo?.name) return { imageUrl: null, imageAttribution: [], imageSourceUrl: place.googleMapsUri || null };
    try { const media = await this.getPhotoMedia(photo.name, { maxWidthPx: 1200 }); return { imageUrl: media.photoUri || null, imageAttribution: photo.authorAttributions || [], imageSourceUrl: photo.googleMapsUri || place.googleMapsUri || null }; }
    catch { return { imageUrl: null, imageAttribution: [], imageSourceUrl: place.googleMapsUri || null }; }
  }

  async discoverRestaurants(destination, { limit = 3 } = {}) {
    const key = cacheKey("restaurants", destination); const hit = cached(key); if (hit) return hit.slice(0, limit);
    const places = await this.searchNearby(destination, { textQuery: `restaurants in ${destination.city}, ${destination.country}`, includedType: "restaurant", limit: Math.max(3, limit), allowedTypes: RESTAURANT_TYPES });
    const records = await Promise.all(places.map(async (place) => ({ id: `google:${place.id}`, destinationId: destination.id || destination.airport, name: placeName(place), description: null, cuisine: [], neighborhood: place.formattedAddress || null, priceLevel: place.priceLevel || null, latitude: place.location?.latitude ?? null, longitude: place.location?.longitude ?? null, provider: "google_places", providerId: place.id, bookingUrl: null, detailsUrl: place.googleMapsUri || place.websiteUri || null, rating: Number(place.rating) || null, reviewCount: Number(place.userRatingCount) || null, category: category(place, "restaurant"), verifiedAt: new Date().toISOString(), ...(await this.firstPhoto(place)) })));
    return remember(key, records).slice(0, limit);
  }

  async discoverActivities(destination, { limit = 12 } = {}) {
    const key = cacheKey("activities", destination); const hit = cached(key); if (hit) return hit.slice(0, limit);
    const places = await this.searchNearby(destination, { textQuery: `top attractions and things to do in ${destination.city}, ${destination.country}`, includedType: "tourist_attraction", limit: Math.max(12, limit), allowedTypes: ACTIVITY_TYPES });
    const records = places.map((place) => ({ id: `google:${place.id}`, destinationId: destination.id || destination.airport, name: placeName(place), description: null, category: category(place, "local"), location: place.formattedAddress || null, latitude: place.location?.latitude ?? null, longitude: place.location?.longitude ?? null, provider: "google_places", providerId: place.id, bookingUrl: null, detailsUrl: place.googleMapsUri || place.websiteUri || null, rating: Number(place.rating) || null, reviewCount: Number(place.userRatingCount) || null, imageUrl: null, imageAttribution: [], verifiedAt: new Date().toISOString() }));
    return remember(key, records).slice(0, limit);
  }
}

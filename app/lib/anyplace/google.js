// Server-only Google Places (New) calls for "any place" search.
//
// Key: GOOGLE_PLACES_API_KEY, read on the server and never sent to the browser.
// Cost: every call names only the fields it needs (X-Goog-FieldMask), because
// Google bills each call at the priciest field it returns.
// Terms: Places content (names, ratings, photos) is fetched when it is shown and
// never stored; only place IDs are kept (Google Maps Platform Terms 3.2.3).

const ROOT = "https://places.googleapis.com/v1";

export class PlacesError extends Error {
  constructor(code, status = null) { super(code); this.name = "PlacesError"; this.code = code; this.status = status; }
}

export function placesKey(env = process.env) {
  return env.GOOGLE_PLACES_API_KEY || null;
}

// Fields for ranking a search result (rating and price push this to Google's Enterprise tier).
export const SEARCH_FIELDS = ["id", "displayName", "types", "primaryType", "location", "rating", "userRatingCount", "priceLevel", "businessStatus", "formattedAddress"].map((field) => `places.${field}`).join(",");
// Lodging searches also need the town each place is in, to search CJ by that name.
export const LODGING_FIELDS = `${SEARCH_FIELDS},places.addressComponents`;
// Shown on a pick's row, fetched fresh each time the page is viewed.
export const PICK_FIELDS = "id,displayName,primaryType,primaryTypeDisplayName,rating,userRatingCount,priceLevel,googleMapsUri,businessStatus,photos";
// The destination itself: where it is, its name and a photo for the page.
export const DESTINATION_FIELDS = "id,displayName,formattedAddress,location,viewport,addressComponents,types,photos,googleMapsUri";

export function createPlacesClient({ key = placesKey(), fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  let calls = 0;
  async function call(path, { method = "GET", body, fieldMask, query } = {}) {
    if (!key) throw new PlacesError("google_places_not_configured");
    calls += 1;
    const url = `${ROOT}${path}${query ? `?${new URLSearchParams(query)}` : ""}`;
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, ...(fieldMask ? { "X-Goog-FieldMask": fieldMask } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
    } catch {
      throw new PlacesError("google_places_network_error");
    }
    if (response.status === 404) return null;
    if (!response.ok) throw new PlacesError(response.status === 429 ? "google_places_rate_limited" : `google_places_http_${response.status}`, response.status);
    return response.json();
  }

  return {
    stats: () => ({ calls }),

    // Suggestions for the search box. The session token ties these keystrokes to
    // the Place Details call that follows, which Google bills as one session.
    async autocomplete(input, { sessionToken, languageCode = "en", types = ["locality", "administrative_area_level_3", "postal_town", "sublocality", "natural_feature"] } = {}) {
      const payload = await call("/places:autocomplete", { method: "POST", fieldMask: "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types", body: { input, sessionToken, languageCode, includedPrimaryTypes: types } });
      return (payload?.suggestions || []).map((item) => item.placePrediction).filter(Boolean).map((prediction) => ({
        placeId: prediction.placeId,
        name: prediction.structuredFormat?.mainText?.text || "",
        detail: prediction.structuredFormat?.secondaryText?.text || "",
      })).filter((item) => item.placeId && item.name);
    },

    details(placeId, fieldMask, { sessionToken } = {}) {
      return call(`/places/${encodeURIComponent(placeId)}`, { fieldMask, query: sessionToken ? { sessionToken } : undefined });
    },

    async nearby({ center, radiusM, includedTypes, max = 20, fieldMask = SEARCH_FIELDS }) {
      const payload = await call("/places:searchNearby", { method: "POST", fieldMask, body: { includedTypes, maxResultCount: max, rankPreference: "POPULARITY", locationRestriction: { circle: { center: { latitude: center.latitude, longitude: center.longitude }, radius: Math.min(50000, Math.round(radiusM)) } } } });
      return payload?.places || [];
    },

    async text({ textQuery, center, radiusM, includedType, priceLevels, max = 20, fieldMask = SEARCH_FIELDS }) {
      const payload = await call("/places:searchText", { method: "POST", fieldMask, body: { textQuery, pageSize: max, ...(includedType ? { includedType } : {}), ...(priceLevels?.length ? { priceLevels } : {}), ...(center ? { locationBias: { circle: { center: { latitude: center.latitude, longitude: center.longitude }, radius: Math.min(50000, Math.round(radiusM)) } } } : {}) } });
      return payload?.places || [];
    },

    // A short-lived photo link. Google requires the photo's author attributions next to it.
    async photo(photoName, { maxWidthPx = 1800 } = {}) {
      const payload = await call(`/${photoName}/media`, { query: { maxWidthPx: String(maxWidthPx), skipHttpRedirect: "true" } });
      return payload?.photoUri || null;
    },
  };
}

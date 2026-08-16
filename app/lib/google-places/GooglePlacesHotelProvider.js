const API_ROOT = "https://places.googleapis.com/v1";
const HOTEL_TYPES = new Set(["hotel", "lodging", "resort_hotel", "motel", "bed_and_breakfast", "guest_house", "hostel"]);

export class GooglePlacesError extends Error {
  constructor(code, message = code, status = null) {
    super(message);
    this.name = "GooglePlacesError";
    this.code = code;
    this.status = status;
  }
}

export function normalizePlaceText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bbvlgari\b/g, "bulgari")
    .replace(/\btwenty[ -]two\b/g, "22")
    .replace(/\btwelve\b/g, "12")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\bstreet\b/g, "st")
    .replace(/\broad\b/g, "rd")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\b(the|hotel|resort|spa|and)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value) {
  return new Set(normalizePlaceText(value).split(" ").filter((token) => token.length > 1));
}

export function nameSimilarity(expected, actual) {
  const left = normalizePlaceText(expected);
  const right = normalizePlaceText(actual);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (` ${right} `.includes(` ${left} `) || ` ${left} `.includes(` ${right} `)) return 1;
  const a = tokens(left);
  const b = tokens(right);
  const overlap = [...a].filter((token) => b.has(token)).length;
  const precision = overlap / Math.max(1, b.size);
  const recall = overlap / Math.max(1, a.size);
  return precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
}

export function distanceMeters(a, b) {
  if (![a?.latitude, a?.longitude, b?.latitude, b?.longitude].every((value) => Number.isFinite(Number(value)))) return null;
  const radians = (degrees) => degrees * Math.PI / 180;
  const earth = 6371000;
  const lat1 = radians(Number(a.latitude));
  const lat2 = radians(Number(b.latitude));
  const deltaLat = lat2 - lat1;
  const deltaLon = radians(Number(b.longitude) - Number(a.longitude));
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function localityScore(hotel, place) {
  const address = normalizePlaceText(place.formattedAddress);
  const variants = (value) => {
    const normalized = normalizePlaceText(value);
    const aliases = {
      "new york city": ["new york"],
      "united states": ["usa", "united states"],
      "united kingdom": ["uk", "united kingdom", "england", "scotland", "wales"],
      "south korea": ["south korea", "republic of korea", "korea"],
      "argentina chile": ["argentina", "chile"],
    };
    return [...new Set([normalized, ...(aliases[normalized] || [])].filter(Boolean))];
  };
  const signals = [hotel.city, hotel.region, hotel.country].filter(Boolean).map(variants);
  if (!signals.length) return 0.5;
  return signals.filter((alternatives) => alternatives.some((signal) => address.includes(signal))).length / signals.length;
}

export function scoreHotelPlaceMatch(hotel, place) {
  const placeName = place.displayName?.text || "";
  const nameScore = nameSimilarity(hotel.name, placeName);
  const typeVerified = (place.types || []).some((type) => HOTEL_TYPES.has(type));
  const locality = localityScore(hotel, place);
  const addressScore = hotel.address ? nameSimilarity(hotel.address, place.formattedAddress) : null;
  const addressVerified = addressScore != null && addressScore >= 0.92;
  const distance = distanceMeters(hotel, place.location);
  const coordinateScore = distance == null ? 0.5 : distance <= 2000 ? 1 : distance <= 10000 ? 0.7 : distance <= 30000 ? 0.3 : 0;
  const hardRejectReasons = [];
  if (!typeVerified) hardRejectReasons.push("wrong_business_type");
  if (nameScore < 0.68 && !(addressVerified && nameScore >= 0.5)) hardRejectReasons.push("name_mismatch");
  if (distance != null && distance > 50000) hardRejectReasons.push("coordinate_mismatch");
  if (distance == null && locality === 0 && !addressVerified) hardRejectReasons.push("wrong_locality");
  const baseConfidence = nameScore * 0.55 + locality * 0.2 + coordinateScore * 0.15 + (typeVerified ? 0.1 : 0);
  const confidence = Number(Math.max(baseConfidence, addressVerified && typeVerified && nameScore >= 0.5 ? 0.9 : 0).toFixed(4));
  return {
    confidence,
    verified: hardRejectReasons.length === 0 && confidence >= 0.82,
    needsReview: hardRejectReasons.length > 0 || confidence < 0.82,
    hardRejectReasons,
    evidence: {
      nameScore: Number(nameScore.toFixed(4)),
      localityScore: Number(locality.toFixed(4)),
      coordinateScore,
      distanceMeters: distance == null ? null : Math.round(distance),
      typeVerified,
      addressScore: addressScore == null ? null : Number(addressScore.toFixed(4)),
      addressVerified,
    },
  };
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.("retry-after"));
  return Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.min(5000, retryAfter * 1000) : Math.min(4000, 250 * (2 ** attempt));
}

export class GooglePlacesHotelProvider {
  constructor({ apiKey = process.env.GOOGLE_PLACES_API_KEY, fetchImpl = fetch, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), maxRetries = 3 } = {}) {
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.sleep = sleep;
    this.maxRetries = maxRetries;
  }

  requireApiKey() {
    if (!this.apiKey) throw new GooglePlacesError("google_places_api_key_missing");
  }

  async request(path, { method = "GET", body, fieldMask } = {}) {
    this.requireApiKey();
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      let response;
      try {
        response = await this.fetchImpl(`${API_ROOT}${path}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            ...(fieldMask ? { "X-Goog-FieldMask": fieldMask } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      } catch (error) {
        lastError = new GooglePlacesError("google_places_network_error", error.message);
        if (attempt < this.maxRetries) { await this.sleep(250 * (2 ** attempt)); continue; }
        throw lastError;
      }
      if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
        await this.sleep(retryDelay(response, attempt));
        continue;
      }
      if (!response.ok) throw new GooglePlacesError(response.status === 429 ? "google_places_rate_limited" : "google_places_api_error", `Google Places request failed (${response.status})`, response.status);
      try { return await response.json(); }
      catch { throw new GooglePlacesError("google_places_invalid_response"); }
    }
    throw lastError || new GooglePlacesError("google_places_api_error");
  }

  async searchHotel(hotel) {
    const locationBias = [hotel.latitude, hotel.longitude].every((value) => Number.isFinite(Number(value))) ? {
      circle: { center: { latitude: Number(hotel.latitude), longitude: Number(hotel.longitude) }, radius: 30000 },
    } : undefined;
    const body = {
      textQuery: [hotel.name, hotel.address, hotel.city, hotel.region, hotel.country].filter(Boolean).join(", "),
      includedType: "lodging",
      strictTypeFiltering: false,
      maxResultCount: 5,
      ...(locationBias ? { locationBias } : {}),
    };
    const payload = await this.request("/places:searchText", {
      method: "POST",
      body,
      fieldMask: "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.businessStatus",
    });
    if (!Array.isArray(payload.places)) throw new GooglePlacesError("google_places_invalid_response");
    return payload.places;
  }

  async matchHotel(hotel) {
    const candidates = await this.searchHotel(hotel);
    if (!candidates.length) return { status: "not_found", verified: false, needsReview: true, candidates: 0 };
    const ranked = candidates.map((place) => ({ place, ...scoreHotelPlaceMatch(hotel, place) })).sort((a, b) => b.confidence - a.confidence);
    const best = ranked[0];
    if (!best.verified) return { status: "rejected", verified: false, needsReview: true, candidates: candidates.length, confidence: best.confidence, evidence: best.evidence, reasons: best.hardRejectReasons };
    return { status: "matched", verified: true, needsReview: false, candidates: candidates.length, placeId: best.place.id, confidence: best.confidence, evidence: best.evidence };
  }

  async getPlaceDetails(placeId, { includePhotos = true } = {}) {
    if (!placeId || /[/?#]/.test(placeId)) throw new GooglePlacesError("invalid_google_place_id");
    const fields = ["id", "displayName", "formattedAddress", "location", "types", "businessStatus", "googleMapsUri", "attributions"];
    if (includePhotos) fields.push("photos");
    return this.request(`/places/${encodeURIComponent(placeId)}`, { fieldMask: fields.join(",") });
  }

  async getPhotoMedia(photoName, { maxWidthPx = 1200 } = {}) {
    if (!/^places\/[^/]+\/photos\/[^/]+$/.test(photoName || "")) throw new GooglePlacesError("invalid_google_photo_resource");
    return this.request(`/${photoName}/media?maxWidthPx=${Math.min(4800, Math.max(400, maxWidthPx))}&skipHttpRedirect=true`);
  }

  async getPhotoManifest(placeId, { limit = 3, maxWidthPx = 1200 } = {}) {
    const place = await this.getPlaceDetails(placeId, { includePhotos: true });
    const photos = Array.isArray(place.photos) ? place.photos.slice(0, Math.max(0, Math.min(10, limit))) : [];
    const resolved = [];
    for (const photo of photos) {
      try {
        const media = await this.getPhotoMedia(photo.name, { maxWidthPx });
        if (!media.photoUri) continue;
        resolved.push({
          photoUri: media.photoUri,
          widthPx: photo.widthPx || null,
          heightPx: photo.heightPx || null,
          authorAttributions: Array.isArray(photo.authorAttributions) ? photo.authorAttributions.map(({ displayName, uri, photoUri }) => ({ displayName, uri, photoUri })) : [],
          googleMapsUri: photo.googleMapsUri || place.googleMapsUri || null,
        });
      } catch (error) {
        if (error.code === "google_places_rate_limited") throw error;
      }
    }
    return { photos: resolved, googleMapsUri: place.googleMapsUri || null };
  }
}

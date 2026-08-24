import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GooglePlacesHotelProvider, distanceMeters, nameSimilarity, scoreHotelPlaceMatch } from "../app/lib/google-places/GooglePlacesHotelProvider.js";
import { GooglePlacesDiscoveryProvider } from "../app/lib/google-places/GooglePlacesDiscoveryProvider.js";
import { processGooglePlacesBatch } from "../scripts/hotels/google-places-match.mjs";

const kyotoHotel = { name: "Six Senses Kyoto", city: "Kyoto", country: "Japan", destinationId: "KIX", provider: "booking_com_cj", bookingComPropertyUrl: "https://www.booking.com/hotel/jp/six-senses-kyoto.html", cjTrackingUrl: "https://www.kqzyfj.com/click-101801755-17293132" };
const correctPlace = { id: "place-kyoto", displayName: { text: "Six Senses Kyoto" }, formattedAddress: "431 Myohoin Maekawacho, Higashiyama Ward, Kyoto, Japan", location: { latitude: 34.991, longitude: 135.772 }, types: ["hotel", "lodging"] };

function response(json, status = 200, headers = {}) {
  return { ok: status >= 200 && status < 300, status, headers: { get: (name) => headers[name.toLowerCase()] ?? null }, json: async () => json };
}

function queuedFetch(items, calls = []) {
  return async (url, options) => {
    calls.push({ url, options });
    const item = items.shift();
    if (item instanceof Error) throw item;
    return item;
  };
}

test("missing coordinates never become the Gulf of Guinea", () => {
  assert.equal(distanceMeters({ latitude: null, longitude: null }, { latitude: 35.6762, longitude: 139.6503 }), null);
  assert.equal(distanceMeters({ latitude: "", longitude: "" }, { latitude: 35.6762, longitude: 139.6503 }), null);
});

test("restaurant discovery returns three real provider identities with attributed photos", async () => {
  const place = (index) => ({ id: `restaurant-${index}`, displayName: { text: `Restaurant ${index}` }, formattedAddress: "Paris, France", location: { latitude: 48.8566, longitude: 2.3522 }, types: ["restaurant"], primaryType: "restaurant", businessStatus: "OPERATIONAL", rating: 4.8, userRatingCount: 100 + index, googleMapsUri: `https://maps.google.com/?cid=${index}`, photos: [{ name: `places/restaurant-${index}/photos/photo-${index}`, authorAttributions: [{ displayName: `Author ${index}`, uri: `https://maps.google.com/author/${index}` }] }] });
  const provider = new GooglePlacesDiscoveryProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ places: [place(1), place(2), place(3), place(4)] }), response({ photoUri: "https://lh3.googleusercontent.com/1" }), response({ photoUri: "https://lh3.googleusercontent.com/2" }), response({ photoUri: "https://lh3.googleusercontent.com/3" })]) });
  const records = await provider.discoverRestaurants({ id: "test-paris", city: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 }, { limit: 3 });
  assert.equal(records.length, 3);
  assert.ok(records.every((item) => item.providerId && item.detailsUrl && item.imageAttribution.length === 1));
  assert.ok(records.every((item) => item.bookingUrl === null));
});

test("featured activity discovery includes exact-place photography", async () => {
  const place = (index) => ({ id: `activity-${index}`, displayName: { text: `Attraction ${index}` }, formattedAddress: "Paris, France", location: { latitude: 48.8566, longitude: 2.3522 }, types: ["tourist_attraction"], primaryType: "tourist_attraction", businessStatus: "OPERATIONAL", rating: 4.7, userRatingCount: 200 + index, googleMapsUri: `https://maps.google.com/?cid=activity-${index}`, photos: [{ name: `places/activity-${index}/photos/photo-${index}`, authorAttributions: [{ displayName: `Author ${index}` }] }] });
  const provider = new GooglePlacesDiscoveryProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ places: [place(1), place(2), place(3)] }), response({ photoUri: "https://lh3.googleusercontent.com/activity-1" }), response({ photoUri: "https://lh3.googleusercontent.com/activity-2" }), response({ photoUri: "https://lh3.googleusercontent.com/activity-3" })]) });
  const records = await provider.discoverActivities({ id: "test-paris-activities", city: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 }, { limit: 3 });
  assert.equal(records.length, 3);
  assert.ok(records.every((item) => item.imageUrl?.includes("googleusercontent.com") && item.imageSourceUrl));
});

test("city discovery without coordinates rejects wrong-city attractions", async () => {
  const tokyo = { id: "tokyo-no-center", city: "Tokyo", country: "Japan", destinationType: "city", hotelSearchAliases: ["Tokyo"] };
  const local = { id: "tokyo-attraction", displayName: { text: "Tokyo Landmark" }, formattedAddress: "Chiyoda City, Tokyo, Japan", types: ["tourist_attraction"], businessStatus: "OPERATIONAL", rating: 4.7, userRatingCount: 200, googleMapsUri: "https://maps.google.com/tokyo", photos: [] };
  const wrong = { ...local, id: "kyoto-attraction", displayName: { text: "Kyoto Landmark" }, formattedAddress: "Kyoto, Japan", googleMapsUri: "https://maps.google.com/kyoto" };
  const provider = new GooglePlacesDiscoveryProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ places: [wrong, local] })]) });
  const records = await provider.discoverActivities(tokyo, { limit: 3 });
  assert.deepEqual(records.map((item) => item.providerId), ["tokyo-attraction"]);
});

test("hotel discovery stages nine identities but never invents Booking links", async () => {
  const places = Array.from({ length: 10 }, (_, index) => ({ id: `hotel-${index}`, displayName: { text: `Hotel ${index}` }, formattedAddress: "Paris, France", location: { latitude: 48.8566, longitude: 2.3522 }, types: ["hotel", "lodging"], businessStatus: "OPERATIONAL", rating: 4.5, userRatingCount: 200 + index, googleMapsUri: `https://maps.google.com/?cid=hotel-${index}`, photos: [{ name: `places/hotel-${index}/photos/one`, authorAttributions: [{ displayName: "Contributor" }] }] }));
  const provider = new GooglePlacesDiscoveryProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ places })]) });
  const records = await provider.discoverHotelCandidates({ id: "test-paris-hotels", city: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 });
  assert.equal(records.length, 9);
  assert.ok(records.every((item) => item.googlePlaceId && item.photoResources.length === 1));
  assert.ok(records.every((item) => item.bookingComPropertyUrl === null && item.reviewStatus === "needs_classification"));
});

test("correct Google Place hotel match is accepted", () => {
  const scored = scoreHotelPlaceMatch(kyotoHotel, correctPlace);
  assert.equal(scored.verified, true);
  assert.ok(scored.confidence >= 0.82);
});

test("wrong-city hotel match is rejected", () => {
  const scored = scoreHotelPlaceMatch(kyotoHotel, { ...correctPlace, formattedAddress: "Rome, Italy" });
  assert.equal(scored.verified, false);
  assert.ok(scored.hardRejectReasons.includes("wrong_locality"));
});

test("similarly named property is rejected", () => {
  const scored = scoreHotelPlaceMatch(kyotoHotel, { ...correctPlace, displayName: { text: "Six Senses Rome" }, formattedAddress: "Rome, Italy" });
  assert.equal(scored.verified, false);
  assert.ok(scored.hardRejectReasons.includes("name_mismatch"));
});

test("official brand suffix does not reject the same hotel", () => {
  const result = scoreHotelPlaceMatch(
    { name: "Hotel de Crillon", city: "Paris", country: "France" },
    { displayName: { text: "Hotel de Crillon, A Rosewood Hotel" }, formattedAddress: "Paris, France", types: ["hotel"] },
  );
  assert.equal(result.verified, true);
});

test("country aliases support exact US hotel identities", () => {
  const result = scoreHotelPlaceMatch(
    { name: "The Greenwich Hotel", city: "New York City", country: "United States" },
    { displayName: { text: "The Greenwich Hotel" }, formattedAddress: "New York, NY, USA", types: ["hotel"] },
  );
  assert.equal(result.verified, true);
});

test("brand normalization supports official Bulgari spelling", () => {
  assert.equal(nameSimilarity("Bulgari Hotel Roma", "Bvlgari Hotel Roma"), 1);
});

test("hotel address is included in the Google Text Search query", async () => {
  const calls = [];
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ places: [] })], calls) });
  await provider.searchHotel({ ...kyotoHotel, address: "431 Myohoin Maekawacho" });
  assert.match(JSON.parse(calls[0].options.body).textQuery, /431 Myohoin Maekawacho/);
});

test("missing hotel coordinates do not create a zero-coordinate search bias", async () => {
  const calls = [];
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ places: [] })], calls) });
  await provider.searchHotel({ name: "Hotel Example", city: "Cape Town", country: "South Africa", latitude: null, longitude: null });
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.locationBias, undefined);
});

test("trusted exact address can verify a renamed but related hotel listing", () => {
  const result = scoreHotelPlaceMatch(
    { name: "Montage Kapalua Bay", city: "Maui", country: "United States", address: "1 Bay Drive, Lahaina, HI 96761" },
    { displayName: { text: "The Resort at Kapalua Bay, Maui" }, formattedAddress: "1 Bay Dr, Lahaina, HI 96761, USA", types: ["hotel"] },
  );
  assert.equal(result.verified, true);
  assert.equal(result.evidence.addressVerified, true);
});

test("exact address does not verify an unrelated business name", () => {
  const result = scoreHotelPlaceMatch(
    { name: "Montage Kapalua Bay", city: "Maui", country: "United States", address: "1 Bay Drive, Lahaina, HI 96761" },
    { displayName: { text: "Completely Different Property" }, formattedAddress: "1 Bay Dr, Lahaina, HI 96761, USA", types: ["hotel"] },
  );
  assert.equal(result.verified, false);
});

test("wrong business type is rejected", () => {
  const scored = scoreHotelPlaceMatch(kyotoHotel, { ...correctPlace, types: ["restaurant", "food"] });
  assert.equal(scored.verified, false);
  assert.ok(scored.hardRejectReasons.includes("wrong_business_type"));
});

test("coordinate mismatch is rejected", () => {
  const scored = scoreHotelPlaceMatch({ ...kyotoHotel, latitude: 35, longitude: 135.77 }, { ...correctPlace, location: { latitude: 36, longitude: 136.8 } });
  assert.equal(scored.verified, false);
  assert.ok(scored.hardRejectReasons.includes("coordinate_mismatch"));
  assert.ok(distanceMeters({ latitude: 35, longitude: 135.77 }, { latitude: 36, longitude: 136.8 }) > 50000);
});

test("low-confidence match requires review", () => {
  const scored = scoreHotelPlaceMatch({ ...kyotoHotel, region: "Kansai" }, { ...correctPlace, displayName: { text: "Six Senses Kyoto East" }, formattedAddress: "Japan" });
  assert.equal(scored.verified, false);
  assert.equal(scored.needsReview, true);
});

test("missing Google result is reported without guessing", async () => {
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ places: [] })]) });
  const match = await provider.matchHotel(kyotoHotel);
  assert.equal(match.status, "not_found");
  assert.equal(match.verified, false);
});

test("missing photos returns an empty manifest", async () => {
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ id: "place-kyoto", photos: [], googleMapsUri: "https://maps.google.com/x" })]) });
  const manifest = await provider.getPhotoManifest("place-kyoto");
  assert.deepEqual(manifest.photos, []);
});

test("one available photo is returned with attribution", async () => {
  const photo = { name: "places/place-kyoto/photos/one", authorAttributions: [{ displayName: "Owner", uri: "https://maps.google.com/owner", photoUri: "https://example.test/avatar" }], googleMapsUri: "https://maps.google.com/photo" };
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ id: "place-kyoto", photos: [photo] }), response({ photoUri: "https://lh3.googleusercontent.com/photo" })]) });
  const manifest = await provider.getPhotoManifest("place-kyoto");
  assert.equal(manifest.photos.length, 1);
  assert.equal(manifest.photos[0].authorAttributions[0].displayName, "Owner");
  assert.equal(manifest.photos[0].googleMapsUri, "https://maps.google.com/photo");
});

test("multiple available photos are capped at three", async () => {
  const photos = Array.from({ length: 5 }, (_, index) => ({ name: `places/place-kyoto/photos/${index}`, authorAttributions: [] }));
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ photos }), ...photos.slice(0, 3).map((_, index) => response({ photoUri: `https://lh3.googleusercontent.com/${index}` }))]) });
  const manifest = await provider.getPhotoManifest("place-kyoto", { limit: 3 });
  assert.equal(manifest.photos.length, 3);
});

test("hotel gallery can request five real photos and verified place facts", async () => {
  const photos = Array.from({ length: 6 }, (_, index) => ({ name: `places/place-kyoto/photos/${index}`, authorAttributions: [] }));
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ photos, rating: 4.8, userRatingCount: 321, formattedAddress: "Kyoto, Japan" }), ...photos.slice(0, 5).map((_, index) => response({ photoUri: `https://lh3.googleusercontent.com/five-${index}` }))]) });
  const manifest = await provider.getPhotoManifest("place-kyoto", { limit: 5 });
  assert.equal(manifest.photos.length, 5);
  assert.deepEqual(manifest.place, { formattedAddress: "Kyoto, Japan", rating: 4.8, reviewCount: 321 });
});

test("Google API failure is surfaced", async () => {
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", maxRetries: 0, fetchImpl: queuedFetch([response({}, 500)]) });
  await assert.rejects(() => provider.searchHotel(kyotoHotel), (error) => error.code === "google_places_api_error");
});

test("rate limiting retries with backoff", async () => {
  const delays = [];
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", maxRetries: 1, sleep: async (ms) => delays.push(ms), fetchImpl: queuedFetch([response({}, 429, { "retry-after": "1" }), response({ places: [correctPlace] })]) });
  const places = await provider.searchHotel(kyotoHotel);
  assert.equal(places.length, 1);
  assert.deepEqual(delays, [1000]);
});

test("invalid API response is rejected", async () => {
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: queuedFetch([response({ noPlaces: true })]) });
  await assert.rejects(() => provider.searchHotel(kyotoHotel), (error) => error.code === "google_places_invalid_response");
});

test("missing server environment variable is rejected", async () => {
  const provider = new GooglePlacesHotelProvider({ apiKey: "", fetchImpl: queuedFetch([]) });
  await assert.rejects(() => provider.searchHotel(kyotoHotel), (error) => error.code === "google_maps_api_key_missing");
});

test("duplicate Place IDs are flagged and do not stop the batch", async () => {
  const provider = { matchHotel: async () => ({ verified: true, placeId: "same-place", confidence: 1, evidence: {} }), getPhotoManifest: async () => ({ photos: [] }) };
  const second = { ...kyotoHotel, name: "Another Kyoto Hotel" };
  const report = await processGooglePlacesBatch({ records: [kyotoHotel, second], provider, delayMs: 0 });
  assert.equal(report.summary.matched, 1);
  assert.equal(report.summary.duplicatePlaceIds, 1);
  assert.equal(report.results[1].status, "duplicate_place_id");
});

test("batch API failure does not stop later hotels", async () => {
  let calls = 0;
  const provider = { matchHotel: async () => { calls += 1; if (calls === 1) throw Object.assign(new Error("quota"), { code: "google_places_rate_limited" }); return { verified: false, status: "not_found" }; } };
  const report = await processGooglePlacesBatch({ records: [kyotoHotel, { ...kyotoHotel, name: "Later Hotel" }], provider, delayMs: 0 });
  assert.equal(report.summary.apiFailures, 1);
  assert.equal(report.results.length, 2);
});

test("photo resources are refreshed instead of cached", async () => {
  const calls = [];
  const provider = new GooglePlacesHotelProvider({ apiKey: "test", fetchImpl: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/places/place-kyoto")) return response({ photos: [{ name: `places/place-kyoto/photos/fresh-${calls.length}`, authorAttributions: [] }] });
    return response({ photoUri: `https://lh3.googleusercontent.com/fresh-${calls.length}` });
  } });
  await provider.getPhotoManifest("place-kyoto");
  await provider.getPhotoManifest("place-kyoto");
  assert.equal(calls.filter((call) => call.url.endsWith("/places/place-kyoto")).length, 2);
});

test("batch preserves Booking.com and CJ booking fields", async () => {
  const provider = { matchHotel: async () => ({ verified: false, status: "not_found" }) };
  const report = await processGooglePlacesBatch({ records: [kyotoHotel], provider, delayMs: 0 });
  assert.equal(report.results[0].hotel.bookingComPropertyUrl, kyotoHotel.bookingComPropertyUrl);
  assert.equal(report.results[0].hotel.cjTrackingUrl, kyotoHotel.cjTrackingUrl);
});

test("all Google Maps Platform integrations share the consolidated variable", async () => {
  const paths = ["../app/lib/google-places/GooglePlacesHotelProvider.js", "../app/api/hotels/[id]/google-photos/route.js", "../app/api/activities/recommend/route.js", "../app/api/restaurants/recommend/route.js", "../app/api/road-trips/route/route.js", "../app/lib/google-maps/client.js"];
  const files = await Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.equal(files.every((source) => source.includes("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")), true);
  assert.equal(files.some((source) => /(?:^|[^A-Z0-9_])GOOGLE_(PLACES|MAPS)_API_KEY/.test(source)), false);
  assert.match(files.at(-1), /maps\.googleapis\.com\/maps\/api\/js/);
  assert.match(files.at(-2), /routes\.googleapis\.com\/directions\/v2:computeRoutes/);
});

test("licensed fallback photo attribution is rendered", async () => {
  const component = await readFile(new URL("../app/components/HotelPropertyPhoto.jsx", import.meta.url), "utf8");
  assert.match(component, /licensedAuthor/);
  assert.match(component, /licensedName/);
  assert.match(component, /sourcePageUrl/);
});

test("hotel photo surfaces use short caching and exact-property fallback photos", async () => {
  const [route, experience, propertyPhoto, account] = await Promise.all([
    "../app/api/hotels/[id]/google-photos/route.js",
    "../app/components/HotelExperience.jsx",
    "../app/components/HotelPropertyPhoto.jsx",
    "../app/account/page.jsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.match(route, /private, max-age=60/);
  assert.match(experience, /useHotelMedia\(hotel, limit = 2\)/);
  assert.match(experience, /failedSources/);
  assert.match(experience, /fillContainer \? "absolute inset-0" : "relative"/);
  assert.match(propertyPhoto, /limit=2/);
  assert.match(account, /HotelPropertyPhoto/);
  assert.match(account, /item\.item_key.*google-photos/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GooglePlacesHotelProvider, distanceMeters, scoreHotelPlaceMatch } from "../app/lib/google-places/GooglePlacesHotelProvider.js";
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
  await assert.rejects(() => provider.searchHotel(kyotoHotel), (error) => error.code === "google_places_api_key_missing");
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

test("Google API key remains server-only", async () => {
  const files = await Promise.all(["../app/lib/google-places/GooglePlacesHotelProvider.js", "../app/api/hotels/[id]/google-photos/route.js", "../app/components/HotelPropertyPhoto.jsx"].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.equal(files.some((source) => source.includes("NEXT_PUBLIC_GOOGLE")), false);
  assert.equal(files[2].includes("GOOGLE_PLACES_API_KEY"), false);
});

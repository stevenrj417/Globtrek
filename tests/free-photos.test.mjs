import assert from "node:assert/strict";
import test from "node:test";
import { GOOGLE_PAID_APIS_ENABLED, googleBlocked } from "../app/lib/google/paidSwitch.js";
import { withPlacePhotos } from "../app/lib/google-places/placePhotos.js";
import { GooglePlacesHotelProvider } from "../app/lib/google-places/GooglePlacesHotelProvider.js";
import placePhotos from "../app/data/placePhotos.json" with { type: "json" };

test("paid Google APIs stay switched off", async () => {
  assert.equal(GOOGLE_PAID_APIS_ENABLED, false);
  assert.equal(googleBlocked(globalThis.fetch), true);
  const provider = new GooglePlacesHotelProvider({ apiKey: "key" });
  await assert.rejects(provider.request("/places:searchText", { method: "POST", body: {} }), /google_maps_api_key_missing/);
});

test("place photos come from Wikimedia, never from Google", async () => {
  const [placeId, photo] = Object.entries(placePhotos.photos)[0];
  const [withPhoto, without, oldGoogle] = await withPlacePhotos([
    { googlePlaceId: placeId, name: "x" },
    { googlePlaceId: "none", name: "y" },
    { googlePlaceId: "none", name: "z", imageUrl: "https://lh3.googleusercontent.com/abc" },
  ]);
  assert.equal(withPhoto.imageUrl, photo.url);
  assert.match(withPhoto.imageUrl, /^https:\/\/upload\.wikimedia\.org\//);
  assert.match(withPhoto.imageCredit, /\S, \S/);
  assert.equal(without.imageUrl, null);
  assert.equal(oldGoogle.imageUrl, null);
});

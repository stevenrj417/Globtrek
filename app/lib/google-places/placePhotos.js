// Each place's own photo, for cards that name a specific restaurant or sight.
//
// Free only: photos come from the place's Wikipedia article on Wikimedia
// Commons, matched ahead of time by location and name
// (scripts/places/match-free-photos.mjs -> app/data/placePhotos.json). No paid
// API is called here. A place without a matched photo keeps imageUrl null and
// its card shows no picture rather than an unrelated one.
import placePhotos from "../../data/placePhotos.json" with { type: "json" };

export function freePhotoFor(placeId) {
  const photo = placeId ? placePhotos.photos?.[placeId] : null;
  if (!photo?.url) return null;
  return {
    imageUrl: photo.url,
    imageSourceUrl: photo.page,
    imageCredit: `${photo.author}, ${photo.license}`,
    imageProvider: "wikimedia",
  };
}

// The options are kept so existing callers don't change; withPrice used to add
// Google's live price range and is now ignored.
export async function withPlacePhotos(items) {
  return items.map((item) => {
    if (item.imageUrl && !/googleusercontent\.com|googleapis\.com/.test(item.imageUrl)) return item;
    const photo = freePhotoFor(item.googlePlaceId);
    return photo ? { ...item, ...photo } : { ...item, imageUrl: null };
  });
}

import { cache } from "react";
import { createPlacesClient, DESTINATION_FIELDS } from "../../lib/anyplace/google";

const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;

// The destination's details, fetched fresh from Google once per page view.
export const destinationDetails = cache(async (placeId, sessionToken) => {
  if (!PLACE_ID.test(placeId)) return null;
  try { return await createPlacesClient().details(placeId, DESTINATION_FIELDS, { sessionToken }); }
  catch { return null; }
});

export async function heroPhoto(details) {
  const photo = details.photos?.[0];
  if (!photo?.name) return null;
  try {
    const url = await createPlacesClient().photo(photo.name);
    const author = photo.authorAttributions?.[0];
    return url ? { url, credit: author ? { artist: author.displayName, source: author.uri } : null } : null;
  } catch { return null; }
}


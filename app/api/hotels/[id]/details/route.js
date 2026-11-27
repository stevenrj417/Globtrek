import { createPlacesClient, PlacesError } from "../../../../lib/anyplace/google";
import { amenityChecklist, googleMapsSearchUrl } from "../../../../lib/hotels/amenities";
import { isStayId, stayById } from "../../../../lib/search/stays";
import { fromRow } from "../../../../lib/catalog/catalogStore";
import { createClient } from "../../../../lib/supabase/server";
import { sharedRateLimit } from "../../../../lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A hotel's facilities (from its Booking.com listing) and its Google rating and
// reviews, fetched live each time. Google content is never stored or cached
// (Google Maps Platform Terms 3.2.3); this route sends no-store.
const REVIEW_FIELDS = "places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };
// Google ratings and reviews cost one paid search per view; switched off
// 2026-11-22 at the owner's request. Set to true to bring them back.
const GOOGLE_REVIEWS = false;

function metersApart(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// The Google listing for this hotel: the top lodging match for its name, near
// its catalog address. A match more than 400 m away is treated as a different place.
async function googleReviews(stay) {
  if (stay.latitude == null) return null;
  const center = { latitude: stay.latitude, longitude: stay.longitude };
  const [place] = await createPlacesClient().text({ textQuery: [stay.name, stay.city].filter(Boolean).join(", "), center, radiusM: 1000, includedType: "lodging", max: 1, fieldMask: REVIEW_FIELDS });
  if (!place?.location || metersApart(center, place.location) > 400) return null;
  return {
    rating: Number(place.rating) || null,
    count: Number(place.userRatingCount) || null,
    url: place.googleMapsUri || null,
    reviews: (place.reviews || []).filter((review) => review.text?.text).slice(0, 5).map((review) => ({
      rating: Number(review.rating) || null,
      when: review.relativePublishTimeDescription || null,
      text: review.text.text,
      author: review.authorAttribution?.displayName || "A Google user",
      authorUrl: review.authorAttribution?.uri || null,
      authorPhoto: review.authorAttribution?.photoUri || null,
    })),
  };
}

// The hotel's full facility list, minus the pandemic-era hygiene notes and
// fragments that the feed splits on commas.
function facilityList(amenities) {
  const seen = new Set();
  return (Array.isArray(amenities) ? amenities : []).map((item) => String(item).trim()).filter((item) => {
    const key = item.toLowerCase();
    if (!item || item.length > 60 || seen.has(key) || /coronavirus|covid|disinfect|sanitiz|social distanc|local authority|protective|physical distanc|^towels|^linens|screens|contactless|first aid|thermometer|face mask|cashless/i.test(item)) return false;
    seen.add(key);
    return true;
  });
}

// Hotels added by the daily catalog import may not be in the bundled snapshot yet.
async function stayFromDatabase(id) {
  if (!isStayId(id)) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("cj_catalog_properties").select("*").eq("provider_property_id", String(id)).eq("active", true).limit(1).maybeSingle();
    if (!data) return null;
    const row = fromRow(data);
    const stars = row.starRating ? Math.round(row.starRating) : null;
    return { id: String(row.providerPropertyId), name: row.name, category: row.category || null, stars, description: row.description || null, street: row.address || null, city: row.city || null, country: row.country || null, latitude: row.latitude != null && Number.isFinite(Number(row.latitude)) ? Number(row.latitude) : null, longitude: row.longitude != null && Number.isFinite(Number(row.longitude)) ? Number(row.longitude) : null, photos: (row.photos || []).filter((url) => /^https:\/\/[a-z0-9-]+\.bstatic\.com\//.test(url)).slice(0, 6), amenities: row.amenities || [], freeWifi: Boolean(row.catalogFreeWifi), freeCancellation: Boolean(row.catalogFreeCancellation), maxGuests: row.maxGuests || null, bedrooms: row.bedrooms || null, accessibility: row.accessibility || [], dining: typeof row.dining === "string" ? row.dining : null, roomTypes: (row.roomTypes || []).slice(0, 12), freeBreakfast: Boolean(row.catalogFreeBreakfast), bookingUrl: row.bookingUrl };
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const limited = await sharedRateLimit(request, { name: "hotel-details", limit: 30 });
  if (limited) return limited;
  const id = (await params).id;
  const stay = (await stayById(id)) || (await stayFromDatabase(id));
  if (!stay) return Response.json({ error: "Hotel not found" }, { status: 404, headers: noStore });
  let google = null;
  if (GOOGLE_REVIEWS) try { google = await googleReviews(stay); } catch (error) { if (!(error instanceof PlacesError)) throw error; }
  return Response.json({
    hotel: {
      id: stay.id, name: stay.name, city: stay.city, country: stay.country, street: stay.street, stars: stay.stars, category: stay.category,
      description: stay.description, photos: stay.photos, latitude: stay.latitude, longitude: stay.longitude, bookingUrl: stay.bookingUrl,
      checklist: amenityChecklist(stay), accessibility: stay.accessibility, roomTypes: stay.roomTypes,
      amenities: facilityList(stay.amenities), dining: stay.dining || null,
      facts: { freeCancellation: Boolean(stay.freeCancellation), freeBreakfast: Boolean(stay.freeBreakfast), freeWifi: Boolean(stay.freeWifi), bedrooms: stay.bedrooms || null, bathrooms: stay.bathrooms || null, maxGuests: stay.maxGuests || null, beds: stay.bedsDescription || null, dorms: Boolean(stay.dorms), nearAirport: stay.nearAirport || null },
      mapUrl: googleMapsSearchUrl(stay),
    },
    google,
    reviews: GOOGLE_REVIEWS,
  }, { headers: noStore });
}

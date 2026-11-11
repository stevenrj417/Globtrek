// Stays for launch destinations: hand-verified places merged with Booking.com
// catalog listings. Kept apart from launchSet.js because the catalog snapshot
// is large: browser code that only needs LAUNCH_DATA must not pull it in.

import feedStays from "./feedStays.json" with { type: "json" };
import { CHEAP_STAYS, CHEAP_STAYS_CHECKED, stayMonthly } from "./cheapStays.js";
import { LAUNCH_AIRPORTS, LAUNCH_DATA } from "./launchSet.js";
import { snapshotProperties } from "../lib/inventory/CjCatalogHotelProvider.js";

// The rock-bottom plan prices a specific hostel, so it leads the list.
function cheapestBed(destinationId) {
  const stay = CHEAP_STAYS[LAUNCH_AIRPORTS[destinationId]];
  if (!stay?.bedNight) return null;
  return { id: `${destinationId}-cheapest-bed`, name: stay.name, bookingUrl: `https://www.booking.com/hotel/${stay.path}`, priceTier: "hostel", dorms: true, rating: stay.rating, reviewCount: stay.reviewCount, ratingSource: "Booking.com", bedNight: stay.bedNight, monthlyNight: stayMonthly({ airport: LAUNCH_AIRPORTS[destinationId] }), note: `Dorm beds from about $${stay.bedNight} a night, taxes included (checked ${CHEAP_STAYS_CHECKED})`, verifiedAt: CHEAP_STAYS_CHECKED };
}

const pagePath = (url) => String(url || "").replace(/^https:\/\/www\.booking\.com\/hotel\//, "").replace(/(\.[a-z-]+)?\.html.*$/, "");

// Booking.com's own listing data from the CJ product feed: photos, rooms, beds,
// amenities, catalog flags and the feed's CJ link. No prices or reviews.
const FEED_FIELDS = ["photos", "roomTypes", "dorms", "beds", "bedrooms", "bedsDescription", "maxGuests", "amenities", "accessibility", "catalogFreeCancellation", "catalogFreeWifi", "catalogFreeBreakfast", "category", "starRating", "latitude", "longitude", "cjTrackingBaseUrl", "description", "importedAt"];
function withFeed(hotel, listing) {
  if (!listing) return hotel;
  const extra = Object.fromEntries(FEED_FIELDS.filter((field) => listing[field] !== null && listing[field] !== undefined).map((field) => [field, listing[field]]));
  return { ...extra, ...hotel, address: hotel.address || listing.address, feedSku: listing.sku };
}

export const FEED_STAYS_CHECKED = feedStays.checkedAt;
export function feedListings(destinationId) {
  return snapshotProperties(destinationId);
}

// Hand-verified stays for a launch destination (the priced hostel first), with
// catalog details added where the feed has the same property.
export function verifiedStays(destinationId) {
  const listed = LAUNCH_DATA[destinationId]?.hotels || [];
  const bed = cheapestBed(destinationId);
  const existing = bed ? listed.find((hotel) => pagePath(hotel.bookingUrl) === pagePath(bed.bookingUrl)) : null;
  const verified = bed ? [existing ? { ...existing, ...bed, id: existing.id } : bed, ...listed.filter((hotel) => hotel !== existing)] : listed;
  const byPath = new Map(feedListings(destinationId).map((listing) => [pagePath(listing.bookingUrl), listing]));
  return verified.map((hotel) => ({ ...withFeed(hotel, byPath.get(pagePath(hotel.bookingUrl))), verified: true, source: "verified", dataUpdatedAt: hotel.verifiedAt || LAUNCH_DATA[destinationId]?.verified || CHEAP_STAYS_CHECKED }));
}

export function launchHotels(destinationId, { limit = 8 } = {}) {
  const verified = verifiedStays(destinationId);
  const taken = new Set(verified.map((hotel) => pagePath(hotel.bookingUrl)));
  // Budget list: up to 3 stars (the 4-star catalog stays are for the trip page's Upgrade).
  const more = feedListings(destinationId).filter((listing) => !taken.has(pagePath(listing.bookingUrl)) && !(Number(listing.starRating) > 3)).map((listing) => ({
    ...listing,
    priceTier: listing.dorms || listing.category === "Hostel" || listing.category === "Capsule hotel" ? "hostel" : "budget",
    fromFeed: true,
    source: "catalog",
    dataUpdatedAt: listing.importedAt,
  }));
  const hotels = [...verified, ...more].slice(0, Math.max(limit, verified.length));
  return hotels.map((hotel) => ({
    ...hotel,
    type: "hotel",
    provider: "booking.com",
    providerUrl: hotel.bookingUrl,
    providerLinkVerified: true,
    verifiedAt: hotel.fromFeed ? FEED_STAYS_CHECKED : LAUNCH_DATA[destinationId]?.verified || CHEAP_STAYS_CHECKED,
    verificationSource: hotel.fromFeed ? "booking.com_cj_product_feed" : hotel.bookingUrl,
    image: hotel.image || hotel.photos?.[0] || null,
    imageSource: hotel.image ? hotel.imageSource : hotel.photos?.length ? "Booking.com" : undefined,
    amenities: hotel.amenities || [],
    tags: [hotel.dorms ? "dorm beds" : null, hotel.catalogFreeCancellation ? "free cancellation on some rates" : null, hotel.catalogFreeWifi ? "free Wi-Fi" : null, hotel.catalogFreeBreakfast ? "breakfast on some rates" : null].filter(Boolean),
  }));
}

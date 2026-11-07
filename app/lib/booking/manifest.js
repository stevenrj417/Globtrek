import { cjActivitySearchUrl, cjHotelSearchUrl, ensureCjTracking, isBookingComUrl, isCjUrl } from "./cj.js";

function httpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function exactGoogleMapsUrl(item) {
  const supplied = httpsUrl(item?.googleMapsUrl || item?.googleMapsUri);
  if (supplied && /(^|\.)google\.[^/]+$|(^|\.)googleapis\.com$/i.test(new URL(supplied).hostname)) return supplied;
  const details = httpsUrl(item?.detailsUrl);
  if (details && /(^|\.)google\.[^/]+$/i.test(new URL(details).hostname)) return details;
  const placeId = item?.googlePlaceId || (item?.provider === "google_places" ? item?.providerId : null);
  return placeId ? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}` : null;
}

export function restaurantBookingUrl(item) {
  return httpsUrl(item?.officialReservationUrl || item?.reservationUrl)
    || httpsUrl(item?.officialWebsiteUrl || item?.websiteUri || item?.websiteUrl)
    || httpsUrl(item?.openTableUrl || item?.bookingUrl)
    || exactGoogleMapsUrl(item);
}

export function experienceBookingUrl(item) {
  return httpsUrl(item?.viatorAffiliateUrl || item?.affiliateUrl)
    || httpsUrl(item?.providerBookingUrl || item?.bookingUrl || item?.providerUrl)
    || httpsUrl(item?.officialWebsiteUrl || item?.websiteUri || item?.websiteUrl)
    || exactGoogleMapsUrl(item);
}

export function hotelBookingUrl(item, exactPropertyUrl = null) {
  return httpsUrl(exactPropertyUrl)
    || (item?.providerLinkVerified ? httpsUrl(item?.providerUrl) : null)
    || exactGoogleMapsUrl(item);
}

// Booking.com property pages accept dates and party size in the URL; add any that are missing.
function withStayDetails(value, { dates, travelers }) {
  const url = new URL(value);
  if (dates?.start && dates?.end && dates.end >= dates.start && !url.searchParams.has("checkin")) {
    url.searchParams.set("checkin", dates.start);
    url.searchParams.set("checkout", dates.end);
  }
  const adults = Number(travelers?.adults) || Number(travelers?.total) || 0;
  if (adults > 0 && !url.searchParams.has("group_adults")) url.searchParams.set("group_adults", String(Math.min(30, adults)));
  if (!url.searchParams.has("no_rooms")) url.searchParams.set("no_rooms", "1");
  if (!url.searchParams.has("group_children")) url.searchParams.set("group_children", String(Math.max(0, Number(travelers?.children) || 0)));
  return url.toString();
}

// Every hotel leaves through GlobTrek's CJ link: the exact Booking.com property when
// known, otherwise a Booking.com search for that hotel pre-filled with dates and party.
function affiliateHotelUrl(hotel, exactPropertyUrl, context) {
  const exact = httpsUrl(exactPropertyUrl);
  if (exact && isCjUrl(exact)) return exact;
  if (exact && isBookingComUrl(exact)) return ensureCjTracking(withStayDetails(exact, context));
  const provider = hotel?.providerLinkVerified ? httpsUrl(hotel?.providerUrl) : null;
  if (provider && isBookingComUrl(provider)) return ensureCjTracking(withStayDetails(provider, context));
  return cjHotelSearchUrl(hotel?.name, context.destination, context) || exact || provider || exactGoogleMapsUrl(hotel);
}

// Free places (parks, viewpoints) and pay-at-the-gate places have nothing to book
// online, so they keep their own page. Anything else with a cost goes to
// Booking.com Attractions through GlobTrek's CJ link.
function isFreeExperience(item) {
  return item?.isFree === true || item?.payAtGate === true || (item?.estimatedCostHigh != null && Number(item.estimatedCostHigh) === 0);
}

function affiliateExperienceUrl(item, destination) {
  const original = experienceBookingUrl(item);
  if (isFreeExperience(item)) return original;
  if (original && (isCjUrl(original) || isBookingComUrl(original))) return ensureCjTracking(original);
  return cjActivitySearchUrl(item?.name, destination) || original;
}

// OpenTable accepts the party size in the URL; other restaurant sites are left as they are.
function prefilledRestaurantUrl(item, travelers) {
  const original = restaurantBookingUrl(item);
  if (!original) return null;
  const url = new URL(original);
  if (/(^|\.)opentable\.[a-z.]+$/i.test(url.hostname) && !url.searchParams.has("covers")) {
    const party = Number(travelers?.total) || Number(travelers?.adults) || 0;
    if (party > 0) url.searchParams.set("covers", String(Math.min(20, party)));
  }
  return url.toString();
}

function compactBooking(item, type, exactUrl, extra = {}) {
  if (!item || !exactUrl) return null;
  return {
    id: item.id || `${type}:${item.name}`,
    type,
    name: item.name,
    provider: item.provider || (new URL(exactUrl).hostname),
    exactUrl,
    verified: true,
    imageUrl: httpsUrl(item.imageUrl || item.image || extra.imageUrl),
    location: item.neighborhood || item.location || item.address || null,
    rating: item.rating ?? null,
    reviewCount: item.reviewCount ?? null,
    ...extra,
  };
}

export function buildBookingManifest({
  tripId,
  destination,
  dates,
  travelers,
  hotels = [],
  hotelExactUrls = [],
  restaurants = [],
  experiences = [],
  flight = null,
  flightDeepLink = null,
} = {}) {
  const context = { destination, dates, travelers };
  const hotelBookings = hotels.map((hotel, index) => compactBooking(hotel, "hotel", affiliateHotelUrl(hotel, hotelExactUrls[index], context), {
    affiliateUrl: httpsUrl(hotelExactUrls[index]),
    photoUrl: httpsUrl(hotel.photoUrl || hotel.imageUrl || hotel.image),
    priceEstimate: hotel.priceEstimate || (Number.isFinite(Number(hotel.estimatedStayLow)) && Number.isFinite(Number(hotel.estimatedStayHigh)) ? `${hotel.currency || "USD"} ${Math.round(Number(hotel.estimatedStayLow)).toLocaleString("en-US")}–${Math.round(Number(hotel.estimatedStayHigh)).toLocaleString("en-US")} estimated` : null),
  })).filter(Boolean);
  const restaurantBookings = restaurants.map((restaurant) => compactBooking(restaurant, "restaurant", prefilledRestaurantUrl(restaurant, travelers), {
    reservationTime: restaurant.reservationTime || restaurant.time || null,
  })).filter(Boolean);
  const experienceBookings = experiences.map((experience) => compactBooking(experience, "experience", affiliateExperienceUrl(experience, destination), {
    officialUrl: experienceBookingUrl(experience),
    scheduledAt: experience.scheduledAt || experience.dateTime || null,
  })).filter(Boolean);
  const rawFlight = flight?.selected ? httpsUrl(flightDeepLink) : null;
  const deepLink = rawFlight && (isCjUrl(rawFlight) || isBookingComUrl(rawFlight)) ? ensureCjTracking(rawFlight) : rawFlight;
  const flightBooking = flight?.selected && deepLink ? {
    type: "flight",
    name: `${flight.origin} → ${flight.destination}`,
    provider: "Booking.com Flights",
    origin: flight.origin,
    destination: flight.destination,
    departureDate: flight.departureDate || null,
    returnDate: flight.returnDate || null,
    adults: Number(flight.adults) || 1,
    children: Number(flight.children) || 0,
    cabin: flight.cabin || "ECONOMY",
    preferredDeparture: flight.preferredDeparture || flight.timing || null,
    selectedItinerary: flight.selectedItinerary || null,
    deepLink,
    exactUrl: deepLink,
    verified: true,
  } : null;
  return { version: 1, tripId: tripId || null, destination, dates, travelers, hotelBookings, restaurantBookings, experienceBookings, flightBooking };
}

export function bookingManifestEntries(manifest) {
  const entries = [
    ...(manifest?.hotelBookings || []),
    ...(manifest?.restaurantBookings || []),
    ...(manifest?.experienceBookings || []),
    ...(manifest?.flightBooking ? [manifest.flightBooking] : []),
  ];
  const seen = new Set();
  return entries.flatMap((entry) => {
    const url = httpsUrl(entry.exactUrl || entry.deepLink);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{ ...entry, exactUrl: url }];
  });
}

export function launchBookingManifest(manifest, openWindow = (url, target) => window.open(url, target)) {
  const entries = bookingManifestEntries(manifest);
  const opened = [];
  const blocked = [];
  const contexts = entries.map((entry, index) => {
    let tab = null;
    try { tab = openWindow("about:blank", `globtrek-booking-${index + 1}`); }
    catch { tab = null; }
    if (!tab) {
      blocked.push(entry);
      return null;
    }
    return { entry, tab };
  }).filter(Boolean);

  contexts.forEach(({ entry, tab }) => {
    try {
      tab.opener = null;
      if (tab.location?.replace) tab.location.replace(entry.exactUrl);
      else tab.location = entry.exactUrl;
      opened.push(entry);
    } catch {
      try { tab.close?.(); } catch {}
      blocked.push(entry);
    }
  });
  return { requested: entries.length, entries, opened, blocked };
}

export { exactGoogleMapsUrl, httpsUrl };

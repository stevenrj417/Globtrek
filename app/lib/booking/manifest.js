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
  return httpsUrl(item?.officialWebsiteUrl || item?.websiteUri || item?.websiteUrl)
    || httpsUrl(item?.reservationUrl || item?.bookingUrl)
    || exactGoogleMapsUrl(item);
}

export function experienceBookingUrl(item) {
  return httpsUrl(item?.bookingUrl || item?.providerUrl)
    || exactGoogleMapsUrl(item);
}

export function hotelBookingUrl(item, exactPropertyUrl = null) {
  return httpsUrl(exactPropertyUrl)
    || (item?.providerLinkVerified ? httpsUrl(item?.providerUrl) : null)
    || exactGoogleMapsUrl(item);
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
  const hotelBookings = hotels.map((hotel, index) => compactBooking(hotel, "hotel", hotelBookingUrl(hotel, hotelExactUrls[index]), {
    affiliateUrl: httpsUrl(hotelExactUrls[index]),
    photoUrl: httpsUrl(hotel.photoUrl || hotel.imageUrl || hotel.image),
    priceEstimate: hotel.priceEstimate || (Number.isFinite(Number(hotel.estimatedStayLow)) && Number.isFinite(Number(hotel.estimatedStayHigh)) ? `${hotel.currency || "USD"} ${Math.round(Number(hotel.estimatedStayLow)).toLocaleString("en-US")}–${Math.round(Number(hotel.estimatedStayHigh)).toLocaleString("en-US")} estimated` : null),
  })).filter(Boolean);
  const restaurantBookings = restaurants.map((restaurant) => compactBooking(restaurant, "restaurant", restaurantBookingUrl(restaurant), {
    reservationTime: restaurant.reservationTime || restaurant.time || null,
  })).filter(Boolean);
  const experienceBookings = experiences.map((experience) => compactBooking(experience, "experience", experienceBookingUrl(experience), {
    scheduledAt: experience.scheduledAt || experience.dateTime || null,
  })).filter(Boolean);
  const deepLink = flight?.selected ? httpsUrl(flightDeepLink) : null;
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
  return entries.filter((entry) => {
    const url = httpsUrl(entry.exactUrl || entry.deepLink);
    if (!url || seen.has(url)) return false;
    seen.add(url);
    entry.exactUrl = url;
    return true;
  });
}

export function launchBookingManifest(manifest, openWindow = (url, target) => window.open(url, target)) {
  const entries = bookingManifestEntries(manifest);
  const opened = [];
  const blocked = [];
  entries.forEach((entry) => {
    const tab = openWindow("about:blank", "_blank");
    if (!tab) {
      blocked.push(entry);
      return;
    }
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
  return { entries, opened, blocked };
}

export { exactGoogleMapsUrl, httpsUrl };

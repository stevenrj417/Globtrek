// GlobTrek's CJ (Commission Junction) tracking for Booking.com. Every Booking.com
// link that leaves the site goes through one of these click URLs so the booking
// is credited to GlobTrek's CJ account.
export const CJ_LINKS = Object.freeze({
  stays: "https://www.kqzyfj.com/click-101801755-17293132",
  flights: "https://www.dpbolvw.net/click-101801755-17288982",
  activities: "https://www.dpbolvw.net/click-101801755-17288984",
  cars: "https://www.dpbolvw.net/click-101801755-17314628",
  taxis: "https://www.dpbolvw.net/click-101801755-17322565",
});

export const CJ_HOSTS = ["kqzyfj.com", "dpbolvw.net", "anrdoezrs.net", "jdoqocy.com", "tkqlhce.com", "qksrv.net"];

function hostMatches(hostname, hosts) {
  return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function parse(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function cjTracked(clickUrl, targetUrl) {
  return `${clickUrl}?url=${encodeURIComponent(targetUrl)}`;
}

export function isCjUrl(value) {
  const url = parse(value);
  return Boolean(url && hostMatches(url.hostname, CJ_HOSTS));
}

export function isBookingComUrl(value) {
  const url = parse(value);
  return Boolean(url && hostMatches(url.hostname, ["booking.com"]));
}

// Wrap a raw Booking.com URL in the right CJ click link; leave CJ links alone.
export function ensureCjTracking(value) {
  if (isCjUrl(value)) return value;
  const url = parse(value);
  if (!url || !hostMatches(url.hostname, ["booking.com"])) return null;
  const program = url.hostname.startsWith("flights.") ? "flights" : url.pathname.startsWith("/attractions") ? "activities" : url.hostname.startsWith("cars.") ? "cars" : url.hostname.startsWith("taxi.") ? "taxis" : "stays";
  return cjTracked(CJ_LINKS[program], url.toString());
}

function partySize(travelers) {
  const adults = Number(travelers?.adults);
  const total = Number(travelers?.total);
  return Math.min(30, Math.max(1, Number.isFinite(adults) && adults > 0 ? adults : Number.isFinite(total) && total > 0 ? total : 2));
}

// Booking.com hotel search for a named hotel, pre-filled with dates and party size.
export function cjHotelSearchUrl(name, destination, { dates, travelers } = {}) {
  if (!name || !destination?.city) return null;
  const params = new URLSearchParams({ ss: [name, destination.city, destination.country].filter(Boolean).join(", ") });
  if (dates?.start && dates?.end && dates.end >= dates.start) {
    params.set("checkin", dates.start);
    params.set("checkout", dates.end);
  }
  params.set("group_adults", String(partySize(travelers)));
  params.set("no_rooms", "1");
  params.set("group_children", String(Math.max(0, Number(travelers?.children) || 0)));
  return cjTracked(CJ_LINKS.stays, `https://www.booking.com/searchresults.html?${params.toString()}`);
}

// Booking.com Attractions search for a named activity in the trip's city.
export function cjActivitySearchUrl(name, destination) {
  if (!name || !destination?.city) return null;
  const params = new URLSearchParams({ query: [name, destination.city].filter(Boolean).join(", ") });
  return cjTracked(CJ_LINKS.activities, `https://www.booking.com/attractions/searchresults.html?${params.toString()}`);
}

// Defense for manifests that arrive from the browser (e.g. the trip email): wrap any
// raw Booking.com link in CJ tracking and drop hotels/flights that aren't CJ links.
export function normalizeManifestLinks(manifest = {}) {
  const fix = (entry, { requireCj = false } = {}) => {
    if (!entry) return null;
    const raw = entry.exactUrl || entry.deepLink;
    const tracked = isCjUrl(raw) || isBookingComUrl(raw) ? ensureCjTracking(raw) : raw;
    if (!tracked || (requireCj && !isCjUrl(tracked))) return null;
    return { ...entry, exactUrl: tracked, ...(entry.deepLink ? { deepLink: tracked } : {}) };
  };
  const list = (key, options) => (Array.isArray(manifest[key]) ? { [key]: manifest[key].map((entry) => fix(entry, options)).filter(Boolean) } : {});
  return {
    ...manifest,
    ...list("hotelBookings", { requireCj: true }),
    ...list("restaurantBookings"),
    ...list("experienceBookings"),
    ...(manifest.flightBooking ? { flightBooking: fix(manifest.flightBooking, { requireCj: true }) } : {}),
  };
}

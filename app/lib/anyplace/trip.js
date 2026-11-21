// A traveler's own trip from the "any place" picks: one stay, any dinners and
// things to do, plus flights. The trip page's URL carries only IDs and plain
// choices (dates, party size, home airport); everything shown is looked up again
// on the server from the saved picks, so a link can't be edited to send someone
// somewhere else. Booking.com stays, flights and tickets leave through GlobTrek's
// CJ links.
import { CJ_LINKS, cjTracked } from "../booking/cj.js";
import { budgetKey } from "./rank.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;
const STAY_ID = /^bk:[A-Za-z0-9_-]{1,40}$/;
const IATA = /^[A-Z]{3}$/;
const MAX_EACH = 12;

const list = (value) => [...new Set(String(value || "").split(",").map((item) => item.trim()).filter((item) => PLACE_ID.test(item)))].slice(0, MAX_EACH);
const date = (value) => (typeof value === "string" && DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? value : null);

// Search params → a clean trip request (anything invalid is dropped).
export function parseTripParams(params = {}) {
  const start = date(params.start);
  let end = date(params.end);
  if (!start || (end && end <= start)) end = null;
  const adults = Number.parseInt(params.adults, 10);
  const from = String(params.from || "").trim().toUpperCase();
  return {
    budget: budgetKey(params.budget),
    stay: STAY_ID.test(params.stay || "") ? params.stay : null,
    dinners: list(params.d),
    activities: list(params.a),
    start: start && end ? start : null,
    end: start && end ? end : null,
    adults: Number.isFinite(adults) && adults >= 1 && adults <= 16 ? adults : 2,
    from: IATA.test(from) ? from : null,
  };
}

export function tripQuery(trip) {
  const params = new URLSearchParams({ budget: trip.budget });
  if (trip.stay) params.set("stay", trip.stay);
  if (trip.dinners?.length) params.set("d", trip.dinners.join(","));
  if (trip.activities?.length) params.set("a", trip.activities.join(","));
  if (trip.start && trip.end) { params.set("start", trip.start); params.set("end", trip.end); }
  if (trip.adults && trip.adults !== 2) params.set("adults", String(trip.adults));
  if (trip.from) params.set("from", trip.from);
  return params.toString();
}

export function tripPath(placeId, trip) {
  return `/places/${placeId}/trip?${tripQuery(trip)}`;
}

export function nights(trip) {
  return trip.start && trip.end ? Math.round((Date.parse(trip.end) - Date.parse(trip.start)) / 86400000) : null;
}

// The stay's own Booking.com page, with dates and party size when known, through CJ.
export function stayLink(stay, trip = {}) {
  if (!stay) return null;
  if (!(trip.start && trip.end) || !stay.bookingUrl) return stay.clickUrl;
  const params = new URLSearchParams({ checkin: trip.start, checkout: trip.end, group_adults: String(trip.adults || 2), no_rooms: "1", group_children: "0" });
  return cjTracked(CJ_LINKS.stays, `${stay.bookingUrl}?${params.toString()}`);
}

// Booking.com flights into the destination's airport, through CJ.
export function flightLink(airport, trip = {}) {
  const params = new URLSearchParams({ type: "ROUNDTRIP", cabinClass: "ECONOMY", adults: String(trip.adults || 2), children: "0" });
  if (airport?.code) params.set("to", `${airport.code}.AIRPORT`);
  if (trip.from) params.set("from", `${trip.from}.AIRPORT`);
  if (trip.start && trip.end) { params.set("depart", trip.start); params.set("return", trip.end); }
  const route = trip.from && airport?.code ? `${trip.from}.AIRPORT-${airport.code}.AIRPORT/` : "index.html";
  return cjTracked(CJ_LINKS.flights, `https://flights.booking.com/flights/${route}?${params.toString()}`);
}

// Outdoor places are free to visit: they get directions, not a tickets search.
const FREE_TYPES = /park|hiking|trail|beach|natural_feature|scenic|lake|waterfall|mountain|garden|plaza|square|viewpoint|church|bridge|monument/;
export function isFreeToVisit(place) {
  return FREE_TYPES.test(String(place?.primaryType || ""));
}

// Tours and tickets for a sight on Booking.com Attractions, through CJ.
export function ticketsLink(place, destination) {
  if (!place?.name || isFreeToVisit(place)) return null;
  const params = new URLSearchParams({ query: [place.name, destination?.name].filter(Boolean).join(", ") });
  return cjTracked(CJ_LINKS.activities, `https://www.booking.com/attractions/searchresults.html?${params.toString()}`);
}

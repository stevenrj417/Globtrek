import { airportByCode } from "../lib/anyplace/airport.js";
import { tripExtras } from "../lib/trip/extras.js";

const COUNTRY_NAMES = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

// The "don't forget" extras for a /book trip, from what its link carries.
export function bookExtras(trip, city) {
  const stayItem = trip.items.find((item) => item.type === "hotel");
  const stay = trip.stayPoint ? { name: stayItem?.name || city, latitude: trip.stayPoint[0], longitude: trip.stayPoint[1], city } : null;
  const airport = trip.airport ? airportByCode(trip.airport, stay) : null;
  let homeCountry = null;
  try { homeCountry = trip.homeCountryCode && COUNTRY_NAMES ? COUNTRY_NAMES.of(trip.homeCountryCode) : null; } catch {}
  return tripExtras({ level: trip.level || "mid", interests: trip.interests, destination: { name: city, country: trip.country ? trip.country.toLowerCase().replace(/(^|[\s(-])\p{L}/gu, (letter) => letter.toUpperCase()) : null }, airport, stay, homeCountry });
}

// The checklist's storage key for a /book trip (shared with its thank-you page).
export const bookTripKey = (trip) => `book:${trip.city}:${trip.start || ""}:${trip.items.map((item) => item.exactUrl.length).join("-")}`;

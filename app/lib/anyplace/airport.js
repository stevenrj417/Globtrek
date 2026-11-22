// The airport to fly into for any place, from GlobTrek's own airport list (no API
// call). International airports win over a closer small field when they're
// within reach, since that's where most fares are.
import airports from "../../data/airports.json" with { type: "json" };
import airportCoords from "../../data/airportCoords.json" with { type: "json" };
import { distanceKm } from "./rank.js";

const SCHEDULED = airports.filter((airport) => airport.scheduled && airportCoords[airport.code]);
const MAX_KM = 300;
const INTERNATIONAL_BONUS_KM = 120;
const SMALL_FIELD_PENALTY_KM = 60;
// Big airports whose names don't say "International".
const HUBS = new Set(["ZRH", "GVA", "CDG", "ORY", "LHR", "LGW", "STN", "MAN", "FRA", "MUC", "DUS", "HAM", "TXL", "BER", "AMS", "MAD", "BCN", "FCO", "MXP", "VIE", "CPH", "ARN", "OSL", "HEL", "DUB", "BRU", "LIS", "OPO", "IST", "HND", "NRT", "KIX", "SYD", "MEL", "AKL", "YYZ", "YVR", "GRU", "GIG", "EZE", "SCL", "BOG", "LIM", "MEX", "SIN", "HKG", "BKK", "DXB", "DOH"]);
const SMALL_FIELD = /municipal|county|airstrip|airfield|heliport|seaplane/i;

export function nearestAirport(center) {
  if (!center) return null;
  let best = null;
  for (const airport of SCHEDULED) {
    const [latitude, longitude] = airportCoords[airport.code];
    const km = distanceKm(center, { latitude, longitude });
    if (km == null || km > MAX_KM) continue;
    const big = HUBS.has(airport.code) || /international|intl/i.test(airport.name);
    const score = km - (big ? INTERNATIONAL_BONUS_KM : 0) + (!big && SMALL_FIELD.test(airport.name) ? SMALL_FIELD_PENALTY_KM : 0);
    if (!best || score < best.score || (score === best.score && airport.code < best.code)) best = { code: airport.code, name: airport.name, city: airport.city || airport.name, km: Math.round(km), latitude, longitude, score };
  }
  if (!best) return null;
  const { score, ...airport } = best;
  return airport;
}

// An airport by its code, with its map point and (when given a point) the distance to it.
export function airportByCode(code, near = null) {
  const airport = airports.find((item) => item.code === code);
  const point = airportCoords[code];
  if (!airport || !point) return null;
  const [latitude, longitude] = point;
  const km = near ? distanceKm(near, { latitude, longitude }) : null;
  return { code, name: airport.name, city: airport.city || airport.name, latitude, longitude, km: km == null ? null : Math.round(km) };
}

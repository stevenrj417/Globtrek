// Removed 2026-11-21: these fares were copied from Google Flights, and Google's
// terms don't allow taking content out of its services to republish it. Flight
// estimates now come only from licensed sources: the Travelpayouts / Aviasales
// Data API, then U.S. DOT averages of fares actually paid (travelFeasibility.js).
// Kept as an empty table so callers fall through to those sources.

export const FARE_SNAPSHOT_CHECKED = null;

export const FARE_SNAPSHOTS = Object.freeze({});

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

// The fare for the traveler's month; with no dates (or flexible dates in a month
// not on file), the cheapest month on file.
// periodMonths: for a flexible trip planned for a season, the "YYYY-MM" months it
// may use; the cheapest month inside them is picked, and none outside.
export function snapshotFare(origin, airport, startDate, flexible, periodMonths = null) {
  const route = FARE_SNAPSHOTS[`${String(origin || "").toUpperCase()}:${String(airport || "").toUpperCase()}`];
  if (!route) return null;
  const month = startDate ? String(startDate).slice(0, 7) : null;
  if (month && route[month]) return { month, ...route[month] };
  if (month && !flexible) return null;
  const allowed = periodMonths?.length ? Object.entries(route).filter(([key]) => periodMonths.includes(key)) : Object.entries(route);
  const [best] = allowed.sort(([keyA, a], [keyB, b]) => a.typical - b.typical || keyA.localeCompare(keyB));
  if (!best) return null;
  return { month: best[0], ...best[1], cheapestMonth: allowed.length > 1 };
}

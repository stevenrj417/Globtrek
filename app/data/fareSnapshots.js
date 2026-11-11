// Real round-trip economy fares from Google Flights, checked 2026-11-08, taxes
// included, any airline (budget carriers too; bags extra). Per route and month:
// cheapest = lowest fare found, typical = the 25th-percentile day when the whole
// month was read from the fare calendar, else the one sampled midweek trip
// (Tue–Sat, 4 nights). Airlines had not yet loaded sale fares beyond about March
// 2027, so later months fall back to U.S. DOT averages in travelFeasibility.js.

export const FARE_SNAPSHOT_CHECKED = "2026-11-08";

const sample = (fare) => ({ cheapest: fare, typical: fare, days: 1 });

export const FARE_SNAPSHOTS = Object.freeze({
  "PDX:LAS": {
    "2026-11": { cheapest: 270, typical: 328, days: 23 },
    "2026-12": { cheapest: 114, typical: 233, days: 31 },
    "2027-01": { cheapest: 123, typical: 158, days: 31 },
    "2027-02": { cheapest: 188, typical: 223, days: 28 },
    "2027-03": { cheapest: 194, typical: 298, days: 31 },
  },
  "PDX:SFO": { "2027-01": sample(139) },
  "PDX:SAN": { "2027-01": sample(159) },
  "PDX:LAX": { "2027-01": sample(188), "2027-04": sample(217) },
  "PDX:DEN": { "2027-01": sample(149) },
  "PDX:PHX": { "2027-01": sample(210) },
  "PDX:AUS": { "2027-01": sample(270) },
  "PDX:MSY": { "2027-01": sample(277), "2027-04": sample(277) },
  "PDX:ORD": { "2027-01": sample(314) },
  "PDX:HNL": { "2027-01": sample(480), "2027-02": sample(524), "2027-04": sample(530) },
  "PDX:PVR": { "2027-01": sample(511), "2027-04": sample(531) },
  "PDX:GDL": { "2027-01": sample(581), "2027-04": sample(491) },
  "PDX:MEX": { "2027-01": sample(648), "2027-04": sample(597) },
  "PDX:OAX": { "2027-01": sample(733), "2027-04": sample(664) },
  "PDX:MID": { "2027-01": sample(753), "2027-04": sample(666) },
  "PDX:LIS": { "2027-01": sample(793) },
  "PDX:BKK": { "2027-01": sample(1070) },
  "PDX:HAN": { "2027-01": sample(1125) },
  "PDX:CNX": { "2027-01": sample(1259) },
  "PDX:EZE": { "2027-01": sample(1322) },
});

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

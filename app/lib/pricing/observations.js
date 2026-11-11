// Price observations: one price a provider showed for one specific item (a
// route, a property and room, a tour, a restaurant) for one travel date, on the
// day GlobTrek saw it.
//
// Two dates are kept apart on purpose:
//   observedAt  when the price was seen (a quote seen today for next summer is
//               observed today)
//   travelDate  the date being priced (departure, check-in, activity day)
//
// Averages are built per travel period from these rows (see aggregate.js).
// Nothing here creates a price: every row comes from a provider response.

export const KINDS = Object.freeze(["flight", "stay", "activity", "restaurant", "esim"]);

// What one price buys.
export const UNITS = Object.freeze({
  flight: "per_passenger_round_trip",
  stay: "per_night",
  activity: "per_person",
  restaurant: "per_person_meal",
  esim: "per_plan",
});

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (value) => (typeof value === "string" && ISO_DAY.test(value.slice(0, 10)) ? value.slice(0, 10) : null);

// A row in GlobTrek's shape, or null when it lacks what an average needs.
export function observation(input) {
  const kind = KINDS.includes(input?.kind) ? input.kind : null;
  const price = Number(input?.price);
  const observedAt = day(input?.observedAt);
  const currency = String(input?.currency || "").toUpperCase();
  if (!kind || !input.itemId || !Number.isFinite(price) || price <= 0 || !observedAt || !/^[A-Z]{3}$/.test(currency)) return null;
  const travelDate = day(input.travelDate);
  return {
    kind,
    itemId: String(input.itemId),
    destinationId: input.destinationId || null,
    city: input.city || null,
    country: input.country || null,
    provider: input.provider || null,
    source: input.source || null,
    observedAt,
    travelDate,
    travelEnd: day(input.travelEnd),
    price: Math.round(price * 100) / 100,
    currency,
    unit: input.unit || UNITS[kind],
    taxesIncluded: typeof input.taxesIncluded === "boolean" ? input.taxesIncluded : null,
    occupancy: Number.isFinite(Number(input.occupancy)) ? Number(input.occupancy) : null,
    roomType: input.roomType || null,
    conditions: input.conditions || null,
  };
}

// The same provider price seen twice on one day is one observation.
export function observationKey(row) {
  return [row.kind, row.itemId, row.provider, row.observedAt, row.travelDate || "", row.travelEnd || "", row.roomType || "", row.occupancy ?? "", row.price, row.currency].join("|");
}

export function dedupe(rows) {
  const seen = new Map();
  for (const row of rows) if (row) seen.set(observationKey(row), row);
  return [...seen.values()];
}

// Half-month travel periods: "06a" is June 1–15, "06b" is June 16–30.
export function travelPeriod(date) {
  const value = day(date);
  if (!value) return null;
  return `${value.slice(5, 7)}${Number(value.slice(8, 10)) <= 15 ? "a" : "b"}`;
}

export function travelMonth(date) {
  const value = day(date);
  return value ? value.slice(5, 7) : null;
}

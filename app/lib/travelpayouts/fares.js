import { groupedPrices, pricesForDates } from "./client.js";

// Recently seen round-trip fares for one trip, from the Aviasales cache.
//
// Rules: only round trips; only fares to the trip's own airport (a fare into a
// different airport in the same city is kept but flagged); prices are per
// person and the group total multiplies by adult passengers; the trip length
// must be within a night of the plan. Nothing here is a live quote.

const DAY = 86400000;
const nightsBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);

export function aviasalesSearchUrl({ origin, destination, depart, ret, adults = 1, children = 0 }) {
  const ddmm = (date) => `${date.slice(8, 10)}${date.slice(5, 7)}`;
  const passengers = `${Math.min(9, Math.max(1, adults))}${children > 0 ? Math.min(9, children) : ""}`;
  return `https://www.aviasales.com/search/${origin}${ddmm(depart)}${destination}${ddmm(ret)}${passengers}`;
}

export function selectFares(fares, { destination, nights, depart, ret }) {
  return fares
    .filter((fare) => fare.roundTrip && fare.departDate && fare.returnDate)
    .filter((fare) => !depart || (fare.departDate === depart && (!ret || fare.returnDate === ret)))
    .filter((fare) => !nights || Math.abs(nightsBetween(fare.departDate, fare.returnDate) - nights) <= 1)
    .map((fare) => ({ ...fare, otherAirport: fare.destinationAirport && fare.destinationAirport !== destination ? fare.destinationAirport : null }))
    .sort((a, b) => Number(Boolean(a.otherAirport)) - Number(Boolean(b.otherAirport)) || a.pricePerPerson - b.pricePerPerson);
}

// months: YYYY-MM strings to search when dates are flexible.
export async function recentFares({ token, origin, destination, depart, ret, months = [], nights, adults = 1, fetchImpl }) {
  let raw = [];
  if (depart && ret) {
    raw = await pricesForDates({ token, fetchImpl, origin, destination, departureAt: depart, returnAt: ret, oneWay: false });
    if (!raw.length) raw = await groupedPrices({ token, fetchImpl, origin, destination, departureAt: depart.slice(0, 7), minTripDays: Math.max(1, nights - 1), maxTripDays: nights + 1 });
  } else {
    for (const month of months.slice(0, 3)) {
      raw.push(...await groupedPrices({ token, fetchImpl, origin, destination, departureAt: month, minTripDays: Math.max(1, nights - 1), maxTripDays: nights + 1 }));
    }
  }
  const exact = depart && ret ? selectFares(raw, { destination, nights, depart, ret }) : [];
  const fares = (exact.length ? exact : selectFares(raw, { destination, nights })).slice(0, 3).map((fare) => ({
    ...fare,
    exactDates: Boolean(depart && fare.departDate === depart && fare.returnDate === ret),
    adults,
    groupTotal: fare.pricePerPerson * adults,
    searchUrl: aviasalesSearchUrl({ origin, destination: fare.destinationAirport || destination, depart: fare.departDate, ret: fare.returnDate, adults }),
  }));
  return fares;
}

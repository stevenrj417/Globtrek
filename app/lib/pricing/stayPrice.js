// Stay prices, in one hierarchy shown the same way everywhere:
//
//   live         a date-specific rate from an approved live-rate API (none is
//                connected today; see BookingComDemandHotelProvider)
//   observed     a price GlobTrek saw on Booking.com, with the date it was checked
//   estimate     GlobTrek's model, with its basis spelled out
//   unavailable  no trustworthy price: the traveler checks Booking.com
//
// The CJ catalog feed is never a price source. A missing price is never $0.

import { CHEAP_STAYS, CHEAP_STAYS_CHECKED, stayNightFor } from "../../data/cheapStays.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// The hostel prices in cheapStays.js were observed for these stay months.
const OBSERVED_MONTH = { MSY: 3 };

export const PRICE_KIND_LABEL = Object.freeze({
  live: "Live price",
  observed: "Recently observed price",
  estimate: "GlobTrek estimate",
  unavailable: "Price not available",
});

export function bookingPath(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("booking.com") ? parsed.pathname.replace(/^\/hotel\//, "").replace(/(\.[a-z]{2}(-[a-z]{2})?)?\.html$/i, "") : null;
  } catch {
    return null;
  }
}

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function checkedLabel(iso) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

// The month GlobTrek's observed hostel price for this airport was checked for.
export function observedMonthFor(airport) {
  return OBSERVED_MONTH[String(airport || "").toUpperCase()] || 2;
}

// The observed hostel price for this property, when it is the one GlobTrek checked.
function observedStay(property, airport) {
  const stay = CHEAP_STAYS[String(airport || "").toUpperCase()];
  if (!stay || bookingPath(property?.bookingUrl) !== bookingPath(`https://www.booking.com/hotel/${stay.path}`)) return null;
  return stay;
}

// units: beds (one per traveler) or rooms (one per two travelers).
export function stayPrice(property, { airport, nights, travelers, month = null, privateRoom = false, liveRate = null }) {
  const rooms = Math.max(1, Math.ceil(travelers / 2));
  if (liveRate?.total > 0 && liveRate.currency === "USD") {
    return { kind: "live", unit: "room", units: rooms, perUnit: Math.round(liveRate.total / nights / rooms), perNight: Math.round(liveRate.total / nights), nights, total: Math.round(liveRate.total), label: `${money(liveRate.total)} for ${nights} nights`, detail: `Live rate from ${liveRate.source}, retrieved ${liveRate.retrievedAt}` };
  }
  // An observed bed price says nothing about a private room's price.
  const observed = observedStay(property, airport);
  if (observed && !(privateRoom && observed.bedNight)) {
    const unit = observed.bedNight ? "bed" : "room";
    const units = unit === "bed" ? travelers : rooms;
    const base = observed.bedNight || observed.roomNight;
    const observedMonth = observedMonthFor(airport);
    const sameMonth = !month || month === observedMonth;
    const perUnit = sameMonth ? base : stayNightFor({ airport }, month);
    const perNight = perUnit * units;
    const what = unit === "bed" ? `dorm bed${units === 1 ? "" : "s"}` : `room${units === 1 ? "" : "s"}`;
    const math = `${money(perUnit)} × ${units} ${what} × ${nights} night${nights === 1 ? "" : "s"}`;
    return sameMonth
      ? { kind: "observed", unit, units, perUnit, perNight, nights, total: perNight * nights, observedAt: CHEAP_STAYS_CHECKED, label: `${money(perUnit)} a ${unit} per night`, math, detail: `Cheapest ${unit === "bed" ? "dorm bed" : "room"} seen on Booking.com for ${MONTHS[observedMonth - 1]} 2027 dates, taxes included, checked ${checkedLabel(CHEAP_STAYS_CHECKED)}.` }
      : { kind: "estimate", unit, units, perUnit, perNight, nights, total: perNight * nights, observedAt: CHEAP_STAYS_CHECKED, label: `About ${money(perUnit)} a ${unit} per night`, math, detail: `GlobTrek estimate for ${MONTHS[month - 1]}: the ${money(base)} price seen on Booking.com for ${MONTHS[observedMonth - 1]} (checked ${checkedLabel(CHEAP_STAYS_CHECKED)}), adjusted for ${MONTHS[month - 1]} demand.` };
  }
  const low = Number(property?.typicalNightlyLow);
  const high = Number(property?.typicalNightlyHigh);
  if (Number.isFinite(low) && Number.isFinite(high) && low > 0 && high >= low && property?.priceSource) {
    const perUnit = Math.round((low + high) / 2);
    return { kind: "estimate", unit: "room", units: rooms, perUnit, perNight: perUnit * rooms, nights, total: perUnit * rooms * nights, observedAt: property.lastPriceUpdated || null, label: `About ${money(low)}–${money(high)} a room per night`, math: `${money(perUnit)} × ${rooms} room${rooms === 1 ? "" : "s"} × ${nights} night${nights === 1 ? "" : "s"}`, detail: `GlobTrek estimate from this property's typical nightly range${property.lastPriceUpdated ? `, last reviewed ${String(property.lastPriceUpdated).slice(0, 10)}` : ""}. Not a quote.` };
  }
  return { kind: "unavailable", unit: null, units: null, perUnit: null, perNight: null, nights, total: null, label: "Price not available", detail: "Check the current price and availability on Booking.com." };
}

// What the budget engine needs from a chosen stay's price (null keeps the plan's own estimate).
export function stayBudgetOption(property, price) {
  if (!price || price.kind === "unavailable" || !(price.perUnit > 0)) return null;
  return { perUnit: price.perUnit, unit: price.unit, name: property.name, propertyId: property.id, priceKind: price.kind, observedAt: price.observedAt || null };
}

// What one stay at one property should cost, from the best evidence there is.
//
//   live_quote      the provider's price for these exact dates and guests
//   hotel_profile   this property's own observed prices for the 14-day
//                   periods the stay falls in (blended night by night when
//                   the stay crosses periods)
//   modeled         a destination-level planning estimate, labeled as such
//   unavailable     nothing honest to show
//
// A higher kind always wins. Holiday and event nights use the hotel's own
// observed prices for those nights when it has them; otherwise the estimate
// keeps its number and gains a demand note and a wider upper range taken
// from the hotel's own spread (p90), never a fixed surcharge.

import { usdRate } from "./aggregate.js";
import { comparableKey, exactNightPrices, nightsByPeriod, stayNights } from "./stayPeriods.js";
import { demandEvents } from "./demandCalendar.js";

const roundMoney = (value) => Math.round(value);

// A live quote counts only when it is for these dates and at least this many guests.
export function quoteMatches(quote, { checkIn, checkOut, adults, rooms }) {
  return Boolean(quote && quote.checkIn === checkIn && quote.checkOut === checkOut && Number(quote.adults) >= adults && Number(quote.rooms || 1) >= rooms && Number(quote.total) > 0 && /^[A-Z]{3}$/.test(quote.currency || ""));
}

function quoteUsd(quote, today) {
  const rate = usdRate(quote.currency, today);
  if (!rate) return null;
  const fees = quote.taxesIncluded === false ? Number(quote.taxesAndFees) || 0 : 0;
  return (Number(quote.total) + fees) * rate;
}

// profile: hotelPeriodProfile() for this property. roomKey picks the
// comparable room (occupancy|category|refundability); with none given the
// most-observed room is used.
function pickRoom(profile, roomKey) {
  const rooms = Object.entries(profile?.rooms || {});
  if (!rooms.length) return null;
  if (roomKey && profile.rooms[roomKey]) return [roomKey, profile.rooms[roomKey]];
  return rooms.sort(([, a], [, b]) => Object.values(b).reduce((sum, p) => sum + (p.samples || 0), 0) - Object.values(a).reduce((sum, p) => sum + (p.samples || 0), 0))[0];
}

export function estimateStay({ destination, checkIn, checkOut, adults = 1, rooms = 1, quote = null, profile = null, roomKey = null, observations = null, modeledNightly = null, today = new Date().toISOString().slice(0, 10) }) {
  const nights = stayNights(checkIn, checkOut);
  if (!nights.length) return { kind: "unavailable", reason: "dates" };
  const events = demandEvents(destination, checkIn, checkOut);
  const eventNights = new Set(events.flatMap((event) => event.nights));

  if (quoteMatches(quote, { checkIn, checkOut, adults, rooms })) {
    const total = quoteUsd(quote, today);
    if (total) {
      return { kind: "live_quote", total: roundMoney(total), perNight: roundMoney(total / nights.length), nights: nights.length, rooms, currency: "USD", quotedAt: quote.quotedAt || today, refundable: quote.refundable ?? null, room: quote.roomName || null, events, confidence: 0.95 };
    }
  }

  const room = pickRoom(profile, roomKey);
  if (room) {
    const [key, periods] = room;
    const exact = observations && eventNights.size ? exactNightPrices(observations, [...eventNights], key) : {};
    let total = 0;
    let high = 0;
    let covered = 0;
    let weight = 0;
    let conf = 0;
    const parts = [];
    for (const part of nightsByPeriod(checkIn, checkOut)) {
      const period = periods[part.period];
      if (!period?.median) { parts.push({ ...part, status: "insufficient" }); continue; }
      const partNights = nights.filter((night) => night.year === part.year && night.period === part.period);
      for (const night of partNights) {
        const observedNight = exact[night.date];
        const nightly = observedNight ?? period.median;
        total += nightly;
        // Event nights without their own observations: the hotel's own upper range.
        high += observedNight ?? (eventNights.has(night.date) ? period.p90 : period.p75);
        covered += 1;
      }
      weight += partNights.length;
      conf += period.confidence * partNights.length;
      parts.push({ ...part, medianUsd: period.median, samples: period.samples, status: period.status });
    }
    if (covered === nights.length) {
      const confidence = Number((conf / weight).toFixed(2));
      return {
        kind: "hotel_profile",
        total: roundMoney(total * rooms),
        high: roundMoney(high * rooms),
        perNight: roundMoney((total * rooms) / nights.length),
        nights: nights.length,
        rooms,
        currency: "USD",
        roomKey: key,
        periods: parts,
        blended: parts.length > 1,
        events,
        eventNightsObserved: Object.keys(exact).length,
        lowConfidence: confidence < 0.5 || parts.some((part) => part.status === "low_confidence"),
        confidence,
      };
    }
  }

  if (modeledNightly > 0) {
    const total = modeledNightly * nights.length * rooms;
    return { kind: "modeled", total: roundMoney(total), perNight: roundMoney(modeledNightly * rooms), nights: nights.length, rooms, currency: "USD", events, demandNote: events.length ? `${events.map((event) => event.name).join(", ")} falls in these dates; prices usually run higher and this estimate does not include that.` : null, confidence: 0.3 };
  }
  return { kind: "unavailable", nights: nights.length, events };
}

// For flexible travelers: the same stay length shifted across the window,
// cheapest first. Only windows priced from a live quote or the hotel's own
// profile are compared; modeled numbers can't rank dates honestly.
export function cheaperWindows({ destination, nights, from, to, profile, roomKey, observations, adults = 1, rooms = 1, step = 7 }) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  const out = [];
  for (let time = start; time + nights * 86400000 <= end; time += step * 86400000) {
    const checkIn = new Date(time).toISOString().slice(0, 10);
    const checkOut = new Date(time + nights * 86400000).toISOString().slice(0, 10);
    const estimate = estimateStay({ destination, checkIn, checkOut, adults, rooms, profile, roomKey, observations });
    if (estimate.kind === "hotel_profile") out.push({ checkIn, checkOut, total: estimate.total, confidence: estimate.confidence, events: estimate.events.map((event) => event.name) });
  }
  return out.sort((a, b) => a.total - b.total);
}

export { comparableKey };

// What the budget engine takes as a chosen stay (options.stay), or null when
// the estimate is too weak to replace the plan's own number.
export function stayEstimateOption(estimate, property) {
  if (!estimate || !["live_quote", "hotel_profile"].includes(estimate.kind) || !(estimate.total > 0)) return null;
  return { perUnit: Math.round(estimate.total / estimate.nights / estimate.rooms), unit: "room", name: property?.name || null, propertyId: property?.id || null, priceKind: estimate.kind, observedAt: estimate.quotedAt || null, confidence: estimate.confidence };
}

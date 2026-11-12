// Which exact stays to price next, so a small daily API budget goes where it
// helps travelers: stays someone is looking at, dates someone asked for,
// upcoming holiday weeks, popular places, then old or thin price data.

import { demandEvents } from "./demandCalendar.js";

export const REASON_WEIGHT = Object.freeze({
  viewed: 100,
  user_dates: 90,
  recommended: 70,
  upcoming_peak: 50,
  popular: 30,
  stale: 20,
  low_confidence: 15,
});

const DAY = 86400000;

// Sooner stays first (prices for them move fastest); nothing in the past or
// beyond the provider's 500-day window.
export function refreshPriority({ reason, checkIn, today = new Date().toISOString().slice(0, 10) }) {
  const daysAhead = (Date.parse(`${checkIn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY;
  if (!Number.isFinite(daysAhead) || daysAhead < 0 || daysAhead > 500) return null;
  return (REASON_WEIGHT[reason] || 0) + Math.max(0, 30 - Math.floor(daysAhead / 14));
}

// Holiday and event weeks in the next `horizonDays` for one destination, as
// stay windows worth pricing (one per event, arriving the day it starts).
export function peakWindows(destination, { today = new Date().toISOString().slice(0, 10), horizonDays = 180, nights = 3 } = {}) {
  const start = Date.parse(`${today}T00:00:00Z`);
  const end = new Date(start + horizonDays * DAY).toISOString().slice(0, 10);
  const seen = new Set();
  const windows = [];
  for (const event of demandEvents(destination, today, end)) {
    const checkIn = event.nights[0];
    if (seen.has(checkIn)) continue;
    seen.add(checkIn);
    windows.push({ checkIn, checkOut: new Date(Date.parse(`${checkIn}T00:00:00Z`) + nights * DAY).toISOString().slice(0, 10), reason: "upcoming_peak", event: event.name });
  }
  return windows;
}

// Queue rows, best first, deduplicated by property and stay, capped at `limit`.
export function planRefresh(candidates, { today, limit = 200 } = {}) {
  const best = new Map();
  for (const candidate of candidates) {
    const priority = refreshPriority({ ...candidate, today });
    if (priority == null || !candidate.itemId) continue;
    const key = [candidate.itemId, candidate.checkIn, candidate.checkOut, candidate.adults || 2, candidate.rooms || 1].join("|");
    if (!best.has(key) || best.get(key).priority < priority) best.set(key, { ...candidate, adults: candidate.adults || 2, rooms: candidate.rooms || 1, priority });
  }
  return [...best.values()].sort((a, b) => b.priority - a.priority).slice(0, limit);
}

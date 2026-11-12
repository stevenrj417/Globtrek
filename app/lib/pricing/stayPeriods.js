// Fourteen-day pricing periods for individual stays.
//
// The year is cut into 26 periods counted from January 1: period 1 is days
// 1–14, period 2 days 15–28, and so on; period 26 starts on day 351 and also
// takes the leftover day or two at the end of the year (Dec 17–31 in a normal
// year). A night belongs to the period of the date it starts on.
//
// A hotel's profile is built only from that hotel's own observations, kept
// apart by occupancy, room category and refundability so a dorm bed never
// averages with a suite. Nothing here creates a price.

import { dedupe } from "./observations.js";
import { toUsd } from "./aggregate.js";

export const PERIODS_PER_YEAR = 26;
export const PERIOD_DAYS = 14;
// A period average needs at least this many observed nights.
export const MIN_PERIOD_SAMPLES = 3;
// Older observations still describe the season, but count for less.
export const MAX_PROFILE_AGE_DAYS = 3 * 365;
const DAY = 86400000;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const utc = (value) => (typeof value === "string" && ISO_DAY.test(value.slice(0, 10)) ? Date.parse(`${value.slice(0, 10)}T00:00:00Z`) : NaN);
const iso = (time) => new Date(time).toISOString().slice(0, 10);

export function periodOf(date) {
  const time = utc(date);
  if (!Number.isFinite(time)) return null;
  const year = new Date(time).getUTCFullYear();
  const dayOfYear = Math.floor((time - Date.UTC(year, 0, 1)) / DAY);
  return { year, period: Math.min(PERIODS_PER_YEAR, Math.floor(dayOfYear / PERIOD_DAYS) + 1) };
}

export function periodBounds(year, period) {
  const start = Date.UTC(year, 0, 1) + (period - 1) * PERIOD_DAYS * DAY;
  const end = period === PERIODS_PER_YEAR ? Date.UTC(year, 11, 31) : start + (PERIOD_DAYS - 1) * DAY;
  return { start: iso(start), end: iso(end) };
}

// Each night of a stay, with its period. checkOut is exclusive.
export function stayNights(checkIn, checkOut) {
  const start = utc(checkIn);
  const end = utc(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 60 * DAY) return [];
  const nights = [];
  for (let time = start; time < end; time += DAY) nights.push({ date: iso(time), ...periodOf(iso(time)) });
  return nights;
}

// How many nights of the stay fall in each period (a stay can span two or three).
export function nightsByPeriod(checkIn, checkOut) {
  const counts = new Map();
  for (const night of stayNights(checkIn, checkOut)) {
    const key = `${night.year}-${night.period}`;
    counts.set(key, { year: night.year, period: night.period, nights: (counts.get(key)?.nights || 0) + 1 });
  }
  return [...counts.values()];
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

// Median-led summary that keeps one promotional rate or one suite from
// moving it: with five or more values, anything outside Tukey's fences
// (1.5 × the interquartile range) is set aside and counted.
export function robustStats(values) {
  const all = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!all.length) return null;
  let kept = all;
  if (all.length >= 5) {
    const q1 = quantile(all, 0.25);
    const q3 = quantile(all, 0.75);
    const spread = q3 - q1;
    kept = all.filter((value) => value >= q1 - 1.5 * spread && value <= q3 + 1.5 * spread);
  }
  const round = (value) => Math.round(value);
  return {
    samples: kept.length,
    excluded: all.length - kept.length,
    median: round(quantile(kept, 0.5)),
    mean: round(kept.reduce((sum, value) => sum + value, 0) / kept.length),
    min: round(kept[0]),
    max: round(kept.at(-1)),
    p10: round(quantile(kept, 0.1)),
    p25: round(quantile(kept, 0.25)),
    p75: round(quantile(kept, 0.75)),
    p90: round(quantile(kept, 0.9)),
  };
}

// Rooms are only compared with rooms like them.
export function comparableKey(row) {
  const refundable = row.conditions?.refundable;
  return [row.occupancy ?? "any", String(row.roomType || "standard").toLowerCase(), refundable === true ? "refundable" : refundable === false ? "nonrefundable" : "any"].join("|");
}

// One USD price per night per observation. A quote for a multi-night stay
// is spread over its nights; mandatory taxes and fees are added when the
// provider listed them separately.
export function nightlyRows(rows) {
  const out = [];
  for (const row of dedupe(rows)) {
    if (row.kind !== "stay" || !row.travelDate) continue;
    const usd = toUsd(row);
    if (!usd) continue;
    const nights = row.travelEnd ? stayNights(row.travelDate, row.travelEnd) : [{ date: row.travelDate, ...periodOf(row.travelDate) }];
    if (!nights.length) continue;
    const perStay = row.unit === "per_stay";
    const fees = Number(row.conditions?.taxesAndFees) > 0 && row.taxesIncluded === false ? Number(row.conditions.taxesAndFees) * (usd / row.price) : 0;
    const perNight = perStay ? (usd + fees) / nights.length : usd + fees / nights.length;
    for (const night of nights) out.push({ ...night, usd: perNight, observedAt: row.observedAt, key: comparableKey(row) });
  }
  return out;
}

function confidence(stats, newestAgeDays, years) {
  if (!stats) return 0;
  const score = 0.35 + Math.min(stats.samples, 30) * 0.015 + (years > 1 ? 0.1 : 0) - (newestAgeDays > 120 ? 0.15 : newestAgeDays > 45 ? 0.05 : 0);
  return Number(Math.max(0.1, Math.min(0.9, score)).toFixed(2));
}

// The profile for ONE property: per comparable room, per period, the robust
// summary across all years seen, and per year for year-over-year comparison.
// Periods with too few nights are kept with samples and no price, so callers
// show "low confidence" instead of a number.
export function hotelPeriodProfile(rows, { now = Date.now() } = {}) {
  const nights = nightlyRows(rows).filter((night) => now - utc(night.observedAt) <= MAX_PROFILE_AGE_DAYS * DAY);
  const byKey = {};
  for (const night of nights) ((byKey[night.key] ||= {})[night.period] ||= []).push(night);
  const rooms = {};
  for (const [key, periods] of Object.entries(byKey)) {
    rooms[key] = {};
    for (const [period, group] of Object.entries(periods)) {
      const observed = group.map((night) => night.observedAt).sort();
      const newestAgeDays = Math.round((now - utc(observed.at(-1))) / DAY);
      const years = [...new Set(group.map((night) => night.year))].sort();
      const stats = robustStats(group.map((night) => night.usd));
      const enough = stats && stats.samples >= MIN_PERIOD_SAMPLES;
      rooms[key][period] = {
        period: Number(period),
        ...(enough ? stats : { samples: stats?.samples || 0, excluded: stats?.excluded || 0 }),
        byYear: Object.fromEntries(years.map((year) => [year, robustStats(group.filter((night) => night.year === year).map((night) => night.usd))?.median ?? null])),
        observedFrom: observed[0],
        observedTo: observed.at(-1),
        newestAgeDays,
        confidence: enough ? confidence(stats, newestAgeDays, years.length) : 0,
        status: enough ? (stats.samples >= 10 ? "observed" : "low_confidence") : "insufficient",
      };
    }
  }
  return { rooms, nights: nights.length };
}

// Observed prices for these exact nights, when the hotel has them (event
// nights especially: a festival week shows up here before any average).
export function exactNightPrices(rows, dates, key) {
  const wanted = new Set(dates);
  const found = {};
  for (const night of nightlyRows(rows)) {
    if (wanted.has(night.date) && (!key || night.key === key)) (found[night.date] ||= []).push(night.usd);
  }
  return Object.fromEntries(Object.entries(found).map(([date, values]) => [date, robustStats(values).median]));
}

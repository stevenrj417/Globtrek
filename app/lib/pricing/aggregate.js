// Averages built from observations for one item and one travel date.
//
//   observed_biweekly  enough observations for the same half-month of travel
//   observed_monthly   too few for the half-month, enough for the month
//   insufficient       observations exist but too few to average: the caller
//                      falls back to a labeled model or "unavailable"
//   none               nothing observed for this item
//
// Observations only count for the period they price (travelDate), whatever
// year they were seen in; observedFrom/observedTo say when they were seen.
// Prices are converted to USD at the rate for the day each was observed.
// Prices in a currency without a reference rate are left out, not guessed.

import fx from "../../data/pricing/fxRates.json" with { type: "json" };
import { dedupe, travelMonth, travelPeriod } from "./observations.js";

export const MIN_SAMPLES = 3;
// Observations older than this say little about prices now.
export const MAX_AGE_DAYS = 400;
const DAY = 86400000;
const RATE_DATES = Object.keys(fx.usdPerUnit).sort();

// USD for one unit of `currency`, from the reference day nearest `date`.
export function usdRate(currency, date) {
  if (currency === "USD") return 1;
  if (!RATE_DATES.length) return null;
  let nearest = RATE_DATES[0];
  for (const candidate of RATE_DATES) {
    if (Math.abs(Date.parse(candidate) - Date.parse(date)) < Math.abs(Date.parse(nearest) - Date.parse(date))) nearest = candidate;
  }
  return fx.usdPerUnit[nearest]?.[currency] ?? fx.fallback?.usdPerUnit?.[currency] ?? null;
}

export function toUsd(row) {
  const rate = usdRate(row.currency, row.observedAt);
  return rate ? Math.round(row.price * rate * 100) / 100 : null;
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function summarize(rows, basis, period, now) {
  const prices = rows.map((row) => row.usd);
  const observed = rows.map((row) => row.observedAt).sort();
  const newestAgeDays = Math.round((now - Date.parse(`${observed.at(-1)}T00:00:00Z`)) / DAY);
  // More samples and fresher data earn more confidence; never full confidence
  // for prices that weren't quoted for the traveler's own dates.
  const confidence = Math.min(0.9, 0.45 + Math.min(rows.length, 20) * 0.02 - (newestAgeDays > 45 ? 0.15 : 0) - (basis === "observed_monthly" ? 0.1 : 0));
  return {
    basis,
    period,
    averageUsd: Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length),
    medianUsd: Math.round(median(prices)),
    lowUsd: Math.round(Math.min(...prices)),
    highUsd: Math.round(Math.max(...prices)),
    samples: rows.length,
    observedFrom: observed[0],
    observedTo: observed.at(-1),
    newestAgeDays,
    stale: newestAgeDays > 45,
    confidence: Number(confidence.toFixed(2)),
  };
}

// rows: observations for ONE item (one route, one property and room type, ...).
export function aggregateFor(rows, travelDate, { now = Date.now() } = {}) {
  const usable = dedupe(rows)
    .filter((row) => row.travelDate && now - Date.parse(`${row.observedAt}T00:00:00Z`) <= MAX_AGE_DAYS * DAY)
    .map((row) => ({ ...row, usd: toUsd(row) }))
    .filter((row) => row.usd);
  if (!usable.length) return { basis: "none", samples: 0 };
  const period = travelPeriod(travelDate);
  const month = travelMonth(travelDate);
  const inPeriod = usable.filter((row) => travelPeriod(row.travelDate) === period);
  if (inPeriod.length >= MIN_SAMPLES) return summarize(inPeriod, "observed_biweekly", period, now);
  const inMonth = usable.filter((row) => travelMonth(row.travelDate) === month);
  if (inMonth.length >= MIN_SAMPLES) return summarize(inMonth, "observed_monthly", month, now);
  return { basis: "insufficient", samples: inMonth.length, period: month };
}

// Compact per-period summaries for one item, for a price index: every half-month
// and every month of travel with enough observations.
export function periodSummaries(rows, { now = Date.now() } = {}) {
  const usable = dedupe(rows)
    .filter((row) => row.travelDate && now - Date.parse(`${row.observedAt}T00:00:00Z`) <= MAX_AGE_DAYS * DAY)
    .map((row) => ({ ...row, usd: toUsd(row) }))
    .filter((row) => row.usd);
  const groups = {};
  for (const row of usable) {
    for (const key of [travelPeriod(row.travelDate), travelMonth(row.travelDate)]) (groups[key] ||= []).push(row);
  }
  return Object.fromEntries(Object.entries(groups)
    .filter(([, group]) => group.length >= MIN_SAMPLES)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => [key, summarize(group, key.length === 3 ? "observed_biweekly" : "observed_monthly", key, now)]));
}

import { buildBudgetPlan } from "./budgetEngine.js";

// The one place a non-live trip estimate is turned into display numbers.
// Categories are rounded first and the totals are the sum of the rounded
// categories, so the "What's included" breakdown always adds up exactly.

const LABELS = { hotel: "Lodging", food: "Food", activities: "Activities", transportation: "Local transport", miscBuffer: "Planning reserve" };
const ORDER = ["hotel", "food", "activities", "transportation", "miscBuffer"];

function roundTo(value, step = 10) {
  return Math.round((Number(value) || 0) / step) * step;
}

export function estimateTrip(destination, { nights = 5, travelers = 2, startDate = null } = {}) {
  const profile = {
    exactBudget: 0,
    tripLength: nights,
    travelers,
    dates: startDate ? { start: startDate } : {},
    includedBudgetCategories: { flights: false, hotel: true, food: true, activities: true, transportation: true },
  };
  const plan = buildBudgetPlan(profile, destination);
  const breakdown = ORDER.map((key) => {
    const item = plan.estimates[key];
    return { key, label: LABELS[key], low: roundTo(item.low), high: roundTo(item.high) };
  }).filter((item) => item.high > 0);
  return {
    low: breakdown.reduce((sum, item) => sum + item.low, 0),
    high: breakdown.reduce((sum, item) => sum + item.high, 0),
    nights,
    travelers,
    breakdown,
    excludes: ["Flights"],
    basis: "Modeled good-value estimate for a clean, well-reviewed budget or simple three-star stay. Not a live quote.",
    source: plan.estimates.hotel.source,
    lastUpdated: plan.estimates.hotel.lastUpdated,
  };
}

export function formatMoney(value) {
  return `$${Math.round(Number(value) || 0).toLocaleString("en-US")}`;
}

// "$1,000–$2,300": en dash, no spaces, thousands separator, no decimals.
export function formatRange(low, high) {
  return low === high ? formatMoney(low) : `${formatMoney(low)}–${formatMoney(high)}`;
}

export function formatNights(nights) {
  return nights === 7 ? "1 week" : `${nights} night${nights === 1 ? "" : "s"}`;
}

// "Est. $1,000–$2,300 · 2 travelers · 1 week · before flights"
export function estimateLine(estimate) {
  return `Est. ${formatRange(estimate.low, estimate.high)} · ${estimate.travelers} traveler${estimate.travelers === 1 ? "" : "s"} · ${formatNights(estimate.nights)} · before flights`;
}

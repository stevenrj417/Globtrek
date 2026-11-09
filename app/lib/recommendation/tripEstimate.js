import { buildBudgetPlan } from "./budgetEngine.js";

// The one place a non-live trip estimate is turned into display numbers.
// Categories are rounded first and the totals are the sum of the rounded
// categories, so the "What's included" breakdown always adds up exactly.

const LABELS = { hotel: "Lodging", food: "Food", activities: "Activities", transportation: "Local transport", miscBuffer: "Planning reserve" };
const ORDER = ["hotel", "food", "activities", "transportation", "miscBuffer"];

function roundTo(value, step = 10) {
  return Math.round((Number(value) || 0) / step) * step;
}

export function estimateTrip(destination, { nights = 5, travelers = 1, startDate = null, spendStyle = "value" } = {}) {
  // Shown before anyone gives a budget, so it uses the same default as the planner: cheap but sane.
  const profile = {
    exactBudget: 0,
    tripLength: nights,
    travelers,
    spendStyle,
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
    basis: plan.lodging?.type === "hostel_bed"
      ? `Rock bottom: a bed at ${plan.lodging.name} (Booking.com, taxes in), fast food and street food, transit and free things to do. Not a live quote.`
      : "Modeled good-value estimate for a clean, well-reviewed budget or simple three-star stay. Not a live quote.",
    source: plan.estimates.hotel.source,
    lastUpdated: plan.estimates.hotel.lastUpdated,
  };
}

export { estimateLine, formatMoney, formatNights, formatRange } from "../format.js";

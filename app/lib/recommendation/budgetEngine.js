import { destinationCostProfile, seasonFor } from "./costProfiles.js";
import { estimateFlight } from "./travelFeasibility.js";

const CATEGORY_KEYS = ["flights", "hotel", "food", "activities", "transportation"];

function estimate(category, low, high, source, confidence, isLive = false) {
  return { category, low: Math.round(low), high: Math.round(high), source, confidence, lastUpdated: "2026-08-14", isLive };
}

export function buildBudgetPlan(profile, destination) {
  const targetBudget = profile.exactBudget || 0;
  const includes = profile.includedBudgetCategories;
  const nights = profile.tripLength;
  const travelers = profile.travelers;
  const cost = destinationCostProfile(destination);
  const season = seasonFor(destination, profile);
  const flight = estimateFlight(profile, destination);
  const categories = {
    flights: { ...estimate("flights", includes.flights ? flight.low * travelers : 0, includes.flights ? flight.high * travelers : 0, flight.priceSource, flight.confidence, flight.isLive), currency: flight.currency, priceLastChecked: flight.priceLastChecked },
    hotel: estimate("hotel", includes.hotel ? cost.typicalHotelNightLow * nights * season.multiplier : 0, includes.hotel ? cost.typicalHotelNightHigh * nights * season.multiplier : 0, cost.source, cost.confidence),
    food: estimate("food", includes.food ? cost.foodDailyLow * nights * travelers : 0, includes.food ? cost.foodDailyHigh * nights * travelers : 0, cost.source, cost.confidence),
    activities: estimate("activities", includes.activities ? cost.activitiesDailyLow * nights * travelers : 0, includes.activities ? cost.activitiesDailyHigh * nights * travelers : 0, cost.source, cost.confidence),
    transportation: estimate("transportation", includes.transportation ? cost.transportDailyLow * nights : 0, includes.transportation ? cost.transportDailyHigh * nights : 0, cost.source, cost.confidence),
  };
  const active = CATEGORY_KEYS.filter((key) => includes[key]);
  const rawLow = active.reduce((sum, key) => sum + categories[key].low, 0);
  const rawHigh = active.reduce((sum, key) => sum + categories[key].high, 0);
  const bufferHigh = Math.round(Math.min(targetBudget * 0.06, Math.max(0, targetBudget - rawLow)));
  const miscBuffer = estimate("miscBuffer", 0, bufferHigh, "globtrek_budget_rule", 0.8);
  const estimatedTripLow = rawLow;
  const estimatedTripHigh = rawHigh + bufferHigh;
  const permittedOverage = targetBudget > 0 ? Math.min(100, Math.round(targetBudget * 0.02)) : 0;
  const withinHardBudget = targetBudget <= 0 || estimatedTripHigh <= targetBudget + permittedOverage;
  const midpoint = (estimatedTripLow + estimatedTripHigh) / 2;
  const remainingBudget = targetBudget - midpoint;
  const ratio = targetBudget > 0 ? midpoint / targetBudget : Infinity;
  const budgetFeasibilityScore = targetBudget <= 0
    ? 50
    : profile.budgetMode === "closest"
      ? Math.max(0, Math.round(100 - Math.abs(1 - ratio) * 100))
      : ratio <= 1 ? 100 : Math.max(1, Math.round(100 / ratio));
  const budgetDifference = targetBudget > 0 ? Math.round(midpoint - targetBudget) : null;
  const percentOverBudget = targetBudget > 0 ? Math.max(0, budgetDifference / targetBudget) : 0;
  const budgetCompatibility = targetBudget <= 0
    ? "unknown"
    : withinHardBudget
      ? "excellent"
      : estimatedTripLow <= targetBudget * 1.15
        ? "acceptable"
        : "poor";
  const budgetCompatibilityScore = budgetCompatibility === "excellent" ? 100 : budgetCompatibility === "acceptable" ? Math.max(50, Math.round(85 - percentOverBudget * 100)) : Math.max(0, Math.round(45 - percentOverBudget * 60));
  // Lodging is the residual hard allocation after airfare and the lowest grounded
  // version of the included daily categories. Ranking then rejects properties
  // whose complete stay exceeds this amount.
  const nonHotelMinimum = Object.entries(categories).filter(([key]) => key !== "hotel").reduce((sum, [, value]) => sum + value.low, 0);
  const hotelSafetyReserve = targetBudget > 0 ? Math.min(100, Math.round(targetBudget * 0.02)) : 0;
  const hotelBudget = includes.hotel ? Math.max(0, targetBudget - nonHotelMinimum - hotelSafetyReserve) : 0;
  const optimization = ratio > 1 ? "reduce_cost" : ratio < 0.72 && profile.budgetMode === "closest" ? "consider_upgrade" : "balanced";
  const optimizationActions = optimization === "reduce_cost"
    ? [includes.hotel && "prefer_lower_cost_hotel", includes.activities && "reduce_optional_activities", includes.transportation && "use_lower_cost_local_transport", "consider_next_affordable_destination"].filter(Boolean)
    : optimization === "consider_upgrade"
      ? [includes.hotel && "consider_better_value_hotel", includes.activities && "add_high_priority_activity"].filter(Boolean)
      : [];

  return {
    targetBudget,
    includedBudgetCategories: includes,
    estimates: { ...categories, miscBuffer },
    flightEstimate: categories.flights,
    hotelBudget: Math.round(hotelBudget),
    foodBudget: categories.food,
    activitiesBudget: categories.activities,
    transportationBudget: categories.transportation,
    miscBuffer,
    estimatedTripLow,
    estimatedTripHigh,
    estimatedTotalCost: { low: estimatedTripLow, high: estimatedTripHigh, midpoint: Math.round(midpoint) },
    budgetDifference,
    percentOverBudget,
    budgetCompatibility,
    budgetCompatibilityScore,
    permittedOverage,
    withinHardBudget,
    remainingBudget: Math.round(remainingBudget),
    budgetFeasibilityScore,
    season,
    confidence: Math.min(...active.map((key) => categories[key].confidence), 0.8),
    isLive: false,
    optimization: withinHardBudget ? optimization : "reduce_cost",
    optimizationActions,
  };
}

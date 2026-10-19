import { destinationCostProfile, seasonFor } from "./costProfiles.js";
import { estimateFlight } from "./travelFeasibility.js";

const CATEGORY_KEYS = ["flights", "hotel", "food", "activities", "transportation"];

function estimate(category, average, source, confidence, isLive = false, spread = 0.15) {
  const roundedAverage = Math.round(average);
  return { category, low: Math.round(average * (1 - spread)), high: Math.round(average * (1 + spread)), average: roundedAverage, source, confidence, lastUpdated: "2026-08-14", isLive };
}

export function buildBudgetPlan(profile, destination) {
  const targetBudget = profile.exactBudget || 0;
  const includes = profile.includedBudgetCategories;
  const nights = profile.tripLength;
  const travelers = profile.travelers;
  const cost = destinationCostProfile(destination);
  const season = seasonFor(destination, profile);
  const flight = estimateFlight(profile, destination);
  const month = profile?.dates?.start ? new Date(`${profile.dates.start}T00:00:00Z`).getUTCMonth() + 1 : 5;
  const cityAverage = destination.planningAverages?.monthly?.find((item) => item.month === month) || {
    hotelNight: cost.typicalHotelNightLow,
    foodPerPersonDay: cost.foodDailyLow,
    activitiesPerPersonDay: cost.activitiesDailyLow,
    localTransportDay: cost.transportDailyLow,
  };
  const categories = {
    flights: { ...estimate("flights", includes.flights ? flight.average * travelers : 0, flight.priceSource, flight.confidence, flight.isLive, 0.12), currency: flight.currency, priceLastChecked: flight.priceLastChecked, cabinClass: flight.cabinClass, tripType: flight.tripType, monthlyAverageEconomyRoundTrip: flight.monthlyAverageEconomyRoundTrip },
    hotel: estimate("hotel", includes.hotel ? cityAverage.hotelNight * nights : 0, destination.planningAverages?.source || cost.source, destination.planningAverages?.confidence || cost.confidence, false, 0.15),
    food: estimate("food", includes.food ? cityAverage.foodPerPersonDay * nights * travelers : 0, destination.planningAverages?.source || cost.source, destination.planningAverages?.confidence || cost.confidence, false, 0.15),
    activities: estimate("activities", includes.activities ? cityAverage.activitiesPerPersonDay * nights * travelers : 0, destination.planningAverages?.source || cost.source, destination.planningAverages?.confidence || cost.confidence, false, 0.15),
    transportation: estimate("transportation", includes.transportation ? cityAverage.localTransportDay * nights : 0, destination.planningAverages?.source || cost.source, destination.planningAverages?.confidence || cost.confidence, false, 0.15),
  };
  const active = CATEGORY_KEYS.filter((key) => includes[key]);
  const rawLow = active.reduce((sum, key) => sum + categories[key].low, 0);
  const rawHigh = active.reduce((sum, key) => sum + categories[key].high, 0);
  const bufferHigh = Math.round(Math.min(targetBudget * 0.06, Math.max(0, targetBudget - rawLow)));
  const miscBuffer = { ...estimate("miscBuffer", bufferHigh, "globtrek_budget_rule", 0.8, false, 0), low: 0 };
  const estimatedTripLow = rawLow;
  const estimatedTripHigh = rawHigh + bufferHigh;
  const estimatedTripAverage = Math.round(active.reduce((sum, key) => sum + categories[key].average, 0) + bufferHigh);
  // The stated budget is an exact ceiling. Keep this field for serialized-trip
  // compatibility, but never permit an estimated overage.
  const permittedOverage = 0;
  const withinHardBudget = targetBudget <= 0 || estimatedTripHigh <= targetBudget;
  const midpoint = (estimatedTripLow + estimatedTripHigh) / 2;
  const remainingBudget = targetBudget - estimatedTripAverage;
  const ratio = targetBudget > 0 ? estimatedTripAverage / targetBudget : Infinity;
  const budgetFeasibilityScore = targetBudget <= 0
    ? 50
    : profile.budgetMode === "closest"
      ? Math.max(0, Math.round(100 - Math.abs(1 - ratio) * 100))
      : ratio <= 1 ? 100 : Math.max(1, Math.round(100 / ratio));
  const budgetDifference = targetBudget > 0 ? Math.round(estimatedTripAverage - targetBudget) : null;
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
    estimatedTripAverage,
    estimatedTotalCost: { low: estimatedTripLow, high: estimatedTripHigh, midpoint: Math.round(midpoint), average: estimatedTripAverage },
    budgetDifference,
    percentOverBudget,
    budgetCompatibility,
    budgetCompatibilityScore,
    permittedOverage,
    withinHardBudget,
    budgetBasis: "good_value_monthly_average_with_uncertainty_buffer",
    cityPlanningAverage: cityAverage,
    remainingBudget: Math.round(remainingBudget),
    budgetFeasibilityScore,
    season,
    confidence: Math.min(...active.map((key) => categories[key].confidence), 0.8),
    isLive: false,
    optimization: withinHardBudget ? optimization : "reduce_cost",
    optimizationActions,
  };
}

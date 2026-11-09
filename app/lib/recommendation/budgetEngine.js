import { destinationCostProfile, seasonFor } from "./costProfiles.js";
import { estimateFlight } from "./travelFeasibility.js";
import { observedMonthFor } from "../pricing/stayPrice.js";
import { CHEAP_STAYS_CHECKED, cheapStayFor, stayNightFor } from "../../data/cheapStays.js";

const CATEGORY_KEYS = ["flights", "hotel", "food", "activities", "transportation"];

// Budget modes. "cheapest" is rock bottom: a hostel bed (or the cheapest room when
// that costs less), fast food and street food, and free things to do; "comfortable"
// assumes a nicer room and more sit-down meals.
const SPEND_STYLE_FACTORS = {
  cheapest: { hotel: 0.85, food: 0.8, activities: 0.5 },
  value: { hotel: 1, food: 1, activities: 1 },
  comfortable: { hotel: 1.3, food: 1.2, activities: 1 },
};

function estimate(category, average, source, confidence, isLive = false, spread = 0.15) {
  const roundedAverage = Math.round(average);
  return { category, low: Math.round(average * (1 - spread)), high: Math.round(average * (1 + spread)), average: roundedAverage, source, confidence, lastUpdated: "2026-08-14", isLive };
}

// options.stay: the traveler's chosen stay when it has a trustworthy price
// ({ perUnit, unit: "bed" | "room", name, propertyId, priceKind, observedAt }).
export function buildBudgetPlan(profile, destination, options = {}) {
  const targetBudget = profile.exactBudget || 0;
  const includes = profile.includedBudgetCategories;
  const nights = profile.tripLength;
  const travelers = profile.travelers;
  const cost = destinationCostProfile(destination);
  const season = seasonFor(destination, profile);
  const flight = estimateFlight(profile, destination);
  const month = profile?.dates?.start ? new Date(`${profile.dates.start}T00:00:00Z`).getUTCMonth() + 1 : 5;
  const baseCityAverage = destination.planningAverages?.monthly?.find((item) => item.month === month) || {
    hotelNight: cost.typicalHotelNightLow,
    foodPerPersonDay: cost.foodDailyLow,
    activitiesPerPersonDay: cost.activitiesDailyLow,
    localTransportDay: cost.transportDailyLow,
  };
  // True trip total: lodging tax rides on the room rate, and a round-trip airport
  // transfer for every traveler rides on local transportation.
  const style = SPEND_STYLE_FACTORS[profile.spendStyle] || SPEND_STYLE_FACTORS.value;
  const cityAverage = {
    ...baseCityAverage,
    hotelNight: baseCityAverage.hotelNight * style.hotel,
    foodPerPersonDay: baseCityAverage.foodPerPersonDay * style.food,
    activitiesPerPersonDay: baseCityAverage.activitiesPerPersonDay * style.activities,
  };
  // Lodging is one explicit line: price per bed or room × beds or rooms × nights.
  // Hotel cards, the cost table and saved trips all show this same breakdown.
  // Rock bottom prices a real hostel bed per traveler (a price observed on
  // Booking.com, adjusted for the month), unless the traveler asked for a private
  // room or a room costs less. Otherwise it is GlobTrek's modeled city room rate.
  const rooms = Math.max(1, Math.ceil(travelers / 2));
  const cheap = profile.spendStyle === "cheapest" ? cheapStayFor(destination) : null;
  // Price the beds for the travel month; with no dates, the month the flight was priced for.
  const stayMonth = profile?.dates?.start ? month : flight?.fareMonth ? Number(String(flight.fareMonth).slice(5, 7)) : null;
  // The observed price is "observed" only for the month it was checked for; any other month is an estimate from it.
  const cheapKind = !stayMonth || stayMonth === observedMonthFor(destination.airport) ? "observed" : "estimate";
  const stayNight = cheap ? stayNightFor(destination, stayMonth) : null;
  const cityTaxRate = Number(destination.planningAverages?.lodgingTaxRate) || 0;
  const cityRoomNight = Math.round(cityAverage.hotelNight * (1 + cityTaxRate));
  const useBeds = Boolean(cheap?.bedNight) && profile.lodging !== "private" && (profile.lodging === "hostel" || stayNight * travelers <= cityRoomNight * rooms);
  const chosen = options.stay?.perUnit > 0 ? options.stay : null;
  const lodging = chosen
    ? { type: chosen.unit === "bed" ? "hostel_bed" : "private_room", unit: chosen.unit, units: chosen.unit === "bed" ? travelers : rooms, perUnit: Math.round(chosen.perUnit), name: chosen.name, propertyId: chosen.propertyId || null, priceKind: chosen.priceKind, observedAt: chosen.observedAt || null, month: stayMonth }
    : useBeds
      ? { type: "hostel_bed", unit: "bed", units: travelers, perUnit: stayNight, name: cheap.name, path: cheap.path, priceKind: cheapKind, observedAt: CHEAP_STAYS_CHECKED, month: stayMonth }
      : cheap?.roomNight
        ? { type: "private_room", unit: "room", units: rooms, perUnit: stayNight, name: cheap.name, path: cheap.path, priceKind: cheapKind, observedAt: CHEAP_STAYS_CHECKED, month: stayMonth }
        : { type: "private_room", unit: "room", units: rooms, perUnit: cityRoomNight, name: null, priceKind: "city_estimate", observedAt: null, month };
  lodging.perNight = lodging.perUnit * lodging.units;
  lodging.nights = nights;
  lodging.total = includes.hotel ? lodging.perNight * nights : 0;
  lodging.perBedNight = lodging.unit === "bed" ? lodging.perUnit : null;
  if (cheap) {
    cityAverage.foodPerPersonDay = Math.min(cityAverage.foodPerPersonDay, cheap.cheapFoodDay);
    cityAverage.activitiesPerPersonDay = 0;
  }
  const lodgingTaxRate = lodging.priceKind === "city_estimate" ? cityTaxRate : 0;
  const airportTransfers = (Number(destination.planningAverages?.airportTransferPerPerson) || 0) * 2 * travelers;
  const categories = {
    flights: { ...estimate("flights", includes.flights ? flight.average * travelers : 0, flight.priceSource, flight.confidence, flight.isLive, 0.12), currency: flight.currency, priceLastChecked: flight.priceLastChecked, cabinClass: flight.cabinClass, tripType: flight.tripType, monthlyAverageEconomyRoundTrip: flight.monthlyAverageEconomyRoundTrip, basis: flight.basis, fareWindow: flight.fareWindow || null, perTraveler: flight.average },
    hotel: estimate("hotel", lodging.total, destination.planningAverages?.source || cost.source, destination.planningAverages?.confidence || cost.confidence, false, 0.15),
    food: estimate("food", includes.food ? cityAverage.foodPerPersonDay * nights * travelers : 0, destination.planningAverages?.source || cost.source, destination.planningAverages?.confidence || cost.confidence, false, 0.15),
    activities: estimate("activities", includes.activities ? cityAverage.activitiesPerPersonDay * nights * travelers : 0, destination.planningAverages?.source || cost.source, destination.planningAverages?.confidence || cost.confidence, false, 0.15),
    transportation: estimate("transportation", includes.transportation ? cityAverage.localTransportDay * nights + airportTransfers : 0, destination.planningAverages?.source || cost.source, destination.planningAverages?.confidence || cost.confidence, false, 0.15),
  };
  const active = CATEGORY_KEYS.filter((key) => includes[key]);
  const rawLow = active.reduce((sum, key) => sum + categories[key].low, 0);
  const rawHigh = active.reduce((sum, key) => sum + categories[key].high, 0);
  const rawAverage = active.reduce((sum, key) => sum + categories[key].average, 0);
  // Affordability is checked against one realistic, bookable good-value plan—not
  // the simultaneous worst case for every category. A small reserve remains part
  // of that plan, and the result must still stay entirely under the stated budget.
  const planningReserve = rawAverage > 0 ? Math.round(Math.min(75, Math.max(15, rawAverage * 0.03))) : 0;
  const miscBuffer = { ...estimate("miscBuffer", planningReserve, "globtrek_budget_rule", 0.8, false, 0), low: 0 };
  const estimatedTripLow = rawLow;
  const estimatedTripHigh = rawHigh + planningReserve;
  const budgetCheckTotal = Math.round(rawAverage + planningReserve);
  const estimatedTripAverage = budgetCheckTotal;
  // The stated budget is an exact ceiling. Keep this field for serialized-trip
  // compatibility, but never permit an estimated overage.
  const permittedOverage = 0;
  const withinHardBudget = targetBudget <= 0 || budgetCheckTotal <= targetBudget;
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
  const nonHotelPlan = Object.entries(categories).filter(([key]) => key !== "hotel").reduce((sum, [, value]) => sum + value.average, 0);
  const hotelBudget = includes.hotel ? Math.max(0, targetBudget - nonHotelPlan - planningReserve) : 0;
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
    budgetCheckTotal,
    estimatedTotalCost: { low: estimatedTripLow, high: estimatedTripHigh, midpoint: Math.round(midpoint), average: estimatedTripAverage },
    budgetDifference,
    percentOverBudget,
    budgetCompatibility,
    budgetCompatibilityScore,
    permittedOverage,
    withinHardBudget,
    budgetBasis: "good_value_monthly_plan_with_reserve",
    cityPlanningAverage: cityAverage,
    spendStyle: profile.spendStyle || "value",
    lodgingTax: includes.hotel ? Math.round(cityAverage.hotelNight * lodgingTaxRate) * lodging.units * nights : 0,
    lodging,
    perTraveler: Math.round((rawAverage + planningReserve) / travelers),
    lodgingTaxRate,
    airportTransfers: includes.transportation ? Math.round(airportTransfers) : 0,
    remainingBudget: Math.round(remainingBudget),
    budgetFeasibilityScore,
    season,
    confidence: Math.min(...active.map((key) => categories[key].confidence), 0.8),
    isLive: false,
    optimization: withinHardBudget ? optimization : "reduce_cost",
    optimizationActions,
  };
}

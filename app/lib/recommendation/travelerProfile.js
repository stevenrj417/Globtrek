import { cleanInterests } from "../trip/extraInterests.js";
import { normalizeTravelArea, originFromTrip } from "./travelArea.js";
import { discoverySliderToUnknownness, legacyBudgetLabel, normalizeBudget } from "./budgetInput.js";
import { tripSchedule } from "../trip/schedule.js";
import { travelPeriod } from "../trip/period.js";

export { discoverySliderToUnknownness, legacyBudgetLabel, normalizeBudget };

// Budget modes: "cheapest" (absolute cheapest), "value" (best value, default), "comfortable".
export const SPEND_STYLES = ["cheapest", "value", "comfortable"];


export const DEFAULT_BUDGET_CATEGORIES = Object.freeze({
  flights: true,
  hotel: true,
  food: true,
  activities: true,
  transportation: true,
});

export function itineraryDayCount(input = {}) {
  return Math.min(28, Math.max(1, normalizeTravelerProfile(input).tripLength || 7));
}


export function normalizeTravelerProfile(input = {}) {
  const answers = input.answers || {};
  const originDetails = originFromTrip(input);
  const exactBudget = normalizeBudget(input.exactBudget ?? answers.exactBudget);
  const suppliedCategories = input.includedBudgetCategories || answers.includedBudgetCategories || {
    flights: input.budgetIncludesFlights,
    hotel: input.budgetIncludesHotel,
    food: input.budgetIncludesFood,
    activities: input.budgetIncludesActivities,
    transportation: input.budgetIncludesTransportation,
  };
  const includedBudgetCategories = Object.fromEntries(
    Object.keys(DEFAULT_BUDGET_CATEGORIES).map((key) => [key, suppliedCategories[key] ?? DEFAULT_BUDGET_CATEGORIES[key]]),
  );
  const travelers = Math.min(30, Math.max(1, Number.parseInt(input.guestCount ?? input.travelers, 10) || 1));
  const schedule = tripSchedule(input);
  const tripLength = schedule.nights;

  return {
    version: 2,
    origin: originDetails?.airportCode || null,
    originDetails,
    originCountryCode: originDetails?.countryCode || null,
    originCountry: originDetails?.countryName || null,
    travelAreaPreference: normalizeTravelArea(input.travelAreaPreference || answers.travelAreaPreference),
    dates: {
      start: schedule.start,
      end: schedule.end,
      flexible: schedule.flexible,
      season: answers.season || null,
      period: travelPeriod({ start: schedule.start, flexible: schedule.flexible, season: answers.season || null }),
    },
    tripLength,
    travelers,
    exactBudget,
    includedBudgetCategories,
    budgetIncludesFlights: includedBudgetCategories.flights,
    budgetIncludesHotel: includedBudgetCategories.hotel,
    budgetIncludesFood: includedBudgetCategories.food,
    budgetIncludesActivities: includedBudgetCategories.activities,
    budgetIncludesTransportation: includedBudgetCategories.transportation,
    budgetMode: input.budgetMode === "closest" ? "closest" : "under",
    // "auto": the budget engine plans the most comfortable style the budget covers.
    spendStyle: SPEND_STYLES.includes(input.spendStyle || input.answers?.spendStyle) ? (input.spendStyle || input.answers?.spendStyle) : "auto",
    // Two or more people get a private room unless they asked for a hostel bed or
    // explicitly chose the lowest-cost trip; few couples expect dorm beds.
    lodging: { "Hostel bed": "hostel", "Private room": "private", "Whole place": "home", Luxury: "luxury" }[answers.hotel]
      || (travelers >= 2 && (input.spendStyle || input.answers?.spendStyle) !== "cheapest" ? "private" : "either"),
    preferredDestinationId: input.destination || input.preferredDestination?.id || null,
    pace: answers.escape || null,
    relaxationPreference: ["Slow mornings", "Mostly relaxing"].includes(answers.escape) ? "high" : answers.escape === "Packed schedule" ? "low" : "medium",
    climatePreference: answers.alive || null,
    interests: answers.luxury ? [answers.luxury] : [],
    hotelPreference: answers.hotel || null,
    companions: answers.self || null,
    // Extras the traveler wants help booking (rental car, airport rides, ...).
    extras: cleanInterests(answers.extras),
    unknownness: Math.min(100, Math.max(0, Number.isFinite(Number(answers.discovery ?? input.discoveryLevel)) ? Number(answers.discovery ?? input.discoveryLevel) : 50)),
    otherExistingQuizPreferences: { ...answers },
  };
}


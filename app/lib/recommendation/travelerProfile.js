const DURATION_NIGHTS = {
  "Long Weekend": 3,
  "Five Nights": 5,
  "One Week": 7,
  "Ten Days": 10,
  "Two Weeks": 14,
  "Open-Ended": 7,
};

export const DEFAULT_BUDGET_CATEGORIES = Object.freeze({
  flights: true,
  hotel: true,
  food: true,
  activities: true,
  transportation: true,
});

export function normalizeBudget(value) {
  const numeric = typeof value === "string" ? Number(value.replace(/[$,\s]/g, "")) : Number(value);
  if (!Number.isFinite(numeric) || numeric < 100 || numeric > 1_000_000) return null;
  return Math.round(numeric);
}

export function discoverySliderToUnknownness(value) {
  const slider = Number.isFinite(Number(value)) ? Number(value) : 50;
  return 100 - Math.min(100, Math.max(0, slider));
}

export function itineraryDayCount(input = {}) {
  return Math.min(28, Math.max(1, normalizeTravelerProfile(input).tripLength || 7));
}

function dateNights(start, end) {
  const startTime = Date.parse(`${start || ""}T00:00:00Z`);
  const endTime = Date.parse(`${end || ""}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return null;
  return Math.min(60, Math.max(1, Math.round((endTime - startTime) / 86400000)));
}

export function normalizeTravelerProfile(input = {}) {
  const answers = input.answers || {};
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
  const tripLength = dateNights(input.tripStart, input.tripEnd) || DURATION_NIGHTS[answers.duration] || 7;

  return {
    version: 1,
    origin: String(input.originAirport || input.origin || "").trim().toUpperCase() || null,
    dates: {
      start: input.tripStart || null,
      end: input.tripEnd || null,
      flexible: Boolean(input.isFlexible),
      season: answers.season || null,
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
    pace: answers.escape || null,
    relaxationPreference: ["Slow mornings", "Mostly relaxing"].includes(answers.escape) ? "high" : answers.escape === "Packed schedule" ? "low" : "medium",
    climatePreference: answers.alive || null,
    interests: answers.luxury ? [answers.luxury] : [],
    hotelPreference: answers.hotel || null,
    companions: answers.self || null,
    unknownness: Math.min(100, Math.max(0, Number.isFinite(Number(answers.discovery ?? input.discoveryLevel)) ? Number(answers.discovery ?? input.discoveryLevel) : 50)),
    otherExistingQuizPreferences: { ...answers },
  };
}

export function legacyBudgetLabel(exactBudget) {
  if (exactBudget < 3000) return "Smart value";
  if (exactBudget < 6000) return "Comfortable";
  if (exactBudget < 10000) return "Premium";
  return "Blowout";
}

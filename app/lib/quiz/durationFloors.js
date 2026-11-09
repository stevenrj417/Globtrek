import { buildBudgetPlan } from "../recommendation/budgetEngine.js";
import { FARE_SNAPSHOTS } from "../../data/fareSnapshots.js";

// What the cheapest possible trip costs, so the quiz can grey out trip lengths
// a budget cannot cover. Deliberately generous: the cheapest destination, rock
// bottom, one traveler, and the lowest fare GlobTrek has for reaching that
// destination from any airport, so a length is ruled out only when no trip fits.
const CATEGORIES = ["hotel", "food", "activities", "transportation"];
const ALL = { flights: false, hotel: true, food: true, activities: true, transportation: true };

function perCategory(destination, nights) {
  const plan = buildBudgetPlan({ exactBudget: 0, tripLength: nights, travelers: 1, spendStyle: "cheapest", dates: {}, includedBudgetCategories: ALL }, destination);
  return Object.fromEntries(CATEGORIES.map((key) => [key, plan.estimates[key]?.average || 0]));
}

// Lowest round-trip fare to this destination: a fare seen on any route into it, else the planning model's cheapest.
function flightFloor(destination) {
  const airport = String(destination.airport || "").toUpperCase();
  const seen = Object.entries(FARE_SNAPSHOTS).filter(([route]) => route.endsWith(`:${airport}`)).flatMap(([, months]) => Object.values(months).map((month) => month.cheapest)).filter((fare) => fare > 0);
  if (seen.length) return Math.min(...seen);
  const plan = buildBudgetPlan({ exactBudget: 0, tripLength: 3, travelers: 1, spendStyle: "cheapest", dates: {}, includedBudgetCategories: { ...ALL, flights: true } }, destination);
  return Math.round(plan.estimates.flights?.low || plan.estimates.flights?.average || 0);
}

// [{ fixed: {hotel, food, …}, perNight: {…} }] per destination, fitted from two trip lengths.
export function durationFloors(destinations) {
  const ground = destinations.filter((destination) => destination.recommendationReady !== false).map((destination) => {
    const two = perCategory(destination, 2);
    const six = perCategory(destination, 6);
    const perNight = Object.fromEntries(CATEGORIES.map((key) => [key, Math.max(0, (six[key] - two[key]) / 4)]));
    const fixed = Object.fromEntries(CATEGORIES.map((key) => [key, Math.max(0, two[key] - perNight[key] * 2)]));
    const round = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Math.round(value * 10) / 10]));
    return { fixed: round(fixed), perNight: round(perNight), flight: flightFloor(destination) };
  });
  return { ground };
}

export { cheapestTrip } from "./cheapestTrip.js";

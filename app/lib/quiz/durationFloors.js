import { buildBudgetPlan } from "../recommendation/budgetEngine.js";
import fareIndex from "../../data/pricing/fareIndex.json" with { type: "json" };

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

// Lowest round-trip fare to this destination: the cheapest typical (median) fare
// Aviasales saw on any U.S. route into it (Travelpayouts Data API), else the planning model's cheapest.
// U.S. departure codes in the fare index (the quiz plans trips from the U.S.).
const US_ORIGINS = new Set("PDX SEA SFO OAK SJC LAX SAN SAC LAS PHX DEN SLC DFW HOU CHI MSP ATL NYC BOS WAS MIA AUS MSY BNA ORL BOI GEG RNO SAT ABQ TUS MKC STL DTT CLE CMH IND PHL PIT BWI CLT RDU TPA FLL MKE OMA OKC MEM SDF BDL ONT".split(" "));
function flightFloor(destination) {
  const airport = String(destination.airport || "").toUpperCase();
  const seen = Object.entries(fareIndex.routes || {}).filter(([route]) => route.endsWith(`-${airport}`) && US_ORIGINS.has(route.split("-")[0])).flatMap(([, months]) => Object.values(months).filter(Array.isArray).map((month) => month[1])).filter((fare) => fare > 0);
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

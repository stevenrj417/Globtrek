import { buildBudgetPlan } from "./budgetEngine.js";
import { assessTravelFeasibility } from "./travelFeasibility.js";
import { destinationMatchesTravelArea } from "./travelArea.js";

const ANSWER_WEIGHTS = { alive: 16, duration: 8, luxury: 10, escape: 8, self: 5 };

function preferenceScore(destination, answers) {
  const possible = Object.entries(ANSWER_WEIGHTS).filter(([key]) => answers?.[key]);
  if (!possible.length) return 50;
  const earned = possible.reduce((score, [key, weight]) => score + (destination.tags.includes(answers[key]) ? weight : 0), 0);
  const total = possible.reduce((score, [, weight]) => score + weight, 0);
  return Math.round(100 * earned / total);
}

function unknownnessScore(destination, desired) {
  return Math.max(0, Math.round(100 - Math.abs((100 - destination.recognition) - desired) * 1.25));
}

function tripLengthScore(destination, nights) {
  const preferred = destination.nights.startsWith("3") ? 4 : destination.nights.startsWith("10") ? 12 : 7;
  return Math.max(20, Math.round(100 - Math.abs(preferred - nights) * 9));
}

function effectiveCost(destination) {
  const fit = (destination.preferenceMatchScore * 0.6 + destination.travelTimeFeasibilityScore * 0.4) / 100;
  return destination.budgetPlan.budgetCheckTotal * (1.1 - 0.3 * fit);
}

// Scores and budgets one destination for a traveler, with no filtering. Used for
// ranking, and directly when a link names the destination.
export function planDestination(destination, profile) {
  const budgetPlan = buildBudgetPlan(profile, destination);
  const travelFeasibility = assessTravelFeasibility(profile, destination);
  const preferenceMatchScore = preferenceScore(destination, profile.otherExistingQuizPreferences);
  const budgetFeasibilityScore = budgetPlan.budgetFeasibilityScore;
  const unknownnessMatchScore = unknownnessScore(destination, profile.unknownness);
  const tripLengthFitScore = tripLengthScore(destination, profile.tripLength);
  const seasonMatchScore = budgetPlan.season.level === "peak" && budgetFeasibilityScore < 70 ? 45 : budgetPlan.season.level === "low" ? 90 : 80;
  const rawDestinationMatchScore = Math.round(
    travelFeasibility.score * 0.3 + budgetFeasibilityScore * 0.23 + preferenceMatchScore * 0.18 + unknownnessMatchScore * 0.2 + seasonMatchScore * 0.05 + tripLengthFitScore * 0.04,
  );
  const destinationMatchScore = travelFeasibility.status === "unreasonable" ? Math.min(24, travelFeasibility.score) : destination.catalogStatus === "verified_destination_only" ? Math.min(28, rawDestinationMatchScore) : rawDestinationMatchScore;
  return { ...destination, destinationMatchScore, rawDestinationMatchScore, travelTimeFeasibilityScore: travelFeasibility.score, travelFeasibility, preferenceMatchScore, budgetFeasibilityScore, budgetCompatibility: budgetPlan.budgetCompatibility, unknownnessMatchScore, seasonMatchScore, tripLengthFitScore, budgetPlan };
}

export function rankDestinations(destinations, profile) {
  const home = String(profile.origin || "").toUpperCase();
  // Never recommend the traveler's own city.
  return destinations.filter((destination) => destinationMatchesTravelArea(destination, profile) && !(home && String(destination.airport || "").toUpperCase() === home)).map((destination) => planDestination(destination, profile)).filter((destination) => destination.budgetPlan.withinHardBudget).sort((a, b) => {
    const bands = { excellent: 0, acceptable: 1, unknown: 1, poor: 2 };
    const aBand = a.travelFeasibility.status === "unreasonable" ? 3 : bands[a.budgetCompatibility] ?? 2;
    const bBand = b.travelFeasibility.status === "unreasonable" ? 3 : bands[b.budgetCompatibility] ?? 2;
    // Budget-first: the cheapest trip from the traveler's own airport wins. A strong
    // taste match can make a place up to 20% "cheaper" when comparing; a weak one, up to 10% dearer.
    return aBand - bBand || effectiveCost(a) - effectiveCost(b) || b.destinationMatchScore - a.destinationMatchScore || a.name.localeCompare(b.name);
  });
}

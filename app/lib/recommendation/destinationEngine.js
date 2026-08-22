import { buildBudgetPlan } from "./budgetEngine.js";
import { assessTravelFeasibility } from "./travelFeasibility.js";
import { destinationMatchesTravelArea } from "./travelArea.js";

const ANSWER_WEIGHTS = { alive: 16, duration: 8, luxury: 10, hotel: 9, escape: 8, self: 5 };

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

export function rankDestinations(destinations, profile) {
  return destinations.filter((destination) => destinationMatchesTravelArea(destination, profile)).map((destination) => {
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
    const destinationMatchScore = travelFeasibility.status === "unreasonable" ? Math.min(24, travelFeasibility.score) : destination.catalogStatus === "verified_destination_only" ? Math.min(28, rawDestinationMatchScore) : !budgetPlan.withinHardBudget ? Math.min(34, rawDestinationMatchScore) : rawDestinationMatchScore;
    return { ...destination, destinationMatchScore, rawDestinationMatchScore, travelTimeFeasibilityScore: travelFeasibility.score, travelFeasibility, preferenceMatchScore, budgetFeasibilityScore, budgetCompatibility: budgetPlan.budgetCompatibility, unknownnessMatchScore, seasonMatchScore, tripLengthFitScore, budgetPlan };
  }).sort((a, b) => {
    const bands = { excellent: 0, acceptable: 1, unknown: 1, poor: 2 };
    const aBand = a.travelFeasibility.status === "unreasonable" ? 3 : bands[a.budgetCompatibility] ?? 2;
    const bBand = b.travelFeasibility.status === "unreasonable" ? 3 : bands[b.budgetCompatibility] ?? 2;
    return aBand - bBand || b.destinationMatchScore - a.destinationMatchScore || b.rawDestinationMatchScore - a.rawDestinationMatchScore || a.name.localeCompare(b.name);
  });
}

import { buildBudgetPlan } from "./budgetEngine.js";
import { assessTravelFeasibility } from "./travelFeasibility.js";
import { destinationMatchesTravelArea } from "./travelArea.js";
import { MATCH_ALGORITHM_VERSION, destinationReadiness, matchesSetting, seasonSuitable, tripLengthRange, validateMatch } from "./eligibility.js";

export { MATCH_ALGORITHM_VERSION, validateMatch };

// Matching, in two stages:
//
// 1. Hard filters. A destination is a candidate only if it is complete (see
//    eligibility.js), carries the chosen setting, sits in the chosen travel area,
//    supports the trip length, suits the travel month, isn't the traveler's own
//    city, and its estimate fits the budget.
// 2. Soft score (0–100) over the survivors: interest, familiarity, budget
//    comfort, travel time, pace, lodging style and season. Highest score wins;
//    ties go to the lower estimate, then the destination id, so identical inputs
//    always give the identical result for the same data version.

export const SOFT_WEIGHTS = Object.freeze({ interest: 30, familiarity: 20, budget: 20, travel: 15, pace: 8, lodging: 4, season: 3 });

function interestScore(destination, answers) {
  const interest = answers?.luxury;
  if (!interest) return 60;
  return destination.tags.includes(interest) ? 100 : 15;
}

function paceScore(destination, answers) {
  const pace = answers?.escape;
  if (!pace || pace === "Surprise me") return 60;
  return destination.tags.includes(pace) ? 100 : 45;
}

function lodgingScore(destination, profile) {
  if (profile.lodging === "hostel") return destination.budgetEditorial?.planning?.hotelNight <= 70 || destination.planningAverages?.costLevel === "value" ? 100 : 55;
  return 70;
}

function unknownnessScore(destination, desired) {
  return Math.max(0, Math.round(100 - Math.abs((100 - destination.recognition) - desired) * 1.25));
}

function tripLengthScore(destination, nights) {
  const { min, max } = tripLengthRange(destination);
  const middle = (min + max) / 2;
  return Math.max(20, Math.round(100 - Math.abs(middle - nights) * 6));
}

// Scores and budgets one destination for a traveler, with no filtering. Used for
// ranking, and directly when a link names the destination.
export function planDestination(destination, profile) {
  const answers = profile.otherExistingQuizPreferences || {};
  const budgetPlan = buildBudgetPlan(profile, destination);
  const travelFeasibility = assessTravelFeasibility(profile, destination);
  const components = {
    interest: interestScore(destination, answers),
    familiarity: unknownnessScore(destination, profile.unknownness),
    budget: budgetPlan.budgetFeasibilityScore,
    travel: travelFeasibility.score,
    pace: paceScore(destination, answers),
    lodging: lodgingScore(destination, profile),
    season: seasonSuitable(destination, profile) ? (budgetPlan.season?.level === "low" ? 100 : 80) : 0,
  };
  const total = Object.values(SOFT_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  const softScore = Math.round(Object.entries(SOFT_WEIGHTS).reduce((sum, [key, weight]) => sum + (components[key] ?? 0) * weight, 0) / total);
  const destinationMatchScore = travelFeasibility.status === "unreasonable" ? Math.min(24, softScore) : softScore;
  return {
    ...destination,
    destinationMatchScore,
    scoreComponents: components,
    travelTimeFeasibilityScore: travelFeasibility.score,
    travelFeasibility,
    preferenceMatchScore: components.interest,
    budgetFeasibilityScore: budgetPlan.budgetFeasibilityScore,
    budgetCompatibility: budgetPlan.budgetCompatibility,
    unknownnessMatchScore: components.familiarity,
    tripLengthFitScore: tripLengthScore(destination, profile.tripLength),
    budgetPlan,
    algorithmVersion: MATCH_ALGORITHM_VERSION,
  };
}

// Every hard filter except the budget, with the first one a destination fails.
export function hardFilterFailure(destination, profile) {
  const answers = profile.otherExistingQuizPreferences || {};
  const home = String(profile.origin || "").toUpperCase();
  if (!destinationReadiness(destination).eligible) return "incomplete";
  if (!matchesSetting(destination, answers)) return "setting";
  if (!destinationMatchesTravelArea(destination, profile)) return "area";
  if (home && String(destination.airport || "").toUpperCase() === home) return "home";
  const { min, max } = tripLengthRange(destination);
  if (profile.tripLength < min || profile.tripLength > max) return "trip_length";
  if (!seasonSuitable(destination, profile)) return "season";
  return null;
}

export function compareMatches(a, b) {
  const unreasonable = (item) => (item.travelFeasibility.status === "unreasonable" ? 1 : 0);
  return unreasonable(a) - unreasonable(b)
    || b.destinationMatchScore - a.destinationMatchScore
    || a.budgetPlan.budgetCheckTotal - b.budgetPlan.budgetCheckTotal
    || String(a.id).localeCompare(String(b.id));
}

// "Absolute cheapest" travelers asked for the lowest price first: price against
// the cheapest candidate replaces budget comfort and carries the most weight.
export const CHEAPEST_WEIGHTS = Object.freeze({ ...SOFT_WEIGHTS, budget: 0, price: 45 });

function rescoreForPrice(planned) {
  const lowest = Math.min(...planned.map((item) => item.budgetPlan.budgetCheckTotal).filter((total) => total > 0));
  const total = Object.values(CHEAPEST_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  return planned.map((item) => {
    const components = { ...item.scoreComponents, price: Number.isFinite(lowest) && item.budgetPlan.budgetCheckTotal > 0 ? Math.round((100 * lowest) / item.budgetPlan.budgetCheckTotal) : 0 };
    const softScore = Math.round(Object.entries(CHEAPEST_WEIGHTS).reduce((sum, [key, weight]) => sum + (components[key] ?? 0) * weight, 0) / total);
    return { ...item, scoreComponents: components, destinationMatchScore: item.travelFeasibility.status === "unreasonable" ? Math.min(24, softScore) : softScore };
  });
}

// Candidates that pass every hard filter but the budget, scored and sorted.
export function settingCandidates(destinations, profile) {
  const planned = destinations.filter((destination) => !hardFilterFailure(destination, profile)).map((destination) => planDestination(destination, profile));
  return (profile.spendStyle === "cheapest" && planned.length ? rescoreForPrice(planned) : planned).sort(compareMatches);
}

export function rankDestinations(destinations, profile) {
  return settingCandidates(destinations, profile).filter((destination) => destination.budgetPlan.withinHardBudget);
}

// The best destination that matches everything except the budget, for "Show the
// closest match anyway". Closest means the smallest overage.
export function closestOverBudget(destinations, profile) {
  return settingCandidates(destinations, profile).filter((destination) => !destination.budgetPlan.withinHardBudget)
    .sort((a, b) => a.budgetPlan.budgetCheckTotal - b.budgetPlan.budgetCheckTotal || compareMatches(a, b))[0] || null;
}

// What the matcher considered, for saving with the result and debugging it.
export function matchExplanation(ranked) {
  const [winner, ...rest] = ranked;
  if (!winner) return null;
  return {
    algorithmVersion: MATCH_ALGORITHM_VERSION,
    winner: { id: winner.id, score: winner.destinationMatchScore, components: winner.scoreComponents, total: winner.budgetPlan.budgetCheckTotal },
    runnersUp: rest.slice(0, 4).map((item) => ({ id: item.id, score: item.destinationMatchScore, components: item.scoreComponents, total: item.budgetPlan.budgetCheckTotal })),
    reason: rest[0]
      ? rest[0].destinationMatchScore === winner.destinationMatchScore
        ? "Tied on match score; the lower estimate (then the id) breaks the tie."
        : `Higher match score (${winner.destinationMatchScore} vs ${rest[0].destinationMatchScore}).`
      : "Only destination that passed every filter.",
  };
}

import { buildBudgetPlan } from "./budgetEngine.js";
import { assessTravelFeasibility } from "./travelFeasibility.js";
import { destinationMatchesTravelArea } from "./travelArea.js";
import { MATCH_ALGORITHM_VERSION, MIN_ACTIVITIES, MIN_STAYS, activityCount, destinationReadiness, matchesSetting, seasonSuitable, stayCount, tripLengthRange, validateMatch } from "./eligibility.js";
import feedStayCounts from "../../data/feedStayCounts.json" with { type: "json" };

export { MATCH_ALGORITHM_VERSION, validateMatch };

// Matching, in two stages:
//
// 1. Hard filters. A destination is a candidate only if it is complete (see
//    eligibility.js), carries the chosen setting, sits in the chosen travel area,
//    supports the trip length, suits the travel month, isn't the traveler's own
//    city, and its estimate fits the budget.
// 2. Soft score (0–100) over the survivors, from every answer: interest, pace,
//    familiarity, how well the trip uses the budget, travel time, lodging style
//    (from the stays actually listed there), group, the extras asked for, and
//    season. Each is graded, not all-or-nothing: related catalog tags earn part
//    of the credit (a "Food" traveler gets some for "Wine").
//
// Places that score within a few points of each other are equally good fits, so
// their order comes from a hash of the traveler's answers: different travelers
// see different places, the same answers always see the same one.

export const SOFT_WEIGHTS = Object.freeze({ interest: 26, familiarity: 15, budget: 18, travel: 14, pace: 10, lodging: 6, group: 4, extras: 4, season: 3 });

// Catalog tags that count toward each quiz answer, with how much (1 = the tag itself).
const INTEREST_FAMILY = Object.freeze({
  Food: { Food: 1, Wine: 0.75, Culture: 0.35, Cities: 0.35, City: 0.35 },
  Nature: { Nature: 1, Wild: 0.85, Hiking: 0.85, Wildlife: 0.8, Mountains: 0.75, Lakes: 0.7, Stargazing: 0.6, Desert: 0.55, Coast: 0.45, Beaches: 0.4, Diving: 0.5 },
  Culture: { Culture: 1, History: 0.9, Architecture: 0.85, Art: 0.85, Museums: 0.85, Music: 0.6, Design: 0.55 },
  Nightlife: { Nightlife: 1, Music: 0.75, Entertainment: 0.7, Cities: 0.5, City: 0.5, Beaches: 0.3 },
  Wellness: { Wellness: 1, Relaxation: 0.85, "Beach resort": 0.7, Beaches: 0.5, Lakes: 0.45, Nature: 0.35, Gardens: 0.4 },
  Shopping: { Shopping: 1, Design: 0.65, Cities: 0.6, City: 0.6, Art: 0.35 },
});
const PACE_FAMILY = Object.freeze({
  "Slow mornings": { "Slow mornings": 1, Relaxation: 0.8, Wellness: 0.65, Lakes: 0.55, Coast: 0.5, Wine: 0.5, Gardens: 0.5 },
  "Mostly relaxing": { "Mostly relaxing": 1, Relaxation: 0.9, "Beach resort": 0.85, Beaches: 0.8, Wellness: 0.75, Diving: 0.4 },
  "Balanced days": { "Balanced days": 1, Culture: 0.6, Food: 0.6, Nature: 0.6, Coast: 0.55, Cities: 0.55 },
  "Packed schedule": { "Packed schedule": 1, Cities: 0.8, City: 0.8, Museums: 0.8, Architecture: 0.65, Nightlife: 0.65, History: 0.6 },
  "Adventure days": { "Adventure days": 1, Adventure: 0.95, Hiking: 0.9, Diving: 0.8, Wild: 0.75, Wildlife: 0.7, Mountains: 0.7, Desert: 0.6 },
});

// 20 with nothing related, up to 100 for the tag itself; 60 when there's no answer.
function familyScore(destination, family) {
  if (!family) return 60;
  const best = Math.max(0, ...(destination.tags || []).map((tag) => family[tag] || 0));
  return Math.round(20 + 80 * best);
}

function interestScore(destination, answers) {
  return familyScore(destination, INTEREST_FAMILY[answers?.luxury]);
}

function paceScore(destination, answers) {
  const pace = answers?.escape;
  if (!pace || pace === "Surprise me") return 60;
  return familyScore(destination, PACE_FAMILY[pace]);
}

const countOf = (kind, id) => Number(feedStayCounts[kind]?.[id]) || 0;

// From the stays actually listed there: houses for a whole place, five-star and
// villas for luxury, dorms for a hostel bed.
function lodgingScore(destination, profile) {
  const id = destination.id;
  if (profile.lodging === "hostel") return countOf("dorms", id) >= 2 ? 100 : destination.planningAverages?.costLevel === "value" ? 75 : 45;
  if (profile.lodging === "home") return countOf("homes", id) >= 4 ? 100 : countOf("homes", id) ? 65 : 30;
  if (profile.lodging === "luxury") return countOf("luxury", id) >= 3 ? 100 : countOf("luxury", id) || destination.supportsPremium ? 65 : 30;
  if (profile.lodging === "private") return countOf("budget", id) >= 3 ? 90 : 70;
  return 70;
}

// How well the trip uses the money. Under budget is never penalized below 55,
// but a $5,000 budget shouldn't keep landing on a $1,200 trip: the score peaks
// when the estimate uses 55-95% of the budget. "Absolute cheapest" travelers are
// rescored on price instead (see rescoreForPrice).
function budgetUseScore(budgetPlan, profile) {
  const feasibility = budgetPlan.budgetFeasibilityScore;
  const budget = Number(profile.exactBudget) || 0;
  const total = Number(budgetPlan.budgetCheckTotal) || 0;
  if (!(budget > 0) || !(total > 0) || profile.budgetMode === "closest" || total > budget) return feasibility;
  const share = total / budget;
  if (share >= 0.55) return share <= 0.95 ? 100 : 92;
  return Math.round(55 + (45 * share) / 0.55);
}

// Group fit from the catalog's who-it-suits tags.
function groupScore(destination, profile) {
  const tags = destination.tags || [];
  const travelers = Number(profile.travelers) || 1;
  const wanted = travelers === 1 ? ["Solo"] : travelers === 2 ? ["Couple", "Romance", "Honeymoon"] : ["Friends", "Family"];
  return wanted.some((tag) => tags.includes(tag)) ? 100 : 60;
}

// The extras a traveler asked for in the quiz (rental car, luxury experiences, ...).
const EXTRA_FIT = Object.freeze({
  car: { "Road Trips": 1, Nature: 0.7, Wild: 0.75, Mountains: 0.7, Lakes: 0.6, Coast: 0.55, Wine: 0.55 },
  luxury: { Luxury: 1, Premium: 0.9, "Private villa": 0.9, "Beach resort": 0.85, Honeymoon: 0.8, Wine: 0.5 },
  food: { Food: 1, Wine: 0.75 },
  driver: { Luxury: 0.8, Premium: 0.8, Desert: 0.5, Mountains: 0.4 },
});
function extrasScore(destination, profile) {
  const wanted = (profile.extras || []).filter((id) => EXTRA_FIT[id] || id === "tours");
  if (!wanted.length) return 60;
  const parts = wanted.map((id) => (id === "tours" ? Math.min(100, 40 + activityCount(destination.id) * 6) : familyScore(destination, EXTRA_FIT[id])));
  return Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length);
}

// A stable 0..1 number from the traveler's answers and a destination id.
function stableHash(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967296;
}

export function profileKey(profile) {
  const answers = profile.otherExistingQuizPreferences || {};
  return JSON.stringify([answers.alive, answers.escape, answers.duration, answers.luxury, answers.hotel, profile.exactBudget, profile.unknownness, profile.origin, profile.travelers, profile.dates?.start, profile.dates?.season, (profile.extras || []).join(",")]);
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
    budget: budgetUseScore(budgetPlan, profile),
    travel: travelFeasibility.score,
    pace: paceScore(destination, answers),
    lodging: lodgingScore(destination, profile),
    group: groupScore(destination, profile),
    extras: extrasScore(destination, profile),
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

// Places with checked stays, enough activities and local costs come before
// places that only have a Booking.com search, few activities or a planning
// average; those still win when nothing fuller matches.
export function thinData(item) {
  return stayCount(item.id) < MIN_STAYS || activityCount(item.id) < MIN_ACTIVITIES || !["city", "us_lodging_rate", "local_prices", "price_band"].includes(item.planningAverages?.model) ? 1 : 0;
}

export function compareMatches(a, b) {
  const unreasonable = (item) => (item.travelFeasibility.status === "unreasonable" ? 1 : 0);
  return unreasonable(a) - unreasonable(b)
    || thinData(a) - thinData(b)
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

// Scores within the same 6-point band are equally good fits: order them by a
// hash of the answers, so each traveler gets their own pick among equals.
export const SCORE_BAND = 6;
export function compareForProfile(profile) {
  const key = profileKey(profile);
  // The stated interest is the strongest preference: a place with it beats one
  // that is only related to it.
  const interest = profile.otherExistingQuizPreferences?.luxury;
  const exact = (item) => (interest && item.tags?.includes(interest) ? 1 : 0);
  return (a, b) => {
    const unreasonable = (item) => (item.travelFeasibility.status === "unreasonable" ? 1 : 0);
    return unreasonable(a) - unreasonable(b)
      || thinData(a) - thinData(b)
      || exact(b) - exact(a)
      || Math.floor(b.destinationMatchScore / SCORE_BAND) - Math.floor(a.destinationMatchScore / SCORE_BAND)
      || stableHash(`${key}|${a.id}`) - stableHash(`${key}|${b.id}`)
      || compareMatches(a, b);
  };
}

// Candidates that pass every hard filter but the budget, scored and sorted.
export function settingCandidates(destinations, profile) {
  const planned = destinations.filter((destination) => !hardFilterFailure(destination, profile)).map((destination) => planDestination(destination, profile));
  // "Absolute cheapest" keeps strict price order among equal scores.
  if (profile.spendStyle === "cheapest" && planned.length) return rescoreForPrice(planned).sort(compareMatches);
  return planned.sort(compareForProfile(profile));
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

import { buildBudgetPlan } from "./budgetEngine.js";
import { rankDestinations } from "./destinationEngine.js";
import { normalizeTravelerProfile } from "./travelerProfile.js";
import { destinationMatchesTravelArea } from "./travelArea.js";

// When no trip fits, say exactly why and offer fixes that are proven to work:
// every suggestion is re-run through the real matcher before it is shown.

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const NIGHTS_TO_DURATION = [[3, "Long Weekend"], [5, "Five Nights"], [7, "One Week"], [10, "Ten Days"], [14, "Two Weeks"]];

// Apply an edit to the stored quiz object (the shape /thinking and /results read).
export function applyQuizPatch(quiz, patch = {}) {
  const next = { ...quiz, answers: { ...(quiz.answers || {}) }, includedBudgetCategories: { ...(quiz.includedBudgetCategories || quiz.answers?.includedBudgetCategories || {}) } };
  if (patch.budget != null) { next.exactBudget = patch.budget; next.answers.exactBudget = patch.budget; }
  if (patch.travelers != null) next.guestCount = String(patch.travelers);
  if (patch.spendStyle) next.answers.spendStyle = patch.spendStyle;
  if (patch.area) next.travelAreaPreference = patch.area;
  if (patch.flights != null) {
    next.includedBudgetCategories.flights = patch.flights;
    next.budgetIncludesFlights = patch.flights;
  }
  next.answers.includedBudgetCategories = next.includedBudgetCategories;
  if (patch.nights != null) {
    if (!next.isFlexible && next.tripStart) next.tripEnd = addDays(next.tripStart, patch.nights);
    else next.answers.duration = (NIGHTS_TO_DURATION.find(([nights]) => nights >= patch.nights) || NIGHTS_TO_DURATION[NIGHTS_TO_DURATION.length - 1])[1];
    next.tripNights = patch.nights;
  }
  next.createdAt = Date.now();
  return next;
}

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&-])\S/g, (letter) => letter.toUpperCase());
}

function cheapestFor(destinations, profile, { ignoreArea = false } = {}) {
  let best = null;
  const home = String(profile.origin || "").toUpperCase();
  for (const destination of destinations) {
    if (home && String(destination.airport || "").toUpperCase() === home) continue;
    if (!ignoreArea && !destinationMatchesTravelArea(destination, profile)) continue;
    const plan = buildBudgetPlan(profile, destination);
    if (!best || plan.budgetCheckTotal < best.total) best = { destination, total: plan.budgetCheckTotal, plan };
  }
  return best;
}

function firstMatch(destinations, quiz, patch) {
  const patched = applyQuizPatch(quiz, patch);
  const match = rankDestinations(destinations, normalizeTravelerProfile(patched))[0];
  return match ? { quiz: patched, match } : null;
}

export function diagnoseNoMatch(destinations, quiz) {
  const profile = normalizeTravelerProfile(quiz || {});
  const budget = profile.exactBudget || 0;
  const includes = profile.includedBudgetCategories;
  const nights = profile.tripLength;
  const travelers = profile.travelers;
  const reasons = [];
  const suggestions = [];

  if (!profile.origin) reasons.push({ id: "origin", text: "We don't know which airport you're leaving from, so flights can't be priced." });

  const inArea = cheapestFor(destinations, profile);
  const anywhere = cheapestFor(destinations, profile, { ignoreArea: true });
  const covered = Object.entries(includes).filter(([, on]) => on).map(([key]) => ({ flights: "flights", hotel: "lodging", food: "food", activities: "activities", transportation: "local transport" })[key]).filter(Boolean);
  const party = `${travelers} traveler${travelers === 1 ? "" : "s"}`;

  if (inArea && budget && inArea.total > budget) {
    reasons.push({ id: "budget", text: `Your ${money(budget)} budget covers ${covered.join(", ")} for ${party} and ${nights} night${nights === 1 ? "" : "s"}. The cheapest trip that fits your other answers is ${title(inArea.destination.city)} at about ${money(inArea.total)}, which is ${money(inArea.total - budget)} over.` });
  }
  if (profile.travelAreaPreference !== "anywhere" && anywhere && (!inArea || anywhere.total < inArea.total) && anywhere.total <= budget) {
    reasons.push({ id: "area", text: `Trips fit your budget, but not ${profile.travelAreaPreference === "domestic" ? "inside your country" : "outside your country"}. ${title(anywhere.destination.city)} comes in at about ${money(anywhere.total)}.` });
  }
  if (!reasons.length) reasons.push({ id: "other", text: "None of our destinations fit every answer at once. One of the changes below will." });

  const tries = [
    !["cheapest", "auto"].includes(profile.spendStyle) && { id: "cheapest", label: "Switch to absolute cheapest", patch: { spendStyle: "cheapest" } },
    ...[nights - 1, nights - 2, 3, 2].filter((value, index, list) => value >= 2 && value < nights && list.indexOf(value) === index).map((value) => ({ id: `nights-${value}`, label: `Make it ${value} nights`, patch: { nights: value } })),
    profile.travelAreaPreference !== "anywhere" && { id: "area", label: "Go anywhere", patch: { area: "anywhere" } },
    includes.flights && { id: "flights", label: "Leave flights out of the budget", patch: { flights: false } },
    !["cheapest", "auto"].includes(profile.spendStyle) && nights > 3 && { id: "cheapest-3", label: "Absolute cheapest, 3 nights", patch: { spendStyle: "cheapest", nights: 3 } },
    !["cheapest", "auto"].includes(profile.spendStyle) && includes.flights && { id: "cheapest-noflights", label: "Absolute cheapest, flights paid separately", patch: { spendStyle: "cheapest", flights: false } },
    inArea && budget && inArea.total > budget && { id: "budget", label: `Raise the budget to ${money(Math.ceil(inArea.total / 25) * 25)}`, patch: { budget: Math.ceil(inArea.total / 25) * 25 } },
  ].filter(Boolean);

  const seenNights = new Set();
  for (const attempt of tries) {
    if (attempt.patch.nights && !attempt.patch.spendStyle) {
      if ([...seenNights].some((value) => value > attempt.patch.nights)) continue; // keep only the longest trip that works
    }
    const result = firstMatch(destinations, quiz, attempt.patch);
    if (!result) continue;
    if (attempt.patch.nights && !attempt.patch.spendStyle) seenNights.add(attempt.patch.nights);
    const total = result.match.budgetPlan?.budgetCheckTotal;
    suggestions.push({ ...attempt, quiz: result.quiz, result: `${title(result.match.city)} at about ${money(total)}` });
    if (suggestions.length >= 4) break;
  }

  return { profile, reasons, suggestions, cheapest: inArea ? { city: title(inArea.destination.city), total: inArea.total } : null };
}

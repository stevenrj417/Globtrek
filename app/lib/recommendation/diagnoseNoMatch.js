import { closestOverBudget, rankDestinations } from "./destinationEngine.js";
import { normalizeTravelerProfile } from "./travelerProfile.js";
import { structuredOrigin } from "./travelArea.js";

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
  if (patch.interest) next.answers.luxury = patch.interest;
  if (patch.setting) next.answers.alive = patch.setting;
  if (patch.lodging) next.answers.hotel = patch.lodging;
  if (patch.origin) {
    const origin = structuredOrigin(patch.origin);
    if (origin) { next.originAirport = origin.airportCode; next.originDetails = origin; }
  }
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

function firstMatch(destinations, quiz, patch) {
  const patched = applyQuizPatch(quiz, patch);
  const match = rankDestinations(destinations, normalizeTravelerProfile(patched))[0];
  return match ? { quiz: patched, match } : null;
}

const SETTING_NAMES = { Ocean: "coastal", Mountains: "mountain", Cities: "city", Culture: "history and culture" };

// The five ways out of "no match", each re-run through the real matcher so a
// button only promises a trip it can deliver.
export function diagnoseNoMatch(destinations, quiz) {
  const profile = normalizeTravelerProfile(quiz || {});
  const budget = profile.exactBudget || 0;
  const includes = profile.includedBudgetCategories;
  const nights = profile.tripLength;
  const travelers = profile.travelers;
  const answers = profile.otherExistingQuizPreferences || {};
  const closest = closestOverBudget(destinations, profile);
  const reasons = [];

  if (!profile.origin) reasons.push({ id: "origin", text: "We don't know which airport you're leaving from, so flights can't be priced." });
  const covered = Object.entries(includes).filter(([, on]) => on).map(([key]) => ({ flights: "flights", hotel: "lodging", food: "food", activities: "activities", transportation: "local transport" })[key]).filter(Boolean);
  const party = `${travelers} traveler${travelers === 1 ? "" : "s"}`;
  const kind = SETTING_NAMES[answers.alive] ? `${SETTING_NAMES[answers.alive]} ` : "";
  if (closest && budget) {
    reasons.push({ id: "budget", text: `Your ${money(budget)} budget covers ${covered.join(", ")} for ${party} and ${nights} night${nights === 1 ? "" : "s"}. The closest ${kind}trip that fits your other answers is ${title(closest.city)} at about ${money(closest.budgetPlan.budgetCheckTotal)}, ${money(closest.budgetPlan.budgetCheckTotal - budget)} over.` });
  }
  if (!closest) reasons.push({ id: "other", text: `No ${kind}destination we have complete information for fits your trip length, travel area and travel month together. Try a different setting or a different time of year.` });

  const shorter = [nights - 1, nights - 2, 5, 4, 3, 2].filter((value, index, list) => value >= 2 && value < nights && list.indexOf(value) === index);
  const lodgingChoices = ["Hostel bed", "Whatever's cheapest"].filter((value) => value !== answers.hotel);
  const attempt = (id, label, patches) => {
    for (const patch of patches) {
      const result = firstMatch(destinations, quiz, patch);
      if (result) return { id, label: typeof label === "function" ? label(patch) : label, patch, quiz: result.quiz, available: true, result: `${title(result.match.city)} at about ${money(result.match.budgetPlan.budgetCheckTotal)}` };
    }
    return { id, label: typeof label === "function" ? label(patches[0] || {}) : label, available: false, result: "Still no match" };
  };
  const raised = closest ? Math.ceil(closest.budgetPlan.budgetCheckTotal / 25) * 25 : null;
  const options = [
    raised ? attempt("budget", `Increase my budget to ${money(raised)}`, [{ budget: raised }]) : { id: "budget", label: "Increase my budget", available: false, result: "No trip fits your other answers at any budget" },
    includes.flights ? attempt("flights", "Remove flights from my budget", [{ flights: false }]) : { id: "flights", label: "Remove flights from my budget", available: false, result: "Flights are already outside your budget" },
    shorter.length ? attempt("shorter", (patch) => `Shorten my trip to ${patch.nights} nights`, shorter.map((value) => ({ nights: value }))) : { id: "shorter", label: "Shorten my trip", available: false, result: "Already the shortest trip" },
    lodgingChoices.length ? attempt("lodging", (patch) => `Change accommodation to ${patch.lodging === "Hostel bed" ? "a hostel bed" : "whatever's cheapest"}`, lodgingChoices.map((value) => ({ lodging: value, spendStyle: "cheapest" }))) : { id: "lodging", label: "Change accommodation type", available: false, result: "Already the cheapest accommodation" },
    closest ? { id: "closest", label: "Show the closest match anyway", available: true, href: `/results?destination=${encodeURIComponent(closest.id || closest.airport)}`, result: `${title(closest.city)}, over budget by about ${money(closest.budgetPlan.budgetCheckTotal - budget)}` } : { id: "closest", label: "Show the closest match anyway", available: false, result: "No destination fits your other answers" },
  ];

  return { profile, reasons, options, suggestions: options.filter((option) => option.available && option.quiz), closest: closest ? { id: closest.id || closest.airport, city: title(closest.city), total: closest.budgetPlan.budgetCheckTotal } : null, cheapest: closest ? { city: title(closest.city), total: closest.budgetPlan.budgetCheckTotal } : null };
}

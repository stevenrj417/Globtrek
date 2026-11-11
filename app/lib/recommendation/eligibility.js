import { LAUNCH_SET, LAUNCH_DATA, launchActivities } from "../../data/launchSet.js";
import feedStays from "../../data/feedStays.json" with { type: "json" };
import curatedPlaces from "../../data/curatedPlaces.json" with { type: "json" };
import { travelInfoFor } from "../../data/travelInfo.js";

// Which destinations the quiz may recommend, and why the rest can't be.
//
// A destination enters quiz results only when every check below passes. The
// checks read structured catalog data only; nothing an AI writes can make a
// destination eligible or change its setting.

export const MATCH_ALGORITHM_VERSION = "2026-11-11.1";

// Quiz setting answer -> the catalog tag a destination must carry.
export const SETTING_REQUIREMENTS = Object.freeze({
  Ocean: { tag: "Ocean", label: "Coastal setting" },
  Mountains: { tag: "Mountains", label: "Mountain setting" },
  Cities: { tag: "Cities", label: "City setting" },
  Culture: { tag: "Culture", label: "History & culture" },
});

export const INTEREST_TAGS = ["Food", "Nature", "Culture", "Nightlife", "Wellness", "Shopping"];
const SETTING_TAGS = Object.values(SETTING_REQUIREMENTS).map((item) => item.tag);
export const MIN_STAYS = 3;
export const MIN_ACTIVITIES = 4;

export function curatedActivities(destinationId) {
  return curatedPlaces.places?.[destinationId]?.activities || [];
}

export function curatedRestaurants(destinationId) {
  return curatedPlaces.places?.[destinationId]?.restaurants || [];
}

export function activityCount(destinationId) {
  return launchActivities(destinationId).length || curatedActivities(destinationId).length;
}

export function stayCount(destinationId) {
  return Math.max((LAUNCH_DATA[destinationId]?.hotels || []).length, (feedStays.stays?.[destinationId] || []).length);
}

// Supported trip lengths, from the catalog's own trip-length data when present.
export function tripLengthRange(destination) {
  const fit = destination.tripLengthFit;
  if (Number.isFinite(fit?.minimumNights) && Number.isFinite(fit?.maximumNights)) return { min: fit.minimumNights, max: fit.maximumNights };
  return { min: 2, max: 14 };
}

const CHECKS = [
  ["destination and country", (d) => Boolean(d.city && d.country)],
  ["nearest airport", (d) => /^[A-Z]{3}$/.test(d.airport || "")],
  ["setting tag", (d) => SETTING_TAGS.some((tag) => d.tags?.includes(tag))],
  ["interest tag", (d) => INTEREST_TAGS.some((tag) => d.tags?.includes(tag))],
  ["knownness score", (d) => Number.isFinite(d.recognition)],
  ["trip-length range", (d) => tripLengthRange(d).max >= tripLengthRange(d).min],
  ["reviewed seasonal guidance", (d) => Boolean(d.season) && !/requires .*review/i.test(d.season)],
  ["flight estimate support", (d) => (d.latitude != null && d.longitude != null && Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude))) || LAUNCH_SET.includes(d.id)],
  [`${MIN_STAYS}+ accommodation options`, (d) => stayCount(d.id) >= MIN_STAYS],
  [`${MIN_ACTIVITIES}+ activities`, (d) => activityCount(d.id) >= MIN_ACTIVITIES],
  ["destination-specific daily costs", (d) => d.planningAverages?.model === "city"],
  ["data timestamp", (d) => Boolean(d.budgetEditorial?.reviewed || d.dataReviewed)],
  ["fact source", (d) => Boolean(d.verificationSource || d.budgetEditorial?.sources?.length || LAUNCH_SET.includes(d.id))],
  ["entry and advisory links", (d) => Boolean(travelInfoFor(d.country))],
  ["main image and alt text", (d) => Boolean(d.image && (d.imageAlt || d.budgetEditorial?.alt))],
];

export function destinationReadiness(destination) {
  const missing = CHECKS.filter(([, check]) => !check(destination)).map(([name]) => name);
  return { eligible: missing.length === 0, missing };
}

export function settingRequirement(answers = {}) {
  return SETTING_REQUIREMENTS[answers.alive] || null;
}

export function matchesSetting(destination, answers = {}) {
  const requirement = settingRequirement(answers);
  return !requirement || Boolean(destination.tags?.includes(requirement.tag));
}

export function tripMonth(profile) {
  const start = profile?.dates?.start;
  if (start) return Number(start.slice(5, 7));
  return null;
}

// A destination may list months it should not be recommended for.
export function seasonSuitable(destination, profile) {
  const month = tripMonth(profile);
  const avoid = destination.avoidMonths || [];
  if (month) return !avoid.includes(month);
  const season = profile?.dates?.season;
  const months = SEASON_MONTHS[season] || [];
  return !months.length || months.some((value) => !avoid.includes(value));
}

export const SEASON_MONTHS = Object.freeze({
  "Spring (Mar-May)": [3, 4, 5],
  "Summer (Jun-Aug)": [6, 7, 8],
  "Fall (Sep-Nov)": [9, 10, 11],
  "Winter (Dec-Feb)": [12, 1, 2],
});

// Every reason a planned destination does not satisfy the traveler's answers.
// Empty means it may be shown as their match.
export function validateMatch(destination, profile) {
  const problems = [];
  if (!destination) return ["no destination"];
  const answers = profile?.otherExistingQuizPreferences || {};
  if (!destinationReadiness(destination).eligible) problems.push("incomplete destination data");
  if (!matchesSetting(destination, answers)) problems.push(`not a ${settingRequirement(answers).label.toLowerCase()}`);
  const range = tripLengthRange(destination);
  if (profile?.tripLength && (profile.tripLength < range.min || profile.tripLength > range.max)) problems.push("trip length unsupported");
  if (!seasonSuitable(destination, profile)) problems.push("wrong season");
  if (destination.budgetPlan && destination.budgetPlan.withinHardBudget === false) problems.push("over budget");
  return problems;
}

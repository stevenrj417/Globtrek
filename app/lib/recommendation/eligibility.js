import { LAUNCH_SET, LAUNCH_DATA, launchActivities } from "../../data/launchSet.js";
// Counts only: the full catalog snapshot is too large to ship to the browser.
import feedStayCounts from "../../data/feedStayCounts.json" with { type: "json" };
// Counts only, like the stays: the curated places themselves stay on the server.
import curatedPlaceCounts from "../../data/curatedPlaceCounts.json" with { type: "json" };
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

export function activityCount(destinationId) {
  return launchActivities(destinationId).length || curatedPlaceCounts.activities?.[destinationId] || 0;
}

export function stayCount(destinationId) {
  return Math.max((LAUNCH_DATA[destinationId]?.hotels || []).length, feedStayCounts.counts?.[destinationId] || 0);
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
  ["seasonal guidance", (d) => Boolean(d.season) && !/requires .*review/i.test(d.season)],
  ["flight estimate support", (d) => (d.latitude != null && d.longitude != null && Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude))) || LAUNCH_SET.includes(d.id)],
  [`${MIN_STAYS}+ accommodation options`, (d) => stayCount(d.id) >= MIN_STAYS],
  [`${MIN_ACTIVITIES}+ activities`, (d) => activityCount(d.id) >= MIN_ACTIVITIES],
  ["destination-specific daily costs", (d) => ["city", "local_prices"].includes(d.planningAverages?.model)],
  ["data timestamp", (d) => Boolean(d.budgetEditorial?.reviewed || d.dataReviewed || d.dataCheckedAt)],
  ["fact source", (d) => Boolean(d.verificationSource || d.factSource || d.budgetEditorial?.sources?.length || LAUNCH_SET.includes(d.id))],
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

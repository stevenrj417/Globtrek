import { sentencePhrase } from "../format.js";

// One or two sentences explaining a result, built only from the traveler's own
// answers and tags the trip already carries. Only answers the trip actually
// matches are mentioned, and nothing is said about a place that isn't in its data.

const SETTING = {
  Ocean: ["the coast", ["Ocean", "Coast", "Beach", "Island"]],
  Mountains: ["the mountains", ["Mountains", "Mountain", "Hiking", "Alpine"]],
  Cities: ["city life", ["Cities", "City", "Urban"]],
  Culture: ["history and culture", ["Culture", "History", "Architecture"]],
  "Road Trips": ["road trips", ["Road Trips", "Road Trip"]],
};
const PACE = { "Slow mornings": "a relaxed pace", "Balanced days": "a balanced pace", "Packed schedule": "a full schedule", "Mostly relaxing": "downtime", "Adventure days": "active days" };
const PRIORITY = { Food: "food", Nature: "nature", Culture: "culture", Nightlife: "nightlife", Wellness: "wellness", Shopping: "shopping" };

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function list(parts) {
  if (parts.length < 2) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&-])\S/g, (letter) => letter.toUpperCase());
}

export function whyThisFits({ answers = {}, exactBudget, budgetPlan, trip }) {
  if (!trip) return "";
  const tags = new Set((trip.tags || []).map((tag) => String(tag).toLowerCase()));
  const has = (...labels) => labels.some((label) => tags.has(String(label).toLowerCase()));
  const matched = [];
  const setting = SETTING[answers.alive];
  if (setting && has(...setting[1])) matched.push(setting[0]);
  if (PACE[answers.escape] && has(answers.escape)) matched.push(PACE[answers.escape]);
  if (PRIORITY[answers.luxury] && has(answers.luxury)) matched.push(`your focus on ${PRIORITY[answers.luxury]}`);

  const city = title(trip.city);
  const typical = budgetPlan?.estimatedTripAverage;
  const budget = exactBudget > 0 && typical && budgetPlan?.withinHardBudget ? `a typical estimate of ${money(typical)} against your ${money(exactBudget)} budget` : null;
  const first = matched.length
    ? `${city} matches ${list(matched)}${budget ? `, with ${budget}` : ""}.`
    : budget ? `${city} is the closest fit to your answers, with ${budget}.` : `${city} is the closest fit to your answers.`;
  const known = trip.style && !/considered escape/i.test(trip.style)
    ? `Known for ${list(trip.style.split(" / ").map(sentencePhrase))}.`
    : "";
  return [first, known].filter(Boolean).join(" ");
}

const SETTING_LABEL = { Ocean: ["Coastal setting", "Ocean"], Mountains: ["Mountain setting", "Mountains"], Cities: ["City setting", "Cities"], Culture: ["History & culture", "Culture"] };
const PACE_LABEL = { "Slow mornings": "Relaxed pace", "Balanced days": "Balanced pace", "Packed schedule": "Packed schedule", "Mostly relaxing": "Plenty of downtime", "Adventure days": "Active days" };
const NIGHT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen"];

// The "Why this matches" list: each line restates one of the traveler's own
// answers, and appears only when the destination's structured data satisfies it.
export function matchReasons({ answers = {}, profile = {}, budgetPlan, trip, range }) {
  if (!trip) return [];
  const tags = new Set(trip.tags || []);
  const reasons = [];
  const setting = SETTING_LABEL[answers.alive];
  if (setting && tags.has(setting[1])) reasons.push(setting[0]);
  if (PRIORITY[answers.luxury] && tags.has(answers.luxury)) reasons.push(`${answers.luxury}-focused`);
  if (PACE_LABEL[answers.escape] && tags.has(answers.escape)) reasons.push(PACE_LABEL[answers.escape]);
  const nights = profile.tripLength;
  if (nights && range && nights >= range.min && nights <= range.max) reasons.push(`Fits your ${NIGHT_WORDS[nights] || nights}-night target`);
  const budget = profile.exactBudget;
  if (budget > 0 && budgetPlan?.withinHardBudget) reasons.push(`Estimated within your ${money(budget)} budget`);
  return reasons;
}

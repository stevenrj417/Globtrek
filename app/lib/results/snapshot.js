import { MATCH_ALGORITHM_VERSION } from "../recommendation/eligibility.js";

// A result's identity and its frozen estimate.
//
// The first time a set of answers produces a trip, the page records which
// destination won and what it was estimated at. Reloading the same answers shows
// that same destination (a later server ranking can't swap it), and if the
// estimate for the same inputs ever differs (new price data, a new algorithm),
// the page says so and offers "Refresh estimates" instead of silently changing.

export const CALCULATION_VERSION = "2026-11-11.1";
const STORE = "globtrekResults";
const KEEP = 20;

// Only the answers that change which trip wins or what it costs.
export function quizInputs(quiz = {}) {
  const answers = quiz.answers || {};
  return {
    answers: Object.fromEntries(["alive", "luxury", "escape", "duration", "hotel", "discovery", "season", "spendStyle", "exactBudget", "travelAreaPreference"].map((key) => [key, answers[key] ?? null])),
    exactBudget: quiz.exactBudget ?? null,
    categories: quiz.includedBudgetCategories || answers.includedBudgetCategories || null,
    origin: quiz.originDetails?.airportCode || quiz.originAirport || null,
    start: quiz.isFlexible ? null : quiz.tripStart || null,
    end: quiz.isFlexible ? null : quiz.tripEnd || null,
    nights: quiz.tripNights ?? null,
    travelers: quiz.guestCount ?? null,
    spendStyle: quiz.spendStyle ?? null,
    area: quiz.travelAreaPreference ?? null,
  };
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value ?? null);
}

// FNV-1a, 32-bit: a short, stable id for a set of inputs. Not a secret.
function hash(text) {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value.toString(16).padStart(8, "0");
}

export function quizKey(quiz) {
  return `q_${hash(stable(quizInputs(quiz)))}`;
}

export function resultId(quiz, destinationId) {
  return `r_${hash(stable({ inputs: quizInputs(quiz), destinationId, algorithm: MATCH_ALGORITHM_VERSION }))}`;
}

export function makeSnapshot({ quiz, destinationId, budgetPlan, now = new Date() }) {
  return {
    resultId: resultId(quiz, destinationId),
    quizKey: quizKey(quiz),
    destinationId,
    algorithmVersion: MATCH_ALGORITHM_VERSION,
    calculationVersion: CALCULATION_VERSION,
    generatedAt: now.toISOString(),
    inputs: quizInputs(quiz),
    estimate: snapshotEstimate(budgetPlan),
  };
}

export function snapshotEstimate(budgetPlan) {
  if (!budgetPlan) return null;
  return {
    total: Math.round(budgetPlan.budgetCheckTotal || 0),
    low: Math.round(budgetPlan.estimatedTripLow || 0),
    high: Math.round(budgetPlan.estimatedTripHigh || 0),
    categories: Object.fromEntries(Object.entries(budgetPlan.estimates || {}).map(([key, item]) => [key, Math.round(item.average || 0)])),
    flightPriceChecked: budgetPlan.estimates?.flights?.priceLastChecked || null,
    pricedMonth: budgetPlan.pricedMonth || null,
  };
}

// True when two estimates disagree by at least a dollar on the total.
export function estimateChanged(saved, current) {
  if (!saved || !current) return false;
  return Math.abs((saved.total || 0) - (current.total || 0)) >= 1;
}

function readStore(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORE) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function loadSnapshot(storage, key) {
  if (!storage || !key) return null;
  return readStore(storage)[key] || null;
}

export function saveSnapshot(storage, snapshot) {
  if (!storage || !snapshot?.quizKey) return;
  const store = readStore(storage);
  store[snapshot.quizKey] = snapshot;
  const keys = Object.keys(store).sort((a, b) => String(store[b].generatedAt).localeCompare(String(store[a].generatedAt)));
  for (const key of keys.slice(KEEP)) delete store[key];
  try { storage.setItem(STORE, JSON.stringify(store)); } catch {}
}

export function clearSnapshot(storage, key) {
  if (!storage || !key) return;
  const store = readStore(storage);
  delete store[key];
  try { storage.setItem(STORE, JSON.stringify(store)); } catch {}
}

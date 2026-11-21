// Deterministic ranking for "any place" picks. No AI and no randomness: the same
// candidates always give the same picks, in the same order. Ties break by ID.

export const PRIOR_REVIEWS = 50;
export const PRIOR_RATING = 4.2;
export const MIN_RATING = 4.0;

// Budget levels a traveler can choose. Mostly budget and mid-range; "comfort"
// reaches a 4-star hotel at most and never luxury.
export const BUDGETS = {
  budget: { label: "Budget", stayTiers: ["budget", "mid"], dinnerPrices: ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", null], activityPrices: ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", null] },
  mid: { label: "Mid-range", stayTiers: ["mid", "comfort", "budget"], dinnerPrices: ["PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", null], activityPrices: ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", null] },
  comfort: { label: "Comfort", stayTiers: ["comfort", "mid"], dinnerPrices: ["PRICE_LEVEL_MODERATE", "PRICE_LEVEL_EXPENSIVE", null], activityPrices: ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", "PRICE_LEVEL_EXPENSIVE", null] },
};
export const BUDGET_KEYS = Object.keys(BUDGETS);
export function budgetKey(value) { return BUDGETS[value] ? value : "mid"; }

// Bayesian average: a 4.9 with 8 reviews doesn't beat a 4.6 with 2,000.
export function weightedRating(rating, reviews, { prior = PRIOR_REVIEWS, mean = PRIOR_RATING } = {}) {
  const r = Number(rating);
  const v = Math.max(0, Number(reviews) || 0);
  if (!Number.isFinite(r) || r <= 0) return null;
  return (v * r + prior * mean) / (v + prior);
}

export function distanceKm(a, b) {
  const values = [a?.latitude, a?.longitude, b?.latitude, b?.longitude].map(Number);
  if (values.some((value) => !Number.isFinite(value))) return null;
  const [lat1, lon1, lat2, lon2] = values.map((value) => (value * Math.PI) / 180);
  const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// A small penalty for being far from the center: nothing within the first km,
// then 0.015 a km, capped so a great place 30 km out can still be picked.
export function distancePenalty(km) {
  if (km == null) return 0.1;
  return Math.min(0.4, Math.max(0, km - 1) * 0.015);
}

// Rounded so floating-point noise can never reorder two equal scores.
export const round = (value) => Math.round(value * 10000) / 10000;

export function byScore(a, b) {
  return b.score - a.score || String(a.id).localeCompare(String(b.id));
}

export function normalizeText(value) {
  return String(value || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// "Rua das Flores, 12" and "R. das Flores 40" are the same street.
export function streetKey(address) {
  const first = String(address || "").split(",")[0];
  return normalizeText(first).replace(/\b\d+[a-z]?\b/g, " ").replace(/\b(rua|r|avenida|av|calle|c|via|street|st|road|rd|avenue|ave|strasse|str)\b/g, " ").replace(/\s+/g, " ").trim() || null;
}

// Greedy pick with variety: walk the ranked list and skip anything that clashes
// with a place already chosen. If that leaves fewer than `count`, fill from the
// skipped ones in rank order. `clash(a, b, chosen)` says two candidates are too alike.
export function pickVaried(ranked, count, clash) {
  const chosen = [];
  const skipped = [];
  for (const item of ranked) {
    if (chosen.length >= count) break;
    if (chosen.some((other) => clash(item, other, chosen))) skipped.push(item);
    else chosen.push(item);
  }
  for (const item of skipped) {
    if (chosen.length >= count) break;
    chosen.push(item);
  }
  return chosen.sort(byScore);
}

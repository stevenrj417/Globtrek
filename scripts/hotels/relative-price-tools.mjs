const EXPLICIT_PREMIUM = /\b(luxury|luxurious|five[- ]star|5[- ]star|ultra[- ]?luxury|high[- ]end)\b/i;
const EXPLICIT_VALUE = /\b(hostel|budget|affordable|cheap|economy|low[- ]cost)\b/i;
const EXPLICIT_MIDRANGE = /\b(three[- ]star|3[- ]star|four[- ]star|4[- ]star|upscale|midscale|mid[- ]range)\b/i;

function positiveMention(value, pattern) {
  const text = String(value || "");
  const matches = text.matchAll(new RegExp(pattern.source, "gi"));
  for (const match of matches) {
    const prefix = text.slice(Math.max(0, match.index - 36), match.index);
    if (!/\b(no|not|without|lacks?|limited|neither|isn'?t|aren'?t)\b[^.!;|]{0,32}$/i.test(prefix)) return true;
  }
  return false;
}

function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.round((sorted.length - 1) * ratio)];
}

export function buildDestinationPositioningBenchmarks(records) {
  const byDestination = Map.groupBy(records.filter((item) => item.priceTier && item.priceConfidence >= 0.5), (item) => item.destinationId);
  return new Map([...byDestination].map(([destinationId, anchors]) => [destinationId, {
    destinationId,
    anchorCount: anchors.length,
    tierCounts: Object.fromEntries(["value", "midrange", "premium"].map((tier) => [tier, anchors.filter((item) => item.priceTier === tier).length])),
    luxuryP25: percentile(anchors.map((item) => item.luxuryScore), 0.25),
    luxuryP50: percentile(anchors.map((item) => item.luxuryScore), 0.5),
    luxuryP75: percentile(anchors.map((item) => item.luxuryScore), 0.75),
    valueP25: percentile(anchors.map((item) => item.valueScore), 0.25),
    valueP50: percentile(anchors.map((item) => item.valueScore), 0.5),
    valueP75: percentile(anchors.map((item) => item.valueScore), 0.75),
  }]));
}

export function deriveGroundedRelativeTier(item, benchmark = null) {
  if (item.priceTier) return { tier: item.priceTier, confidence: item.priceConfidence, basis: "existing_grounded_classification" };
  if (!item.sourceUrl || Number(item.classificationConfidence) < 0.5) return null;
  const rationale = String(item.rationale || "");
  const luxury = Number(item.luxuryScore);
  const value = Number(item.valueScore);
  const hasPremium = positiveMention(rationale, EXPLICIT_PREMIUM);
  const hasValue = positiveMention(rationale, EXPLICIT_VALUE);
  const hasMidrange = positiveMention(rationale, EXPLICIT_MIDRANGE);
  if (hasPremium && hasValue) return null;

  const enoughAnchors = Number(benchmark?.anchorCount) >= 3;
  const premiumPosition = !enoughAnchors || benchmark.luxuryP50 == null || luxury >= benchmark.luxuryP50;
  const valuePosition = !enoughAnchors || benchmark.valueP50 == null || value >= benchmark.valueP50;

  if (hasPremium && luxury >= 70 && value <= 60 && premiumPosition) {
    return { tier: "premium", confidence: Math.max(0.55, Math.min(0.85, Number(item.classificationConfidence))), basis: "explicit_official_premium_positioning" };
  }
  if (hasValue && value >= 70 && luxury <= 45 && valuePosition) {
    return { tier: "value", confidence: Math.max(0.55, Math.min(0.85, Number(item.classificationConfidence))), basis: "explicit_official_value_positioning" };
  }
  if (hasMidrange && !hasPremium && !hasValue && luxury >= 35 && luxury <= 75 && value >= 35 && value <= 75) {
    return { tier: "midrange", confidence: Math.max(0.5, Math.min(0.75, Number(item.classificationConfidence))), basis: "explicit_official_midscale_positioning" };
  }
  return null;
}

export function classificationSanity(item, price) {
  const failures = [];
  if (price?.tier === "premium" && (Number(item.luxuryScore) < 65 || Number(item.valueScore) > 70)) failures.push("premium_positioning_conflict");
  if (price?.tier === "value" && (Number(item.valueScore) < 65 || Number(item.luxuryScore) > 55)) failures.push("value_positioning_conflict");
  if (Number(item.calmScore) >= 80 && Number(item.energyScore) >= 80 && !/mixed|social|nightlife|retreat|secluded/i.test(String(item.rationale || ""))) failures.push("calm_energy_conflict");
  return failures;
}

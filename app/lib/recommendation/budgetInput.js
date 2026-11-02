// Pure quiz-input helpers with no data imports, so client bundles stay small.

export function normalizeBudget(value) {
  const numeric = typeof value === "string" ? Number(value.replace(/[$,\s]/g, "")) : Number(value);
  if (!Number.isFinite(numeric) || numeric < 100 || numeric > 1_000_000) return null;
  return Math.round(numeric);
}

export function discoverySliderToUnknownness(value) {
  const slider = Number.isFinite(Number(value)) ? Number(value) : 50;
  return 100 - Math.min(100, Math.max(0, slider));
}

export function legacyBudgetLabel(exactBudget) {
  if (exactBudget < 3000) return "Smart value";
  if (exactBudget < 6000) return "Comfortable";
  if (exactBudget < 10000) return "Premium";
  return "Blowout";
}

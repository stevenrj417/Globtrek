"use client";

// Small, factual blocks near the top of the results page.

function money(value) {
  return `$${Math.round(value || 0).toLocaleString("en-US")}`;
}

function when(iso) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

function day(value) {
  if (!value) return null;
  const date = /^\d{4}-\d{2}(-\d{2})?$/.test(value) ? new Date(`${value.length === 7 ? `${value}-01` : value}T00:00:00Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("en-US", { month: "short", day: value.length === 7 ? undefined : "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export function WhyThisMatches({ reasons }) {
  if (!reasons?.length) return null;
  return <div>
    <h2 className="text-micro uppercase tracking-label text-black/60">Why this matches</h2>
    <ul className="mt-2 flex flex-wrap gap-2">{reasons.map((reason) => <li key={reason} className="inline-flex min-h-8 items-center gap-1.5 border border-black/15 bg-white px-3 text-sm"><span aria-hidden="true">✓</span>{reason}</li>)}</ul>
  </div>;
}

// When the estimate was made, where its prices come from, and a way to redo it.
export function EstimateStatus({ snapshot, current, changed, onRefresh, refreshing }) {
  if (!snapshot) return null;
  const flightChecked = day(current?.flightPriceChecked);
  return <div className="text-xs leading-5 text-black/65" aria-live="polite">
    <p><span className="font-medium text-ink">Not a live price.</span> Estimate generated {when(snapshot.generatedAt)}{flightChecked ? ` · flight fares last checked ${flightChecked}` : ""} · result {snapshot.resultId}</p>
    {changed ? <p className="mt-1 font-medium text-ink">GlobTrek&apos;s estimate for these same answers is now {money(current.total)} (it was {money(snapshot.estimate?.total)}). Refresh to use the new estimate.</p> : null}
    <button type="button" onClick={onRefresh} disabled={refreshing} className="mt-2 inline-flex min-h-11 items-center border border-black/25 px-4 text-sm text-ink hover:border-black disabled:opacity-50">{refreshing ? "Refreshing…" : "Refresh estimates"}</button>
    <span className="ml-3">Current estimates may change.</span>
  </div>;
}

export function OverBudgetNotice({ budgetPlan }) {
  if (!budgetPlan?.targetBudget || budgetPlan.withinHardBudget) return null;
  const over = budgetPlan.budgetCheckTotal - budgetPlan.targetBudget;
  return <div role="note" className="border-l-4 border-warning bg-white px-4 py-3 text-sm leading-6">
    <strong>Over your budget by about {money(over)}.</strong> No trip that fits all your answers is estimated within {money(budgetPlan.targetBudget)}. This is the closest match; the estimate is {money(budgetPlan.budgetCheckTotal)}.
  </div>;
}

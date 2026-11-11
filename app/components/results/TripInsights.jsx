"use client";

// Small, factual blocks near the top of the results page.

function money(value) {
  return `$${Math.round(value || 0).toLocaleString("en-US")}`;
}



export function WhyThisMatches({ reasons }) {
  if (!reasons?.length) return null;
  return <div>
    <h2 className="sr-only">Why this matches</h2>
    <ul className="flex flex-wrap justify-center gap-2">{reasons.map((reason) => <li key={reason} className="inline-flex min-h-8 items-center gap-1.5 border border-black/15 bg-white px-3 text-sm"><span aria-hidden="true">✓</span>{reason}</li>)}</ul>
  </div>;
}

// Only speaks up when the estimate for these same answers has moved.
export function EstimateStatus({ snapshot, current, changed, onRefresh, refreshing }) {
  if (!snapshot || !changed) return null;
  return <div className="flex flex-wrap items-center gap-3 text-sm" aria-live="polite">
    <p>The estimate is now {money(current.total)} (was {money(snapshot.estimate?.total)}).</p>
    <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex min-h-11 items-center border border-black/25 px-4 text-sm hover:border-black disabled:opacity-50">{refreshing ? "Refreshing…" : "Update"}</button>
  </div>;
}

export function OverBudgetNotice({ budgetPlan }) {
  if (!budgetPlan?.targetBudget || budgetPlan.withinHardBudget) return null;
  const over = budgetPlan.budgetCheckTotal - budgetPlan.targetBudget;
  return <div role="note" className="border-l-4 border-warning bg-white px-4 py-3 text-sm leading-6">
    <strong>About {money(over)} over your budget.</strong> Nothing that fits all your answers comes in under {money(budgetPlan.targetBudget)}; this is the closest.
  </div>;
}

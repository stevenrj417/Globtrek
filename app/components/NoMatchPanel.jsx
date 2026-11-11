"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { destinations } from "../data/destinations";
import { applyQuizPatch, diagnoseNoMatch } from "../lib/recommendation/diagnoseNoMatch";
import { rankDestinations } from "../lib/recommendation/destinationEngine";
import { normalizeTravelerProfile } from "../lib/recommendation/travelerProfile";
import { track } from "../lib/analytics";

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&-])\S/g, (letter) => letter.toUpperCase());
}

function rerun(quiz, source) {
  try { window.localStorage.setItem("globtrekQuiz", JSON.stringify(quiz)); } catch {}
  track("no_match_fix", { source });
  window.location.assign("/thinking");
}

// Shown instead of a dead end: what's wrong, fixes that are proven to work, and an editor.
export function NoMatchPanel({ quiz }) {
  const diagnosis = useMemo(() => diagnoseNoMatch(destinations, quiz), [quiz]);
  const { profile } = diagnosis;
  const [draft, setDraft] = useState({
    budget: profile.exactBudget || 500,
    nights: profile.tripLength,
    travelers: profile.travelers,
    flights: profile.includedBudgetCategories.flights,
    spendStyle: profile.spendStyle || "auto",
    area: profile.travelAreaPreference || "anywhere",
  });
  const edited = useMemo(() => applyQuizPatch(quiz, draft), [quiz, draft]);
  const preview = useMemo(() => rankDestinations(destinations, normalizeTravelerProfile(edited))[0] || null, [edited]);
  const set = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.type === "number" ? Number(event.target.value) : event.target.value }));

  const field = "mt-2 w-full min-h-12 border border-black/20 bg-surface-raised px-3 text-base text-ink";
  return <main className="min-h-screen bg-canvas px-5 py-[var(--section-space)] text-ink sm:px-8">
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="text-eyebrow font-semibold uppercase tracking-editorial">GlobTrek</Link>
      <h1 className="mt-10 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight-3">No trip fits all your answers yet.</h1>
      <p className="mt-4 text-base leading-7 text-muted">GlobTrek only recommends a destination that matches your setting and is estimated within your budget. Here&apos;s what&apos;s in the way.</p>
      <h2 className="mt-8 eyebrow">What&apos;s wrong</h2>
      <ul className="mt-3 space-y-3">{diagnosis.reasons.map((reason) => <li key={reason.id} className="border-l-2 border-ink pl-4 text-base leading-7">{reason.text}</li>)}</ul>

      <section className="mt-12" aria-labelledby="fixes-heading">
        <h2 id="fixes-heading" className="eyebrow">Ways to get a trip</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">{diagnosis.options.map((option) => <li key={option.id}>
          {option.href && option.available ? <a href={option.href} onClick={() => { if (option.quiz) { try { window.localStorage.setItem("globtrekQuiz", JSON.stringify(option.quiz)); } catch {} } track("no_match_fix", { source: option.id }); }} className="flex h-full min-h-20 w-full flex-col justify-between border border-black/20 bg-surface-raised p-4 text-left transition-colors duration-150 hover:border-ink">
            <span className="font-medium">{option.label}</span>
            <span className="tabular mt-2 text-sm text-muted">{option.result}</span>
          </a> : <button type="button" disabled={!option.available} onClick={() => rerun(option.quiz, option.id)} className="flex h-full min-h-20 w-full flex-col justify-between border border-black/20 bg-surface-raised p-4 text-left transition-colors duration-150 hover:border-ink disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-black/20">
            <span className="font-medium">{option.label}</span>
            <span className="tabular mt-2 text-sm text-muted">{option.result}</span>
          </button>}
        </li>)}</ul>
      </section>

      <section className="mt-12 border-t border-black/10 pt-10" aria-labelledby="edit-heading">
        <h2 id="edit-heading" className="eyebrow">Or edit your trip</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium">Total budget (USD)<input type="number" min="100" step="25" inputMode="numeric" value={draft.budget} onChange={set("budget")} className={field} /></label>
          <label className="text-sm font-medium">Nights<input type="number" min="1" max="28" value={draft.nights} onChange={set("nights")} className={field} /></label>
          <label className="text-sm font-medium">Travelers<input type="number" min="1" max="30" value={draft.travelers} onChange={set("travelers")} className={field} /></label>
          <label className="text-sm font-medium">How to spend it<select value={draft.spendStyle} onChange={set("spendStyle")} className={field}><option value="auto">Let my budget decide</option><option value="cheapest">Absolute cheapest</option><option value="value">Best value</option><option value="comfortable">Cheap but comfortable</option></select></label>
          <label className="text-sm font-medium">Where<select value={draft.area} onChange={set("area")} className={field}><option value="anywhere">Anywhere</option><option value="domestic">Stay in my country</option><option value="international">International only</option></select></label>
          <label className="flex min-h-12 items-center gap-3 self-end text-sm font-medium"><input type="checkbox" checked={draft.flights} onChange={set("flights")} className="h-5 w-5 accent-black" />Budget includes flights</label>
        </div>
        <p className="mt-3 text-sm text-subtle">Leaving from {profile.originDetails?.displayName || profile.origin || "an airport you haven't chosen"}. <Link href="/discover" className="underline decoration-black/25 underline-offset-4 hover:decoration-ink">Change it in the quiz</Link></p>
        <div aria-live="polite" className="mt-6 border border-black/15 bg-surface p-4 text-sm">
          {preview ? <p><span className="font-medium">With these settings:</span> <span className="tabular">{title(preview.city)} at about {money(preview.budgetPlan.budgetCheckTotal)}{draft.travelers > 1 ? ` (${money(preview.budgetPlan.budgetCheckTotal / draft.travelers)} per person)` : ""}</span></p>
            : <p><span className="font-medium">Still no fit.</span> {diagnosis.closest ? `The closest trip is ${diagnosis.closest.city} at around ${money(diagnosis.closest.total)}; try fewer nights or a bigger budget.` : "Try a different setting or time of year."}</p>}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" disabled={!preview} onClick={() => rerun(edited, "editor")} className="btn btn-primary">Find my trip</button>
          <Link href="/discover" className="text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">Start the quiz over</Link>
        </div>
      </section>
    </div>
  </main>;
}

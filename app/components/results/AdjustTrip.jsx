"use client";

import { useEffect, useMemo, useState } from "react";
import { destinations } from "../../data/destinations";
import { applyQuizPatch } from "../../lib/recommendation/diagnoseNoMatch";
import { rankDestinations } from "../../lib/recommendation/destinationEngine";
import { normalizeTravelerProfile } from "../../lib/recommendation/travelerProfile";
import { track } from "../../lib/analytics";

const HISTORY = "globtrekQuizHistory";
const NIGHT_STEPS = [3, 5, 7, 10, 14];
const STYLE_RANK = { cheapest: 0, value: 1, comfortable: 2 };

// "Same trip", plus a note when the change also moves the stay up or down a level.
function sameTripLabel(style, currentStyle) {
  const change = (STYLE_RANK[style] ?? 1) - (STYLE_RANK[currentStyle] ?? 1);
  return change > 0 ? "Same trip, nicer stay" : change < 0 ? "Same trip, cheaper stay" : "Same trip";
}

function money(value) {
  return `$${Math.round(value || 0).toLocaleString("en-US")}`;
}

function title(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&'-])\S/g, (letter) => letter.toUpperCase());
}

function readHistory() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(HISTORY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeHistory(list) {
  try { window.sessionStorage.setItem(HISTORY, JSON.stringify(list.slice(-10))); } catch {}
}

function go(quiz, destinationId) {
  try { window.localStorage.setItem("globtrekQuiz", JSON.stringify(quiz)); } catch {}
  window.location.assign(destinationId ? `/results?destination=${encodeURIComponent(destinationId)}` : "/results");
}

const key = (item) => item?.id || item?.airport || null;

// What a change would lead to, run through the real matcher before it's offered.
// Changes to cost or length keep the current destination while it still fits;
// only a change of direction (closer, more nature...) moves to the new best match.
export function preview(quiz, currentId = null, keep = false) {
  const ranked = rankDestinations(destinations, normalizeTravelerProfile(quiz));
  const match = (keep && currentId && ranked.find((item) => key(item) === currentId)) || ranked[0];
  return match ? { id: key(match), city: title(match.city), total: match.budgetPlan.budgetCheckTotal, style: match.budgetPlan.spendStyle, same: key(match) === currentId } : null;
}

export function adjustmentOptions(quiz, profile, currentId = null, currentTotal = null) {
  const answers = profile.otherExistingQuizPreferences || {};
  const nights = profile.tripLength;
  const shorter = [...NIGHT_STEPS].reverse().find((value) => value < nights);
  const longer = NIGHT_STEPS.find((value) => value > nights);
  return [
    profile.spendStyle !== "cheapest" && { id: "cheaper", label: "Cheaper", patch: { spendStyle: "cheapest" }, keep: true },
    profile.spendStyle !== "comfortable" && { id: "comfortable", label: "More comfortable", patch: { spendStyle: "comfortable" }, keep: true },
    profile.travelAreaPreference !== "domestic" && { id: "closer", label: "Closer to home", patch: { area: "domestic" } },
    answers.luxury !== "Nature" && { id: "nature", label: "More nature", patch: { interest: "Nature" } },
    answers.luxury !== "Culture" && { id: "culture", label: "More culture", patch: { interest: "Culture" } },
    answers.luxury !== "Nightlife" && { id: "nightlife", label: "More nightlife", patch: { interest: "Nightlife" } },
    shorter && { id: "shorter", label: `Shorter (${shorter} nights)`, patch: { nights: shorter }, keep: true },
    longer && { id: "longer", label: `Longer (${longer} nights)`, patch: { nights: longer }, keep: true },
    profile.includedBudgetCategories.flights && { id: "no-flights", label: "Leave flights out of the budget", patch: { flights: false }, keep: true },
  ].filter(Boolean).map((option) => {
    const next = applyQuizPatch(quiz, option.patch);
    return { ...option, quiz: next, result: preview(next, currentId, option.keep) };
  // Drop changes that would land on the same trip at the same price.
  }).filter((option) => !(option.result?.same && option.result.total === currentTotal));
}

export function AdjustTrip({ quiz, profile, currentTotal, currentId = null, currentStyle = null }) {
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({ budget: profile.exactBudget || 1000, nights: profile.tripLength, travelers: profile.travelers, origin: profile.origin || "", lodging: profile.hotelPreference || "Whatever's cheapest", flights: profile.includedBudgetCategories.flights }));
  useEffect(() => { const timer = setTimeout(() => setHistory(readHistory())); return () => clearTimeout(timer); }, []);
  const options = useMemo(() => adjustmentOptions(quiz, profile, currentId, currentTotal), [quiz, profile, currentId, currentTotal]);
  const edited = useMemo(() => applyQuizPatch(quiz, { budget: draft.budget, nights: draft.nights, travelers: draft.travelers, flights: draft.flights, lodging: draft.lodging, origin: /^[A-Z]{3}$/.test(draft.origin) ? draft.origin : null }), [quiz, draft]);
  const editedResult = useMemo(() => (editing ? preview(edited, currentId, true) : null), [editing, edited, currentId]);

  function apply(next, change, result) {
    writeHistory([...readHistory(), { quiz, destinationId: currentId }]);
    track("trip_adjusted", { change });
    go(next, result?.same ? result.id : null);
  }
  function undo() {
    const list = readHistory();
    const previous = list.pop();
    if (!previous) return;
    writeHistory(list);
    track("trip_adjust_undone", {});
    // Older entries were the quiz alone.
    if (previous.quiz) go(previous.quiz, previous.destinationId);
    else go(previous);
  }
  const set = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.type === "number" ? Number(event.target.value) : key === "origin" ? event.target.value.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() : event.target.value }));
  const field = "mt-1 block min-h-11 w-full border border-black/20 bg-white px-3 text-base";

  return <section id="adjust" aria-labelledby="adjust-heading" className="scroll-mt-24 border-t border-black/15 px-6 py-10 sm:px-12">
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="adjust-heading" className="font-serif text-[clamp(1.8rem,3vw,2.5rem)] leading-[.95] tracking-tight-2">Adjust this trip</h2><p className="mt-2 text-sm text-black/65">Currently {money(currentTotal)}.</p></div>
        {history.length ? <button type="button" onClick={undo} className="inline-flex min-h-11 items-center border border-black/25 px-4 text-sm hover:border-black">↶ Undo last change</button> : null}
      </div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map((option) => <li key={option.id}>
        <button type="button" disabled={!option.result} onClick={() => apply(option.quiz, option.id, option.result)} className="flex min-h-16 w-full items-center justify-between gap-3 border border-black/20 bg-white px-4 py-2 text-left hover:border-black disabled:cursor-not-allowed disabled:opacity-55">
          <span className="font-medium">{option.label}</span>
          <span className="tabular text-right text-xs text-black/65">{option.result ? <>{option.result.same ? sameTripLabel(option.result.style, currentStyle) : option.result.city}<br />{money(option.result.total)}{option.result.total !== currentTotal ? ` (${option.result.total < currentTotal ? "−" : "+"}${money(Math.abs(option.result.total - currentTotal))})` : ""}</> : "No trip fits"}</span>
        </button>
      </li>)}
        <li><a href="#alternatives" className="flex min-h-16 w-full items-center justify-between border border-black/20 bg-white px-4 py-2 font-medium hover:border-black">Different destination <span aria-hidden="true">↓</span></a></li>
      </ul>
      <button type="button" aria-expanded={editing} aria-controls="adjust-editor" onClick={() => setEditing((value) => !value)} className="mt-6 inline-flex min-h-11 items-center text-sm underline decoration-black/30 underline-offset-4">{editing ? "Hide trip details" : "Edit budget, length, travelers, airport or lodging"}</button>
      {editing ? <div id="adjust-editor" className="mt-4 border border-black/15 bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium">Total budget (USD)<input type="number" min="100" max="100000" step="25" inputMode="numeric" value={draft.budget} onChange={set("budget")} className={field} /></label>
          <label className="text-sm font-medium">Nights<input type="number" min="1" max="28" value={draft.nights} onChange={set("nights")} className={field} /></label>
          <label className="text-sm font-medium">Travelers<input type="number" min="1" max="30" value={draft.travelers} onChange={set("travelers")} className={field} /></label>
          <label className="text-sm font-medium">Departure airport (3-letter code)<input value={draft.origin} onChange={set("origin")} maxLength={3} autoCapitalize="characters" className={`${field} uppercase`} /></label>
          <label className="text-sm font-medium">Accommodation<select value={draft.lodging} onChange={set("lodging")} className={field}><option>Whatever&apos;s cheapest</option><option>Hostel bed</option><option>Private room</option></select></label>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm font-medium"><input type="checkbox" checked={draft.flights} onChange={set("flights")} className="h-5 w-5 accent-black" />Budget includes flights</label>
        </div>
        <p className="mt-2 text-xs text-black/60">To change dates, use the calendar in the flight section.</p>
        <div aria-live="polite" className="mt-4 text-sm">{editedResult ? <p><span className="font-medium">With these details:</span> <span className="tabular">{editedResult.city} at about {money(editedResult.total)}</span></p> : <p><span className="font-medium">No trip fits these details.</span> Try a larger budget or fewer nights.</p>}</div>
        <button type="button" disabled={!editedResult} onClick={() => apply(edited, "editor", editedResult)} className="mt-4 inline-flex min-h-11 items-center bg-black px-5 text-micro uppercase tracking-label text-white disabled:opacity-40">Update my trip</button>
      </div> : null}
    </div>
  </section>;
}

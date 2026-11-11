"use client";

import Image from "next/image";
import { track } from "../lib/analytics";
import { useEffect, useMemo, useRef, useState } from "react";
import { discoverySliderToUnknownness, legacyBudgetLabel, normalizeBudget } from "../lib/recommendation/budgetInput";
import { TRAVEL_AREA_OPTIONS } from "../lib/recommendation/travelAreaOptions";
import { cheapestTrip } from "../lib/quiz/cheapestTrip";
import { DURATION_NIGHTS, nightsBetween, nightsRange } from "../lib/trip/schedule";
import { TripDatePicker } from "../components/TripDatePicker";
import { photoCredit } from "../lib/photoCredits";

// Budget comes first: GlobTrek starts from what you have, not where you want to go.
const questions = [
  { id: "budget", question: "How much do you have for this trip?", type: "budget" },
  {
    id: "alive",
    question: "What setting sounds best?",
    type: "visual",
    options: [
      { label: "Ocean", display: "Coast", image: "/quiz/v2/ocean.jpg", alt: "Atrani on the Amalfi Coast, Italy" },
      { label: "Mountains", image: "/quiz/v2/mountains.jpg", alt: "Lago di Carezza below the Latemar, Dolomites" },
      { label: "Cities", display: "City", image: "/quiz/v2/cities.jpg", alt: "Paris and the Eiffel Tower from above" },
      // Set hidden to false to restore Road Trips to the setting question.
      { label: "Road Trips", display: "Road trip", image: "/quiz/road-trips.jpg", alt: "An open road through a dramatic desert landscape", hidden: true },
      { label: "Culture", display: "History & culture", image: "/quiz/v2/culture.jpg", alt: "Kinkaku-ji reflected in its pond, Kyoto" },
      { label: "Surprise Me", display: "No preference", image: "/quiz/v2/surprise-me.jpg", alt: "Hot-air balloons lifting off over Cappadocia" },
    ].filter((option) => !option.hidden),
  },
  {
    id: "escape",
    question: "What pace do you prefer?",
    type: "visual",
    options: [
      { label: "Slow mornings", display: "Relaxed", image: "/quiz/v2/slow-mornings.jpg", alt: "Coffee and croissants at breakfast" },
      { label: "Balanced days", display: "Balanced", image: "/quiz/v2/balanced-days.jpg", alt: "A canal bridge in Amsterdam" },
      { label: "Packed schedule", display: "Full schedule", image: "/quiz/v2/packed-schedule.jpg", alt: "Shibuya Crossing, Tokyo" },
      { label: "Mostly relaxing", display: "Mostly downtime", image: "/quiz/v2/mostly-relaxing.jpg", alt: "A jetty over a turquoise lagoon in the Maldives" },
      { label: "Adventure days", display: "Active", image: "/quiz/v2/adventure-days.jpg", alt: "A hiker on the ridge of Mangart, Slovenia" },
      { label: "Surprise me", display: "No preference", image: "/quiz/v2/surprise-pace.jpg", alt: "A sailboat at sunset off Zoutelande, Netherlands" },
    ],
  },
  {
    id: "duration",
    question: "How long do you want to be away?",
    type: "visual",
    options: [
      { label: "Long Weekend", display: "3–4 nights", image: "/quiz/v2/long-weekend.jpg", alt: "Prague Castle above red rooftops" },
      { label: "Five Nights", display: "5 nights", image: "/quiz/v2/five-nights.jpg", alt: "Lisbon rooftops and the Tagus" },
      { label: "One Week", display: "One week", image: "/quiz/v2/one-week.jpg", alt: "Blue domes above the caldera in Oia, Santorini" },
      { label: "Ten Days", display: "10 days", image: "/quiz/v2/ten-days.jpg", alt: "Skógafoss waterfall, Iceland" },
      { label: "Two Weeks", display: "Two weeks", image: "/quiz/v2/two-weeks.jpg", alt: "Cuernos del Paine at sunrise, Patagonia" },
      { label: "Open-Ended", display: "Not sure yet", image: "/quiz/v2/open-ended.jpg", alt: "A tree-lined country road at dawn" },
    ],
  },
  {
    id: "hotel",
    question: "Where will you sleep?",
    options: [
      { label: "Whatever's cheapest", display: "Whatever's cheapest", image: "/quiz/v2/cheapest.jpg", alt: "A red-cottage hostel on Arholma, Sweden" },
      { label: "Hostel bed", display: "Hostel bed", image: "/quiz/v2/hostel-bed.jpg", alt: "A bright hostel bunk beside a tall window" },
      { label: "Private room", display: "Cheap private room", image: "/quiz/v2/private-room.jpg", alt: "A canopy bed in a quiet hotel suite" },
    ],
  },
  {
    id: "luxury",
    question: "What matters most on this trip?",
    type: "visual",
    options: [
      { label: "Food", image: "/quiz/v2/food.jpg", alt: "A fruit stall at La Boqueria, Barcelona" },
      { label: "Nature", image: "/quiz/v2/nature.jpg", alt: "Moraine Lake, Banff National Park" },
      { label: "Culture", image: "/quiz/v2/culture-priority.jpg", alt: "The Long Room library at Trinity College Dublin" },
      { label: "Nightlife", image: "/quiz/v2/nightlife.jpg", alt: "Neon signs in Kabukichō, Tokyo" },
      { label: "Wellness", image: "/quiz/v2/wellness.jpg", alt: "The outdoor pools at Széchenyi Baths, Budapest" },
      { label: "Shopping", image: "/quiz/v2/shopping.jpg", alt: "Galleria Vittorio Emanuele II, Milan" },
    ],
  },
];

const preferenceSteps = questions.length + 1;
const DRAFT_KEY = "globtrekQuizDraft";
// The worldwide airport list is large, so it loads only when the final step's field mounts.
function loadAirportSearch() {
  return Promise.all([import("../data/airports.json"), import("../lib/recommendation/travelArea")]).then(([data, travelArea]) => ({
    structuredOrigin: travelArea.structuredOrigin,
    index: (data.default || data).map((airport) => ({ airport, code: airport.code.toLowerCase(), city: airport.city.toLowerCase(), name: airport.name.toLowerCase() })),
  }));
}

function questionsFor() {
  return questions;
}

function Progress({ step }) {
  return <div className="flex items-center gap-4">
    <div className="hidden h-px w-24 bg-black/15 sm:block" aria-hidden="true"><div className="h-px bg-ink transition-[width] duration-200 ease-[cubic-bezier(.2,0,0,1)]" style={{ width: `${((step + 1) / preferenceSteps) * 100}%` }} /></div>
    <p className="text-micro font-medium tabular-nums tracking-editorial text-subtle"><span className="sr-only">Step </span>{String(step + 1).padStart(2, "0")}<span aria-hidden="true"> / </span><span className="sr-only"> of </span>{String(preferenceSteps).padStart(2, "0")}</p>
  </div>;
}

function VisualQuestion({ question, value, onChoose, step, status = {}, note = null }) {
  const selected = value || question.options[0].label;
  const [preview, setPreview] = useState(selected);

  const active = question.options.find((option) => option.label === preview) || question.options[0];
  const credit = photoCredit(active.image);
  const tiles = useRef([]);
  // Let the first photo win the network race; the other previews load just after it.
  const [warm, setWarm] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setWarm(true), 900); return () => window.clearTimeout(timer); }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.target?.tagName === "INPUT") return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < question.options.length && !status[question.options[index].label]?.disabled) { event.preventDefault(); onChoose(question.options[index].label); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, onChoose, status]);

  function moveFocus(event, index) {
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    tiles.current[(index + delta + question.options.length) % question.options.length]?.focus();
  }

  return (
    <div className="quiz-stage grid min-h-[calc(100svh-5rem)] grid-rows-[auto_1fr_auto] px-5 pb-6 pt-9 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between"><span className="text-xl font-semibold uppercase tracking-tight-3">GlobTrek</span><Progress step={step} /></div>
      <div className="grid items-center gap-9 py-8 lg:grid-cols-[30%_70%] lg:gap-0 lg:py-8">
        <div className="relative z-10 lg:pr-12">
          <p className="mb-6 text-micro uppercase tracking-editorial text-subtle">The GlobTrek quiz</p>
          <h1 className="max-w-md text-[2.25rem] font-medium leading-[0.94] tracking-tight-4 sm:text-[clamp(2.7rem,5.2vw,5.6rem)]">{question.question}</h1>{note ? <p className="mt-5 max-w-sm text-sm leading-6 text-muted">{note}</p> : null}
        </div>
        <div className="relative aspect-[4/3] max-h-[300px] overflow-hidden bg-placeholder sm:max-h-none sm:min-h-[360px] lg:aspect-auto lg:h-[min(69vh,760px)]">
          {question.options.filter((option) => warm || option.label === selected || option.label === active.label).map((option) => (
            <Image key={option.label} src={option.image} alt={option.label === active.label ? option.alt : ""} fill priority={option.label === selected} className={`object-cover transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] ${option.label === active.label ? "scale-100 opacity-100" : "pointer-events-none scale-[1.012] opacity-0"}`} sizes="(min-width:1024px) 70vw, 100vw" />
          ))}
          {credit ? <a href={credit.source} target="_blank" rel="noopener" className="absolute right-2 top-2 z-10 max-w-[80%] truncate bg-black/35 px-2 py-0.5 text-[10px] leading-4 text-white/85 backdrop-blur-sm hover:text-white">Photo: {credit.artist} · {credit.license}<span className="sr-only"> (opens in a new tab)</span></a> : null}
        </div>
      </div>
      <div className="relative z-20 mx-auto w-full max-w-[1500px] bg-surface lg:-mt-16">
        <div className="grid grid-cols-2 border-l border-t border-black/10 sm:flex sm:border-x-0 sm:border-y sm:px-6">
          {question.options.map((option, index) => {
            const isActive = selected === option.label;
            const state = status[option.label] || {};
            return <button type="button" key={option.label} ref={(node) => { tiles.current[index] = node; }} onKeyDown={(event) => moveFocus(event, index)} aria-pressed={value === option.label} aria-disabled={state.disabled || undefined} aria-describedby={state.note ? `option-note-${index}` : undefined} aria-keyshortcuts={String(index + 1)} onMouseEnter={() => setPreview(option.label)} onMouseLeave={() => setPreview(selected)} onFocus={() => setPreview(option.label)} onBlur={() => setPreview(selected)} onClick={() => { if (!state.disabled) onChoose(option.label); }} className={`relative min-h-14 border-b border-r border-black/10 px-3 text-micro uppercase tracking-label transition-colors sm:min-h-24 sm:flex-1 sm:border-0 sm:px-4 sm:text-eyebrow sm:tracking-label ${state.disabled ? "cursor-not-allowed text-black/25 line-through decoration-black/20" : isActive ? "bg-ink text-white sm:bg-transparent sm:text-black" : "text-subtle hover:text-black"}`}><span className={`absolute inset-x-6 top-0 hidden h-px bg-black transition-transform duration-500 sm:block ${isActive && !state.disabled ? "scale-x-100" : "scale-x-0"}`} />{option.display || option.label}{state.note ? <span id={`option-note-${index}`} className={`mt-1 block text-micro normal-case tracking-normal no-underline ${state.disabled ? "text-black/40" : "text-warning"}`}>{state.note}</span> : null}</button>;
          })}
        </div>
      </div>
    </div>
  );
}

const budgetCategoryLabels = {
  flights: "Flights",
  hotel: "Hotel",
  food: "Food",
  activities: "Activities",
  transportation: "Transportation",
};

function BudgetQuestion({ value, includes, onValueChange, onToggle, onBack, onContinue, step }) {
  const budget = normalizeBudget(value);
  const valid = budget !== null && Object.values(includes).some(Boolean);
  const formatted = value ? Number(String(value).replace(/\D/g, "")).toLocaleString("en-US") : "";
  return <div className="quiz-stage flex min-h-[calc(100svh-5rem)] flex-col bg-canvas px-5 pb-8 pt-9 sm:px-8 lg:px-10">
    <div className="flex items-center justify-between"><span className="text-xl font-semibold uppercase tracking-tight-3">GlobTrek</span><Progress step={step} /></div>
    <form onSubmit={(event) => { event.preventDefault(); if (valid) onContinue(budget); }} className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-10 text-center">
      <h1 className="mx-auto max-w-3xl text-[clamp(2.6rem,5.6vw,5.75rem)] font-medium leading-[0.92] tracking-tight-4">How much do you want to spend?</h1>
      <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-muted">Your total for the whole trip. We&apos;ll plan the most comfortable trip it covers.</p>
      <label className="mx-auto mt-10 flex w-full max-w-xl items-center justify-center border-b border-black pb-4">
        <span className="sr-only">Total trip budget in US dollars</span>
        <span aria-hidden="true" className="mr-2 font-serif text-[clamp(2.75rem,6vw,5.75rem)] font-light">$</span>
        <input aria-label="Total trip budget in US dollars" inputMode="numeric" autoComplete="off" value={formatted} onChange={(event) => onValueChange(event.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="800" className="w-[6.5ch] min-w-0 bg-transparent text-center font-serif text-[clamp(2.75rem,6vw,5.75rem)] font-light tracking-tight-3 outline-none placeholder:text-black/18" />
      </label>
      <fieldset className="mt-10">
        <legend className="mx-auto text-micro uppercase tracking-editorial text-subtle">Count toward this budget</legend>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {Object.entries(budgetCategoryLabels).map(([key, label]) => <button type="button" key={key} aria-pressed={includes[key]} onClick={() => onToggle(key)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${includes[key] ? "border-black bg-black text-white" : "border-black/20 text-black/55 hover:border-black hover:text-black"}`}><span aria-hidden="true">{includes[key] ? "✓" : "+"}</span>{label}</button>)}
        </div>
        <p className="mt-4 text-xs text-subtle">Anything you turn off is planned but paid on top.</p>
      </fieldset>
      <div className="mt-10 flex items-center justify-between gap-6 border-t border-black/10 pt-6">
        {step > 0 ? <button type="button" onClick={onBack} className="min-h-12 text-xs uppercase tracking-label text-muted">← Back</button> : <span />}
        <button type="submit" disabled={!valid} className="min-h-14 bg-black px-8 text-xs font-semibold uppercase tracking-label text-white disabled:opacity-25">Continue →</button>
      </div>
    </form>
  </div>;
}

function AirportAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value ? `${value.city || value.airportName} (${value.airportCode})` : "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState(null);
  useEffect(() => { let live = true; loadAirportSearch().then((loaded) => { if (live) setSearch(loaded); }).catch(() => {}); return () => { live = false; }; }, []);
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalized || !search) return [];
    const ranked = search.index
      .map(({ airport, code, city, name }) => {
        let rank = 99;
        if (code === normalized) rank = 0;
        else if (city === normalized) rank = 1;
        else if (city.startsWith(normalized)) rank = 2;
        else if (code.startsWith(normalized)) rank = 3;
        else if (name.startsWith(normalized)) rank = 4;
        else if (`${city} ${name} ${code}`.includes(normalized)) rank = 5;
        return { airport, rank };
      })
      .filter(({ rank }) => rank < 99)
      .sort((a, b) => a.rank - b.rank || Number(b.airport.scheduled) - Number(a.airport.scheduled) || a.airport.city.localeCompare(b.airport.city));
    return ranked.slice(0, 8).map(({ airport }) => airport);
  }, [normalized, search]);

  function choose(airport) {
    setQuery(`${airport.city || airport.name} (${airport.code})`);
    onChange(search.structuredOrigin(airport.code));
    setOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event) {
    if (!open || !matches.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((current) => (current + 1) % matches.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => (current - 1 + matches.length) % matches.length); }
    if (event.key === "Enter") { event.preventDefault(); choose(matches[activeIndex]); }
    if (event.key === "Escape") setOpen(false);
  }

  return <div className="relative mt-3">
    <input
      className="w-full border-0 border-b border-black/25 bg-transparent px-0 py-4 text-lg tracking-tight-1 outline-none transition-colors placeholder:text-black/28 focus:border-black"
      type="text"
      inputMode="text"
      autoComplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open && matches.length > 0}
      aria-controls="airport-suggestions"
      aria-required="true"
      placeholder="City, airport, or code"
      value={query}
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      onKeyDown={handleKeyDown}
      onChange={(event) => { setQuery(event.target.value); onChange(null); setOpen(true); setActiveIndex(0); }}
    />
    {open && normalized && <div id="airport-suggestions" role="listbox" className="absolute inset-x-0 top-full z-50 max-h-80 overflow-y-auto border-x border-b border-black/20 bg-surface shadow-overlay">
      {matches.length ? matches.map((airport, index) => <button
        key={`${airport.code}-${airport.name}`}
        type="button"
        role="option"
        aria-selected={index === activeIndex}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => choose(airport)}
        className={`flex w-full items-center justify-between gap-5 border-t border-black/10 px-5 py-3 text-left transition-colors first:border-t-0 ${index === activeIndex ? "bg-surface-sunken" : "hover:bg-canvas"}`}
      >
        <span className="min-w-0"><strong className="block truncate text-sm font-medium text-black">{airport.city || airport.name}</strong><span className="mt-1 block truncate text-micro uppercase tracking-caps text-subtle">{airport.name}{airport.country ? ` · ${airport.country}` : ""}</span></span>
        <span className="shrink-0 text-xs font-semibold tracking-label">{airport.code}</span>
      </button>) : <p className="px-5 py-4 text-xs text-subtle">{search ? "No matching airport found." : "Loading airports…"}</p>}
    </div>}
  </div>;
}

function DiscoveryQuestion({ value, onChange, onBack, onContinue }) {
  const level = Number.isFinite(value) ? value : 50;
  const mood = level < 20 ? "Off the radar" : level < 40 ? "Less discovered" : level < 65 ? "A mix of both" : level < 85 ? "Well known" : "The classics";

  return <div className="quiz-stage flex min-h-[calc(100svh-5rem)] flex-col bg-canvas px-5 pb-8 pt-9 sm:px-8 lg:px-10">
    <div className="flex items-center justify-between"><span className="text-xl font-semibold uppercase tracking-tight-3">GlobTrek</span><Progress step={questions.length} /></div>
    <div className="mx-auto flex w-full max-w-[1450px] flex-1 flex-col justify-center py-14">
      <p className="text-center text-micro uppercase tracking-editorial text-subtle">How well known should it be?</p>
      <h1 className="mx-auto mt-8 max-w-5xl text-center text-[clamp(3.2rem,7.5vw,8.5rem)] font-medium leading-[0.86] tracking-tight-4">{mood}</h1>
      <div className="mx-auto mt-16 w-full max-w-5xl sm:mt-24">
        <div className="relative h-24 sm:h-32">
          <div className="absolute inset-x-0 top-1/2 h-px bg-black/25" />
          <div className="absolute left-0 top-1/2 h-px bg-black transition-[width] duration-300" style={{ width: `${level}%` }} />
          <div className="pointer-events-none absolute top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-canvas shadow-hover transition-[left] duration-150 sm:h-20 sm:w-20" style={{ left: `${level}%` }}><span className="grid h-full place-items-center text-micro tabular-nums tracking-label">{level}</span></div>
          <input aria-label="Destination familiarity" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" type="range" min="0" max="100" step="1" value={level} onInput={(event) => onChange(Number(event.currentTarget.value))} onChange={(event) => onChange(Number(event.currentTarget.value))} />
        </div>
        <div className="flex justify-between gap-8 border-t border-black/10 pt-5 text-micro uppercase tracking-editorial text-muted"><span>Hidden places</span><span className="text-right">Iconic places</span></div>
      </div>
    </div>
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 border-t border-black/10 pt-7">
      <button type="button" onClick={onBack} className="min-h-12 text-xs uppercase tracking-label text-muted hover:text-black">← Back</button>
      <button type="button" onClick={onContinue} className="min-h-14 bg-ink px-8 text-xs font-semibold uppercase tracking-label text-white">Set the course →</button>
    </div>
  </div>;
}

function DateQuestion({ answers, setAnswers, tripStart, tripEnd, isFlexible, setTripStart, setTripEnd, setIsFlexible, originDetails, setOriginDetails, travelAreaPreference, setTravelAreaPreference, guestCount, setGuestCount, onBack, onSubmit, canSubmit }) {
  const [mode, setMode] = useState(isFlexible ? "flexible" : "dates");
  const range = nightsRange(answers.duration);
  const seasons = [["Spring", "Mar – May", "Spring (Mar-May)"], ["Summer", "Jun – Aug", "Summer (Jun-Aug)"], ["Fall", "Sep – Nov", "Fall (Sep-Nov)"], ["Winter", "Dec – Feb", "Winter (Dec-Feb)"]];

  function selectMode(nextMode) {
    setMode(nextMode);
    setIsFlexible(nextMode === "flexible");
    if (nextMode === "flexible") { setTripStart(""); setTripEnd(""); }
  }

  return <form onSubmit={onSubmit} className="quiz-stage grid min-h-svh bg-canvas lg:grid-cols-2">
    <div className="flex min-h-svh flex-col px-5 pb-8 pt-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="flex items-center justify-between"><span className="text-xl font-semibold uppercase tracking-tight-3">GlobTrek</span><p className="text-micro uppercase tracking-editorial text-subtle">Trip details</p></div>
      <div className="flex flex-1 flex-col justify-center py-10 sm:py-14 lg:py-8">
        <p className="text-micro uppercase tracking-editorial text-subtle">Final step</p>
        <h1 className="mt-5 max-w-xl text-[clamp(3rem,5.4vw,5.8rem)] font-medium leading-[0.9] tracking-tight-4">When and from where?</h1>

        <div className="mt-9 grid gap-8 sm:grid-cols-[1fr_7rem]">
          <label><span className="text-micro uppercase tracking-editorial text-muted">Leaving from</span><AirportAutocomplete value={originDetails} onChange={setOriginDetails} /></label>
          <label><span className="text-micro uppercase tracking-editorial text-muted">Travelers</span><input className="mt-3 w-full border-0 border-b border-black/25 bg-transparent px-0 py-4 text-lg outline-none focus:border-black" type="number" min="1" max="30" value={guestCount} onChange={(event) => setGuestCount(event.target.value)} required /></label>
        </div>

        <fieldset className="mt-9">
          <legend className="text-micro uppercase tracking-editorial text-muted">Where would you like to go?</legend>
          <div role="radiogroup" className="mt-3 grid grid-cols-3 border border-black/15">
            {TRAVEL_AREA_OPTIONS.map((option) => <button type="button" role="radio" key={option.value} aria-checked={travelAreaPreference === option.value} onClick={() => setTravelAreaPreference(option.value)} className={`min-h-14 border-r border-black/15 px-2 text-micro leading-4 transition-colors last:border-r-0 sm:px-3 ${travelAreaPreference === option.value ? "bg-ink text-white" : "text-black/52 hover:text-black"}`}>{option.label}</button>)}
          </div>
        </fieldset>

        <div className="mt-9 grid grid-cols-2 border border-black/15">
          <button type="button" onClick={() => selectMode("dates")} className={`min-h-14 border-r border-black/15 px-4 text-micro font-medium uppercase tracking-caps transition-colors ${mode === "dates" ? "bg-ink text-white" : "text-muted hover:text-black"}`}>I know my dates</button>
          <button type="button" onClick={() => selectMode("flexible")} className={`min-h-14 px-4 text-micro font-medium uppercase tracking-caps transition-colors ${mode === "flexible" ? "bg-ink text-white" : "text-muted hover:text-black"}`}>I’m flexible</button>
        </div>

        <div className="min-h-28">
          {mode === "dates" ? <div className="mt-8">
            <TripDatePicker start={tripStart} end={tripEnd} minNights={range.min} maxNights={range.max} label="Departure and return dates" onChange={(nextStart, nextEnd) => { setTripStart(nextStart); setTripEnd(nextEnd); }} />
          </div> : <div className="mt-8 grid grid-cols-4 border border-black/15">
            {seasons.map(([name, months, value]) => <button type="button" key={name} onClick={() => setAnswers((current) => ({ ...current, season: value }))} className={`min-h-20 border-r border-black/15 px-2 text-left transition-colors last:border-r-0 sm:px-3 ${answers.season === value ? "bg-ink text-white" : "text-muted hover:text-black"}`}><strong className="block text-micro font-medium uppercase tracking-caps">{name}</strong><span className={`mt-2 block text-micro ${answers.season === value ? "text-white/60" : "text-subtle"}`}>{months}</span></button>)}
          </div>}
        </div>

        <div className="mt-10 flex items-center justify-between gap-6">
          <button type="button" onClick={onBack} className="min-h-12 text-xs uppercase tracking-label text-muted hover:text-black">← Back</button>
          <button disabled={!canSubmit} type="submit" className="min-h-14 bg-ink px-8 text-xs font-semibold uppercase tracking-label text-white disabled:opacity-30">Reveal my trip</button>
        </div>
      </div>
    </div>
    <div className="relative hidden min-h-svh bg-placeholder lg:block"><Image src="/results-feature.jpg" alt="A coastal villa beside clear blue water" fill priority className="object-cover" sizes="50vw" /></div>
  </form>;
}

export default function TravelQuiz({ durationFloors = null }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);
  const [originDetails, setOriginDetails] = useState(null);
  const [travelAreaPreference, setTravelAreaPreference] = useState("anywhere");
  const [guestCount, setGuestCount] = useState("1");
  const [discoveryLevel, setDiscoveryLevel] = useState(50);
  const [exactBudget, setExactBudget] = useState("");
  const [budgetIncludes, setBudgetIncludes] = useState({ flights: true, hotel: true, food: true, activities: true, transportation: true });
  const [phase, setPhase] = useState("idle");
  const timer = useRef(null);
  const [preferredDestination, setPreferredDestination] = useState(null);
  const [restored, setRestored] = useState(false);
  const [skipSetting, setSkipSetting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destinationId = params.get("destination");
    const setting = params.get("setting");
    let draft = null;
    try { draft = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) || "null"); } catch {}
    const restoredStep = draft && !setting ? Math.max(0, Math.min(Number(draft.step) || 0, preferenceSteps)) : 0;
    const initialize = window.setTimeout(() => {
      if (destinationId) setPreferredDestination({ id: destinationId, name: params.get("destinationName") || destinationId });
      if (draft && !setting) {
        setAnswers(draft.answers || {});
        setDiscoveryLevel(Number.isFinite(draft.discoveryLevel) ? draft.discoveryLevel : 50);
        setExactBudget(draft.exactBudget || "");
        if (draft.budgetIncludes) setBudgetIncludes(draft.budgetIncludes);
        setTripStart(draft.tripStart || ""); setTripEnd(draft.tripEnd || ""); setIsFlexible(Boolean(draft.isFlexible));
        setOriginDetails(draft.originDetails || null);
        setTravelAreaPreference(draft.travelAreaPreference || "anywhere");
        setGuestCount(draft.guestCount || "1");
        setStep(restoredStep);
      } else if (setting && questions.find((question) => question.id === "alive")?.options.some((option) => option.label === setting)) {
        setAnswers({ alive: setting });
        setSkipSetting(true);
        setStep(0);
        params.delete("setting");
        window.history.replaceState({ ...window.history.state, quizStep: 0 }, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
        track("quiz_started", { source: "vibe", setting });
      }
      setRestored(true);
    }, 0);
    const onPop = (event) => { if (typeof event.state?.quizStep === "number") setStep(event.state.quizStep); };
    window.addEventListener("popstate", onPop);
    window.history.replaceState({ ...window.history.state, quizStep: setting ? 0 : restoredStep }, "");
    return () => { window.removeEventListener("popstate", onPop); window.clearTimeout(initialize); window.clearTimeout(timer.current); };
  }, []);

  // Keep answers through refreshes and back-navigation for this tab.
  useEffect(() => {
    if (!restored) return;
    try { window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, answers, discoveryLevel, exactBudget, budgetIncludes, tripStart, tripEnd, isFlexible, originDetails, travelAreaPreference, guestCount })); } catch {}
  }, [restored, step, answers, discoveryLevel, exactBudget, budgetIncludes, tripStart, tripEnd, isFlexible, originDetails, travelAreaPreference, guestCount]);

  const adaptiveQuestions = useMemo(() => questionsFor(answers), [answers]);
  // Trip lengths the budget can't cover even at rock bottom are greyed out; close calls are marked.
  const durationStatus = useMemo(() => {
    const budget = normalizeBudget(exactBudget);
    if (!budget || !durationFloors) return {};
    return Object.fromEntries(Object.entries(DURATION_NIGHTS).filter(([label]) => label !== "Open-Ended").map(([label, nights]) => {
      const cheapest = cheapestTrip(durationFloors, nights, budgetIncludes);
      if (cheapest === null) return [label, {}];
      if (cheapest > budget) return [label, { disabled: true, note: `Needs about $${Math.ceil(cheapest / 50) * 50}+` }];
      return [label, cheapest > budget * 0.85 ? { note: "Tight, but possible" } : {}];
    }));
  }, [durationFloors, exactBudget, budgetIncludes]);
  const durationNote = Object.values(durationStatus).some((item) => item.disabled) ? `Greyed out: longer than $${Number(normalizeBudget(exactBudget)).toLocaleString("en-US")} covers, even at the cheapest, for one traveler.` : null;
  const current = adaptiveQuestions[step];
  const tripRange = nightsRange(answers.duration);
  const datedNights = nightsBetween(tripStart, tripEnd);
  const hasTravelDates = isFlexible ? Boolean(answers.season) : Boolean(datedNights && datedNights >= tripRange.min && datedNights <= tripRange.max);
  const canSubmit = normalizeBudget(exactBudget) !== null && Object.values(budgetIncludes).some(Boolean) && Boolean(originDetails?.airportCode && originDetails?.countryCode) && hasTravelDates;

  function go(next, direction = "forward") {
    setPhase(direction === "back" ? "leaving-back" : "leaving");
    timer.current = window.setTimeout(() => { setStep(next); window.history.pushState({ ...window.history.state, quizStep: next }, ""); setPhase("entering"); requestAnimationFrame(() => requestAnimationFrame(() => setPhase("idle"))); }, 280);
  }

  function choose(label) {
    setAnswers((value) => ({ ...value, [current.id]: label }));
    track("quiz_step_completed", { step: step + 1, question: current.id });
    timer.current = window.setTimeout(() => go(step + 1), 250);
  }

  function back() { if (step > 0) go(step - 1, "back"); }

  function continueDiscovery() {
    setAnswers((value) => ({ ...value, discovery: discoverySliderToUnknownness(discoveryLevel) }));
    go(step + 1);
  }

  function continueBudget(budget) {
    if (step === 0) track("quiz_started", { first: "budget" });
    setAnswers((value) => ({ ...value, memory: legacyBudgetLabel(budget), exactBudget: budget, includedBudgetCategories: budgetIncludes }));
    // A setting picked on the homepage is already answered, so skip that question.
    go(skipSetting && answers.alive && adaptiveQuestions[step + 1]?.id === "alive" ? step + 2 : step + 1);
  }

  function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    const budget = normalizeBudget(exactBudget);
    const { spendStyle: _oldSpendStyle, ...rest } = answers;
    const completeAnswers = { ...rest, memory: legacyBudgetLabel(budget), exactBudget: budget, includedBudgetCategories: budgetIncludes };
    window.localStorage.setItem("globtrekQuiz", JSON.stringify({
      answers: completeAnswers,
      exactBudget: budget,
      includedBudgetCategories: budgetIncludes,
      budgetIncludesFlights: budgetIncludes.flights,
      budgetIncludesHotel: budgetIncludes.hotel,
      budgetIncludesFood: budgetIncludes.food,
      budgetIncludesActivities: budgetIncludes.activities,
      budgetIncludesTransportation: budgetIncludes.transportation,
      tripStart,
      tripEnd,
      isFlexible,
      originAirport: originDetails.airportCode,
      originDetails,
      originCountryCode: originDetails.countryCode,
      originCountryName: originDetails.countryName,
      travelAreaPreference,
      guestCount,
      destination: preferredDestination?.id || null,
      preferredDestination,
      createdAt: Date.now(),
    }));
    try { window.sessionStorage.removeItem(DRAFT_KEY); } catch {}
    track("quiz_completed", { setting: answers.alive || "unknown", duration: answers.duration || "unknown" });
    setPhase("complete");
    timer.current = window.setTimeout(() => window.location.assign(preferredDestination?.id ? `/thinking?destination=${encodeURIComponent(preferredDestination.id)}` : "/thinking"), 150);
  }

  if (phase === "complete") return <div className="grid min-h-[calc(100svh-5rem)] place-items-center bg-canvas px-5"><p className="font-serif text-[clamp(2.25rem,6vw,3.5rem)] tracking-tight-3">Building your trip</p></div>;

  return <section id="quiz" className={`relative overflow-hidden bg-canvas text-ink transition-[opacity,transform] duration-300 ease-out ${phase === "leaving" ? "-translate-y-2 opacity-0" : phase === "leaving-back" ? "translate-y-2 opacity-0" : phase === "entering" ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
    {preferredDestination ? <div className="pointer-events-none absolute inset-x-0 top-1 z-40 text-center"><span className="inline-flex border border-black/10 bg-canvas/90 px-3 py-1.5 text-micro uppercase tracking-label text-black/55 backdrop-blur">Planning {preferredDestination.name}</span></div> : null}
    {step < adaptiveQuestions.length ? current.type === "budget" ? <BudgetQuestion value={exactBudget} includes={budgetIncludes} onValueChange={setExactBudget} onToggle={(key) => setBudgetIncludes((currentIncludes) => ({ ...currentIncludes, [key]: !currentIncludes[key] }))} onBack={back} onContinue={continueBudget} step={step} /> : <VisualQuestion question={current} value={current.id === "duration" && durationStatus[answers.duration]?.disabled ? null : answers[current.id]} onChoose={choose} step={step} {...(current.id === "duration" ? { status: durationStatus, note: durationNote } : {})} /> : step === adaptiveQuestions.length ? <DiscoveryQuestion value={discoveryLevel} onChange={setDiscoveryLevel} onBack={back} onContinue={continueDiscovery} /> : <DateQuestion answers={answers} setAnswers={setAnswers} tripStart={tripStart} tripEnd={tripEnd} isFlexible={isFlexible} setTripStart={setTripStart} setTripEnd={setTripEnd} setIsFlexible={setIsFlexible} originDetails={originDetails} setOriginDetails={setOriginDetails} travelAreaPreference={travelAreaPreference} setTravelAreaPreference={setTravelAreaPreference} guestCount={guestCount} setGuestCount={setGuestCount} onBack={back} onSubmit={submit} canSubmit={canSubmit} />}
  </section>;
}

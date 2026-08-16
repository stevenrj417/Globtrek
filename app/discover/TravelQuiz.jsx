"use client";

import Image from "next/image";
import { track } from "@vercel/analytics";
import { useEffect, useMemo, useRef, useState } from "react";
import airports from "../data/airports.json";
import { discoverySliderToUnknownness, legacyBudgetLabel, normalizeBudget } from "../lib/recommendation/travelerProfile";

const questions = [
  {
    id: "alive",
    question: "What setting sounds best?",
    type: "visual",
    options: [
      { label: "Ocean", display: "Coast", image: "/quiz/ocean.jpg", alt: "A woman overlooking a bright Mediterranean sea" },
      { label: "Mountains", image: "/quiz/mountains.jpg", alt: "A fashion portrait in a snowy mountain landscape" },
      { label: "Cities", display: "City", image: "/quiz/cities.jpg", alt: "A black-and-white fashion portrait in Paris" },
      { label: "Road Trips", display: "Road trip", image: "/quiz/road-trips.jpg", alt: "An open road through a dramatic desert landscape" },
      { label: "Culture", display: "History & culture", image: "/quiz/culture.jpg", alt: "A quiet tree-lined street in Kyoto" },
      { label: "Surprise Me", display: "No preference", image: "/quiz/surprise-me.jpg", alt: "Rio de Janeiro seen from above" },
    ],
  },
  {
    id: "escape",
    question: "What pace do you prefer?",
    type: "visual",
    options: [
      { label: "Slow mornings", display: "Relaxed", image: "/quiz/slow-mornings.jpg", alt: "A beautiful slow morning with coffee" },
      { label: "Balanced days", display: "Balanced", image: "/quiz/balanced-days.jpg", alt: "A calm open road beneath a wide sky" },
      { label: "Packed schedule", display: "Full schedule", image: "/quiz/packed-schedule.jpg", alt: "A vibrant city seen from above" },
      { label: "Mostly relaxing", display: "Mostly downtime", image: "/quiz/mostly-relaxing.jpg", alt: "Clear water and a quiet tropical beach" },
      { label: "Adventure days", display: "Active", image: "/quiz/adventure-days.jpg", alt: "A hiker overlooking dramatic mountains" },
      { label: "Surprise me", display: "No preference", image: "/quiz/surprise-pace.jpg", alt: "Travelers laughing together in the sun" },
    ],
  },
  {
    id: "duration",
    question: "How long do you want to be away?",
    type: "visual",
    options: [
      { label: "Long Weekend", display: "3–4 nights", image: "/quiz/long-weekend.jpg", alt: "A polished long weekend escape" },
      { label: "Five Nights", display: "5 nights", image: "/quiz/five-nights.jpg", alt: "A five-night city escape" },
      { label: "One Week", display: "One week", image: "/quiz/one-week.jpg", alt: "A week of travel in a beautiful landscape" },
      { label: "Ten Days", display: "10 days", image: "/quiz/ten-days.jpg", alt: "A ten-day road trip" },
      { label: "Two Weeks", display: "Two weeks", image: "/quiz/two-weeks.jpg", alt: "A two-week journey through dramatic scenery" },
      { label: "Open-Ended", display: "Not sure yet", image: "/quiz/open-ended.jpg", alt: "An open-ended journey" },
    ],
  },
  {
    id: "hotel",
    question: "What type of stay do you prefer?",
    type: "visual",
    options: [
      { label: "Boutique hotel", image: "/quiz/boutique-hotel.jpg", alt: "Editorial city style in Paris" },
      { label: "Beach resort", image: "/quiz/beach-resort.jpg", alt: "White architecture beside the sea" },
      { label: "Mountain lodge", image: "/quiz/mountain-lodge.jpg", alt: "A grand mountain hotel in Banff" },
      { label: "Private villa", image: "/quiz/private-villa.jpg", alt: "A private villa surrounded by greenery" },
      { label: "Design hotel", image: "/quiz/design-hotel.jpg", alt: "A minimal contemporary hotel interior" },
      { label: "Traditional inn", image: "/quiz/traditional-inn.jpg", alt: "A traditional inn on a quiet Kyoto street" },
    ],
  },
  {
    id: "luxury",
    question: "What matters most on this trip?",
    type: "visual",
    options: [
      { label: "Food", image: "/quiz/food.jpg", alt: "A considered restaurant table" },
      { label: "Nature", image: "/quiz/nature.jpg", alt: "Snowy mountains in clear light" },
      { label: "Culture", image: "/quiz/culture-priority.jpg", alt: "A quiet Kyoto street" },
      { label: "Nightlife", image: "/quiz/nightlife.jpg", alt: "A crowd beneath city lights" },
      { label: "Wellness", image: "/quiz/wellness.jpg", alt: "A calm coastal setting" },
      { label: "Shopping", image: "/quiz/shopping.jpg", alt: "Editorial fashion in Paris" },
    ],
  },
  { id: "budget", question: "How much do you want to spend?", type: "budget" },
];

const preferenceSteps = questions.length + 1;

const stayOptionsBySetting = {
  Ocean: ["Beach resort", "Private villa", "Boutique hotel", "Design hotel"],
  Mountains: ["Mountain lodge", "Boutique hotel", "Design hotel", "Traditional inn"],
  Cities: ["Boutique hotel", "Design hotel", "Traditional inn"],
  "Road Trips": ["Mountain lodge", "Private villa", "Boutique hotel", "Traditional inn"],
  Culture: ["Traditional inn", "Boutique hotel", "Design hotel", "Private villa"],
};

function questionsFor(answers) {
  const allowedStays = stayOptionsBySetting[answers.alive];
  return questions.map((question) => question.id === "hotel" && allowedStays
    ? { ...question, options: question.options.filter((option) => allowedStays.includes(option.label)) }
    : question);
}

function Progress({ step }) {
  return <p className="text-[10px] font-medium tabular-nums tracking-[0.2em] text-[#777]">{String(step + 1).padStart(2, "0")} / {String(preferenceSteps).padStart(2, "0")}</p>;
}

function VisualQuestion({ question, value, onChoose, step }) {
  const selected = value || question.options[0].label;
  const [preview, setPreview] = useState(selected);

  const active = question.options.find((option) => option.label === preview) || question.options[0];

  return (
    <div className="quiz-stage grid min-h-[calc(100svh-5rem)] grid-rows-[auto_1fr_auto] px-5 pb-6 pt-9 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between"><span className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</span><Progress step={step} /></div>
      <div className="grid items-center gap-9 py-8 lg:grid-cols-[30%_70%] lg:gap-0 lg:py-8">
        <div className="relative z-10 lg:pr-12">
          <p className="mb-6 text-[10px] uppercase tracking-[0.23em] text-[#777]">The GlobTrek quiz</p>
          <h1 className="max-w-md text-[2.25rem] font-medium leading-[0.94] tracking-[-0.065em] sm:text-[clamp(2.7rem,5.2vw,5.6rem)]">{question.question}</h1>
        </div>
        <div className="relative aspect-[4/3] max-h-[300px] overflow-hidden bg-[#e8e6e1] sm:max-h-none sm:min-h-[360px] lg:aspect-auto lg:h-[min(69vh,760px)]">
          {question.options.map((option) => (
            <Image key={option.label} src={option.image} alt={option.label === active.label ? option.alt : ""} fill priority={option.label === selected} className={`object-contain transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] sm:object-cover ${option.label === active.label ? "scale-100 opacity-100" : "pointer-events-none scale-[1.012] opacity-0"}`} sizes="(min-width:1024px) 70vw, 100vw" />
          ))}
        </div>
      </div>
      <div className="relative z-20 mx-auto w-full max-w-[1500px] bg-[#fbfaf7] lg:-mt-16">
        <div className="grid grid-cols-2 border-l border-t border-black/10 sm:flex sm:border-x-0 sm:border-y sm:px-6">
          {question.options.map((option) => {
            const isActive = selected === option.label;
            return <button type="button" key={option.label} onMouseEnter={() => setPreview(option.label)} onMouseLeave={() => setPreview(selected)} onFocus={() => setPreview(option.label)} onBlur={() => setPreview(selected)} onClick={() => onChoose(option.label)} className={`relative min-h-14 border-b border-r border-black/10 px-3 text-[9px] uppercase tracking-[0.13em] transition-colors sm:min-h-24 sm:flex-1 sm:border-0 sm:px-4 sm:text-[11px] sm:tracking-[0.16em] ${isActive ? "bg-[#171717] text-white sm:bg-transparent sm:text-black" : "text-[#888] hover:text-black"}`}><span className={`absolute inset-x-6 top-0 hidden h-px bg-black transition-transform duration-500 sm:block ${isActive ? "scale-x-100" : "scale-x-0"}`} />{option.display || option.label}</button>;
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
  return <div className="quiz-stage flex min-h-[calc(100svh-5rem)] flex-col bg-[#f5f3ef] px-5 pb-8 pt-9 sm:px-8 lg:px-10">
    <div className="flex items-center justify-between"><span className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</span><Progress step={step} /></div>
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-12 text-center">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[#777]">Your total trip budget</p>
      <h1 className="mx-auto mt-7 max-w-4xl text-[clamp(2.8rem,6vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.07em]">How much do you want to spend?</h1>
      <label className="mx-auto mt-12 flex max-w-3xl items-center justify-center border-b border-black pb-5">
        <span className="mr-3 font-serif text-[clamp(3rem,7vw,7rem)] font-light">$</span>
        <input aria-label="Exact trip budget" inputMode="numeric" autoComplete="off" value={formatted} onChange={(event) => onValueChange(event.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="4,500" className="min-w-0 w-[7ch] bg-transparent text-center font-serif text-[clamp(3rem,7vw,7rem)] font-light tracking-[-0.055em] outline-none placeholder:text-black/18" />
      </label>
      <p className="mt-12 text-[10px] uppercase tracking-[0.24em] text-[#777]">What should that include?</p>
      <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
        {Object.entries(budgetCategoryLabels).map(([key, label]) => <button type="button" key={key} aria-pressed={includes[key]} onClick={() => onToggle(key)} className={`min-h-12 border px-5 text-[9px] uppercase tracking-[0.17em] transition ${includes[key] ? "border-black bg-black text-white" : "border-black/20 bg-white/40 text-black/50 hover:border-black"}`}>{label}</button>)}
      </div>
      <p className="mt-5 text-xs text-black/40">Excluded items can still appear in your plan, but they will not count toward this budget.</p>
    </div>
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 border-t border-black/10 pt-7">
      <button type="button" onClick={onBack} className="min-h-12 text-xs uppercase tracking-[0.12em] text-[#666]">← Back</button>
      <button type="button" disabled={!valid} onClick={() => onContinue(budget)} className="min-h-14 bg-black px-8 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-25">Continue →</button>
    </div>
  </div>;
}

function AirportAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalized) return [];
    const ranked = airports
      .map((airport) => {
        const code = airport.code.toLowerCase();
        const city = airport.city.toLowerCase();
        const name = airport.name.toLowerCase();
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
  }, [normalized]);

  function choose(airport) {
    setQuery(`${airport.city || airport.name} (${airport.code})`);
    onChange(airport.code);
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
      className="w-full border border-black/20 bg-transparent px-5 py-4 text-base outline-none focus:border-black"
      type="text"
      inputMode="text"
      autoComplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open && matches.length > 0}
      aria-controls="airport-suggestions"
      placeholder="City, airport, or code"
      value={query}
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      onKeyDown={handleKeyDown}
      onChange={(event) => { setQuery(event.target.value); onChange(""); setOpen(true); setActiveIndex(0); }}
    />
    {open && normalized && <div id="airport-suggestions" role="listbox" className="absolute inset-x-0 top-full z-50 max-h-80 overflow-y-auto border-x border-b border-black/20 bg-[#fbfaf7] shadow-[0_18px_35px_rgba(0,0,0,0.12)]">
      {matches.length ? matches.map((airport, index) => <button
        key={`${airport.code}-${airport.name}`}
        type="button"
        role="option"
        aria-selected={index === activeIndex}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => choose(airport)}
        className={`flex w-full items-center justify-between gap-5 border-t border-black/10 px-5 py-3 text-left transition-colors first:border-t-0 ${index === activeIndex ? "bg-[#ebe8e2]" : "hover:bg-[#f2f0eb]"}`}
      >
        <span className="min-w-0"><strong className="block truncate text-sm font-medium text-black">{airport.city || airport.name}</strong><span className="mt-1 block truncate text-[10px] uppercase tracking-[0.1em] text-[#777]">{airport.name}{airport.country ? ` · ${airport.country}` : ""}</span></span>
        <span className="shrink-0 text-xs font-semibold tracking-[0.14em]">{airport.code}</span>
      </button>) : <p className="px-5 py-4 text-xs text-[#777]">No matching airport found.</p>}
    </div>}
  </div>;
}

function DiscoveryQuestion({ value, onChange, onBack, onContinue }) {
  const level = Number.isFinite(value) ? value : 50;
  const mood = level < 20 ? "Off the radar" : level < 40 ? "Less discovered" : level < 65 ? "A mix of both" : level < 85 ? "Well known" : "The classics";

  return <div className="quiz-stage flex min-h-[calc(100svh-5rem)] flex-col bg-[#f5f3ef] px-5 pb-8 pt-9 sm:px-8 lg:px-10">
    <div className="flex items-center justify-between"><span className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</span><Progress step={questions.length} /></div>
    <div className="mx-auto flex w-full max-w-[1450px] flex-1 flex-col justify-center py-14">
      <p className="text-center text-[10px] uppercase tracking-[0.23em] text-[#777]">How well known should it be?</p>
      <h1 className="mx-auto mt-8 max-w-5xl text-center text-[clamp(3.2rem,7.5vw,8.5rem)] font-medium leading-[0.86] tracking-[-0.075em]">{mood}</h1>
      <div className="mx-auto mt-16 w-full max-w-5xl sm:mt-24">
        <div className="relative h-24 sm:h-32">
          <div className="absolute inset-x-0 top-1/2 h-px bg-black/25" />
          <div className="absolute left-0 top-1/2 h-px bg-black transition-[width] duration-300" style={{ width: `${level}%` }} />
          <div className="pointer-events-none absolute top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-[#f5f3ef] shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-[left] duration-150 sm:h-20 sm:w-20" style={{ left: `${level}%` }}><span className="grid h-full place-items-center text-[10px] tabular-nums tracking-[0.15em]">{level}</span></div>
          <input aria-label="Destination familiarity" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" type="range" min="0" max="100" step="1" value={level} onInput={(event) => onChange(Number(event.currentTarget.value))} onChange={(event) => onChange(Number(event.currentTarget.value))} />
        </div>
        <div className="flex justify-between gap-8 border-t border-black/10 pt-5 text-[10px] uppercase tracking-[0.2em] text-[#666]"><span>Hidden places</span><span className="text-right">Iconic places</span></div>
      </div>
    </div>
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 border-t border-black/10 pt-7">
      <button type="button" onClick={onBack} className="min-h-12 text-xs uppercase tracking-[0.12em] text-[#666] hover:text-black">← Back</button>
      <button type="button" onClick={onContinue} className="min-h-14 bg-[#171717] px-8 text-xs font-semibold uppercase tracking-[0.12em] text-white">Set the course →</button>
    </div>
  </div>;
}

function DateQuestion({ answers, setAnswers, tripStart, tripEnd, isFlexible, setTripStart, setTripEnd, setIsFlexible, originAirport, setOriginAirport, guestCount, setGuestCount, onBack, onSubmit, canSubmit }) {
  const [mode, setMode] = useState(isFlexible ? "flexible" : "dates");
  const summary = questions.map((question) => question.options?.find((option) => option.label === answers[question.id])).filter(Boolean).map((option) => option.display || option.label).join(" / ");
  const seasons = [["Spring", "Mar – May", "Spring (Mar-May)"], ["Summer", "Jun – Aug", "Summer (Jun-Aug)"], ["Fall", "Sep – Nov", "Fall (Sep-Nov)"], ["Winter", "Dec – Feb", "Winter (Dec-Feb)"]];

  function selectMode(nextMode) {
    setMode(nextMode);
    setIsFlexible(nextMode === "flexible");
    if (nextMode === "flexible") { setTripStart(""); setTripEnd(""); }
  }

  return <form onSubmit={onSubmit} className="quiz-stage grid min-h-svh bg-[#f5f3ef] lg:grid-cols-2">
    <div className="flex min-h-svh flex-col px-5 pb-8 pt-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="flex items-center justify-between"><span className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</span><p className="text-[10px] uppercase tracking-[0.2em] text-[#777]">Trip details</p></div>
      <div className="flex flex-1 flex-col justify-center py-14 lg:py-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#777]">Final step</p>
        <h1 className="mt-6 max-w-xl text-[clamp(3.25rem,5.8vw,6.3rem)] font-medium leading-[0.9] tracking-[-0.075em]">When are you leaving?</h1>
        <p className="mt-5 text-lg text-[#8a847d]">Flexible dates are welcome.</p>
        <p className="mt-8 max-w-2xl border-l border-[#aaa39a] pl-6 text-[10px] uppercase leading-7 tracking-[0.18em] text-[#807970]">{summary}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label><span className="text-[10px] uppercase tracking-[0.15em] text-[#555]">Flying from <span className="text-[#999]">· optional</span></span><AirportAutocomplete value={originAirport} onChange={setOriginAirport} /></label>
          <label><span className="text-[10px] uppercase tracking-[0.15em] text-[#555]">Travelers</span><input className="mt-3 w-full border border-black/20 bg-transparent px-5 py-4 text-base outline-none focus:border-black" type="number" min="1" max="30" value={guestCount} onChange={(event) => setGuestCount(event.target.value)} required /></label>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => selectMode("dates")} className={`min-h-16 border px-4 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${mode === "dates" ? "border-black bg-[#171717] text-white" : "border-black/20 text-[#555] hover:border-black"}`}>I know my dates</button>
          <button type="button" onClick={() => selectMode("flexible")} className={`min-h-16 border px-4 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${mode === "flexible" ? "border-black bg-[#171717] text-white" : "border-black/20 text-[#555] hover:border-black"}`}>I’m flexible</button>
        </div>

        <div className="min-h-32">
          {mode === "dates" ? <div className="mt-9 grid gap-5 sm:grid-cols-2">
            <label><span className="text-[10px] uppercase tracking-[0.15em] text-[#555]">Depart</span><input className="mt-3 w-full border border-black/20 bg-transparent px-5 py-4 text-base outline-none focus:border-black" type="date" value={tripStart} onChange={(event) => setTripStart(event.target.value)} required /></label>
            <label><span className="text-[10px] uppercase tracking-[0.15em] text-[#555]">Return</span><input className="mt-3 w-full border border-black/20 bg-transparent px-5 py-4 text-base outline-none focus:border-black" min={tripStart} type="date" value={tripEnd} onChange={(event) => setTripEnd(event.target.value)} required /></label>
          </div> : <div className="mt-9 grid grid-cols-2 border-l border-t border-black/15">
            {seasons.map(([name, months, value]) => <button type="button" key={name} onClick={() => setAnswers((current) => ({ ...current, season: value }))} className={`min-h-20 border-b border-r border-black/15 px-4 text-left transition-colors ${answers.season === value ? "bg-[#171717] text-white" : "text-[#555] hover:text-black"}`}><strong className="block text-xs font-semibold uppercase tracking-[0.12em]">{name}</strong><span className={`mt-2 block text-[10px] uppercase tracking-[0.1em] ${answers.season === value ? "text-white/60" : "text-[#999]"}`}>{months}</span></button>)}
          </div>}
        </div>

        <div className="mt-10 flex items-center justify-between gap-6">
          <button type="button" onClick={onBack} className="min-h-12 text-xs uppercase tracking-[0.12em] text-[#666] hover:text-black">← Back</button>
          <button disabled={!canSubmit} type="submit" className="min-h-14 bg-[#171717] px-8 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-30">Reveal my trip</button>
        </div>
      </div>
    </div>
    <div className="relative hidden min-h-svh bg-[#ddd8d0] lg:block"><Image src="/results-feature.jpg" alt="A coastal villa beside clear blue water" fill priority className="object-cover" sizes="50vw" /></div>
  </form>;
}

export default function TravelQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [isFlexible, setIsFlexible] = useState(false);
  const [originAirport, setOriginAirport] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [discoveryLevel, setDiscoveryLevel] = useState(50);
  const [exactBudget, setExactBudget] = useState("");
  const [budgetIncludes, setBudgetIncludes] = useState({ flights: true, hotel: true, food: true, activities: true, transportation: true });
  const [phase, setPhase] = useState("idle");
  const timer = useRef(null);

  useEffect(() => { const onPop = (event) => { if (typeof event.state?.quizStep === "number") setStep(event.state.quizStep); }; window.addEventListener("popstate", onPop); window.history.replaceState({ ...window.history.state, quizStep: 0 }, ""); return () => { window.removeEventListener("popstate", onPop); window.clearTimeout(timer.current); }; }, []);

  const adaptiveQuestions = useMemo(() => questionsFor(answers), [answers]);
  const current = adaptiveQuestions[step];
  const canSubmit = useMemo(() => normalizeBudget(exactBudget) !== null && Object.values(budgetIncludes).some(Boolean) && ((isFlexible && Boolean(answers.season)) || (!isFlexible && Boolean(tripStart) && Boolean(tripEnd))), [answers.season, budgetIncludes, exactBudget, isFlexible, tripStart, tripEnd]);

  function go(next, direction = "forward") {
    setPhase(direction === "back" ? "leaving-back" : "leaving");
    timer.current = window.setTimeout(() => { setStep(next); window.history.pushState({ ...window.history.state, quizStep: next }, ""); setPhase("entering"); requestAnimationFrame(() => requestAnimationFrame(() => setPhase("idle"))); }, 280);
  }

  function choose(label) {
    if (step === 0) track("quiz_started");
    setAnswers((value) => ({ ...value, [current.id]: label }));
    timer.current = window.setTimeout(() => go(step + 1), 360);
  }

  function back() { if (step > 0) go(step - 1, "back"); }

  function continueDiscovery() {
    setAnswers((value) => ({ ...value, discovery: discoverySliderToUnknownness(discoveryLevel) }));
    go(step + 1);
  }

  function continueBudget(budget) {
    setAnswers((value) => ({ ...value, memory: legacyBudgetLabel(budget), exactBudget: budget, includedBudgetCategories: budgetIncludes }));
    go(step + 1);
  }

  function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    const budget = normalizeBudget(exactBudget);
    const completeAnswers = { ...answers, memory: legacyBudgetLabel(budget), exactBudget: budget, includedBudgetCategories: budgetIncludes };
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
      originAirport,
      guestCount,
      createdAt: Date.now(),
    }));
    track("quiz_completed", { setting: answers.alive || "unknown", duration: answers.duration || "unknown" });
    setPhase("complete");
    timer.current = window.setTimeout(() => window.location.assign("/thinking"), 850);
  }

  if (phase === "complete") return <div className="grid min-h-[calc(100svh-5rem)] place-items-center bg-[#f5f3ef] px-5"><p className="text-[clamp(3.5rem,8vw,8rem)] font-medium tracking-[-0.07em]">We found it.</p></div>;

  return <section id="quiz" className={`overflow-hidden bg-[#f5f3ef] text-[#171717] transition-[opacity,transform] duration-300 ease-out ${phase === "leaving" ? "-translate-y-2 opacity-0" : phase === "leaving-back" ? "translate-y-2 opacity-0" : phase === "entering" ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
    {step < adaptiveQuestions.length ? current.type === "budget" ? <BudgetQuestion value={exactBudget} includes={budgetIncludes} onValueChange={setExactBudget} onToggle={(key) => setBudgetIncludes((currentIncludes) => ({ ...currentIncludes, [key]: !currentIncludes[key] }))} onBack={back} onContinue={continueBudget} step={step} /> : <VisualQuestion question={current} value={answers[current.id]} onChoose={choose} step={step} /> : step === adaptiveQuestions.length ? <DiscoveryQuestion value={discoveryLevel} onChange={setDiscoveryLevel} onBack={back} onContinue={continueDiscovery} /> : <DateQuestion answers={answers} setAnswers={setAnswers} tripStart={tripStart} tripEnd={tripEnd} isFlexible={isFlexible} setTripStart={setTripStart} setTripEnd={setTripEnd} setIsFlexible={setIsFlexible} originAirport={originAirport} setOriginAirport={setOriginAirport} guestCount={guestCount} setGuestCount={setGuestCount} onBack={back} onSubmit={submit} canSubmit={canSubmit} />}
  </section>;
}

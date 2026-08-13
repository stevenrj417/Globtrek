"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import airports from "../data/airports.json";

const questions = [
  {
    id: "alive",
    question: "Where do you wanna be?",
    type: "visual",
    options: [
      { label: "Ocean", image: "/quiz/ocean.jpg", alt: "A woman overlooking a bright Mediterranean sea" },
      { label: "Mountains", image: "/quiz/mountains.jpg", alt: "A fashion portrait in a snowy mountain landscape" },
      { label: "Cities", image: "/quiz/cities.jpg", alt: "A black-and-white fashion portrait in Paris" },
      { label: "Road Trips", image: "/quiz/road-trips.jpg", alt: "An open road through a dramatic desert landscape" },
      { label: "Culture", image: "/quiz/culture.jpg", alt: "A quiet tree-lined street in Kyoto" },
      { label: "Surprise Me", image: "/quiz/surprise-me.jpg", alt: "Rio de Janeiro seen from above" },
    ],
  },
  {
    id: "escape",
    question: "How should it feel?",
    type: "visual",
    options: [
      { label: "Slow mornings", image: "/quiz/slow-mornings.jpg", alt: "A beautiful slow morning with coffee" },
      { label: "Balanced days", image: "/quiz/balanced-days.jpg", alt: "A calm open road beneath a wide sky" },
      { label: "Packed schedule", image: "/quiz/packed-schedule.jpg", alt: "A vibrant city seen from above" },
      { label: "Mostly relaxing", image: "/quiz/mostly-relaxing.jpg", alt: "Clear water and a quiet tropical beach" },
      { label: "Adventure days", image: "/quiz/adventure-days.jpg", alt: "A hiker overlooking dramatic mountains" },
      { label: "Surprise me", image: "/quiz/surprise-pace.jpg", alt: "Travelers laughing together in the sun" },
    ],
  },
  {
    id: "self",
    question: "Who’s coming?",
    type: "visual",
    options: [
      { label: "Solo", display: "Just me", image: "/quiz/solo.jpg", alt: "A solo traveler on an open road" },
      { label: "Couple", display: "Two of us", image: "/quiz/couple.jpg", alt: "A couple traveling together" },
      { label: "Friends", image: "/quiz/friends.jpg", alt: "Friends sharing a memorable trip" },
      { label: "Family", image: "/quiz/family.jpg", alt: "A family enjoying time together" },
      { label: "Honeymoon", image: "/quiz/honeymoon.jpg", alt: "Newlyweds in an elegant destination" },
      { label: "Not sure", image: "/quiz/not-sure-who.jpg", alt: "A stylish traveler ready for anywhere" },
    ],
  },
  {
    id: "hotel",
    question: "Where are you staying?",
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
    question: "What matters most?",
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
  {
    id: "memory",
    question: "What are we spending?",
    type: "visual",
    options: [
      { label: "Smart value", image: "/quiz/smart-value.jpg", alt: "A beautiful affordable tropical stay" },
      { label: "Comfortable", image: "/quiz/comfortable.jpg", alt: "A comfortable resort pool and terrace" },
      { label: "Premium", image: "/quiz/premium.jpg", alt: "A refined contemporary hotel interior" },
      { label: "Blowout", image: "/quiz/blowout.jpg", alt: "A spectacular luxury hotel" },
      { label: "Mixed", image: "/quiz/mixed.jpg", alt: "An elegant hotel room with a view" },
      { label: "Not sure", image: "/quiz/not-sure-budget.jpg", alt: "A stylish traveler considering the possibilities" },
    ],
  },
  {
    id: "length",
    question: "How long are you gone?",
    type: "visual",
    options: [
      { label: "Long Weekend", display: "A long weekend", image: "/quiz/long-weekend.jpg", alt: "Paris for a long city weekend" },
      { label: "Five Nights", display: "Five nights", image: "/quiz/five-nights.jpg", alt: "A five-night escape on the Amalfi Coast" },
      { label: "One Week", display: "A week", image: "/quiz/one-week.jpg", alt: "A week exploring Kyoto" },
      { label: "Ten Days", display: "Ten days", image: "/quiz/ten-days.jpg", alt: "A ten-day mountain journey" },
      { label: "Two Weeks", display: "Two weeks", image: "/quiz/two-weeks.jpg", alt: "A long road trip beneath a vast sky" },
      { label: "Open-Ended", display: "Open-ended", image: "/quiz/open-ended.jpg", alt: "Rio de Janeiro and an open-ended adventure" },
    ],
  },
];

const totalSteps = questions.length + 1;

function Progress({ step }) {
  return <p className="text-[10px] font-medium tabular-nums tracking-[0.2em] text-[#777]">{String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</p>;
}

function VisualQuestion({ question, value, onChoose }) {
  const selected = value || question.options[0].label;
  const [preview, setPreview] = useState(selected);

  const active = question.options.find((option) => option.label === preview) || question.options[0];

  return (
    <div className="quiz-stage grid min-h-[calc(100svh-5rem)] grid-rows-[auto_1fr_auto] px-5 pb-6 pt-9 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between"><span className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</span><Progress step={questions.indexOf(question)} /></div>
      <div className="grid items-center gap-9 py-8 lg:grid-cols-[30%_70%] lg:gap-0 lg:py-8">
        <div className="relative z-10 lg:pr-12">
          <p className="mb-6 text-[10px] uppercase tracking-[0.23em] text-[#777]">The GlobTrek quiz</p>
          <h1 className="max-w-md text-[2.25rem] font-medium leading-[0.94] tracking-[-0.065em] sm:text-[clamp(2.7rem,5.2vw,5.6rem)]">{question.question}</h1>
        </div>
        <div className="relative aspect-[4/3] min-h-[360px] overflow-hidden bg-[#e8e6e1] lg:aspect-auto lg:h-[min(69vh,760px)]">
          {question.options.map((option) => (
            <Image key={option.label} src={option.image} alt={option.label === active.label ? option.alt : ""} fill priority={option.label === selected} className={`object-cover transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] ${option.label === active.label ? "scale-100 opacity-100" : "pointer-events-none scale-[1.012] opacity-0"}`} sizes="(min-width:1024px) 70vw, 100vw" />
          ))}
        </div>
      </div>
      <div className="relative z-20 mx-auto -mt-5 w-full max-w-[1500px] bg-[#fbfaf7] lg:-mt-16">
        <div className="flex snap-x overflow-x-auto border-y border-black/10 px-4 sm:justify-center sm:px-6">
          {question.options.map((option) => {
            const isActive = selected === option.label;
            return <button type="button" key={option.label} onMouseEnter={() => setPreview(option.label)} onMouseLeave={() => setPreview(selected)} onFocus={() => setPreview(option.label)} onBlur={() => setPreview(selected)} onClick={() => onChoose(option.label)} className={`relative min-h-20 shrink-0 snap-center px-6 text-[11px] uppercase tracking-[0.16em] transition-colors sm:min-h-24 sm:flex-1 sm:px-4 ${isActive ? "text-black" : "text-[#888] hover:text-black"}`}><span className={`absolute inset-x-6 top-0 h-px bg-black transition-transform duration-500 ${isActive ? "scale-x-100" : "scale-x-0"}`} />{option.display || option.label}</button>;
          })}
        </div>
      </div>
    </div>
  );
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

function DateQuestion({ answers, setAnswers, tripStart, tripEnd, isFlexible, setTripStart, setTripEnd, setIsFlexible, originAirport, setOriginAirport, guestCount, setGuestCount, onBack, onSubmit, canSubmit }) {
  const [mode, setMode] = useState(isFlexible ? "flexible" : "dates");
  const summary = questions.map((question) => answers[question.id]).filter(Boolean).join(" / ");
  const seasons = [["Spring", "Mar – May", "Spring (Mar-May)"], ["Summer", "Jun – Aug", "Summer (Jun-Aug)"], ["Fall", "Sep – Nov", "Fall (Sep-Nov)"], ["Winter", "Dec – Feb", "Winter (Dec-Feb)"]];

  function selectMode(nextMode) {
    setMode(nextMode);
    setIsFlexible(nextMode === "flexible");
    if (nextMode === "flexible") { setTripStart(""); setTripEnd(""); }
  }

  return <form onSubmit={onSubmit} className="quiz-stage grid min-h-svh bg-[#f5f3ef] lg:grid-cols-2">
    <div className="flex min-h-svh flex-col px-5 pb-8 pt-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="flex items-center justify-between"><span className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</span><Progress step={questions.length} /></div>
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
    <div className="relative min-h-[48svh] bg-[#ddd8d0] lg:min-h-svh"><Image src="/results-feature.jpg" alt="A coastal villa beside clear blue water" fill priority className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" /></div>
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
  const [phase, setPhase] = useState("idle");
  const timer = useRef(null);

  useEffect(() => { const onPop = (event) => { if (typeof event.state?.quizStep === "number") setStep(event.state.quizStep); }; window.addEventListener("popstate", onPop); window.history.replaceState({ ...window.history.state, quizStep: 0 }, ""); return () => { window.removeEventListener("popstate", onPop); window.clearTimeout(timer.current); }; }, []);

  const current = questions[step];
  const canSubmit = useMemo(() => (isFlexible && Boolean(answers.season)) || (!isFlexible && Boolean(tripStart) && Boolean(tripEnd)), [answers.season, isFlexible, tripStart, tripEnd]);

  function go(next, direction = "forward") {
    setPhase(direction === "back" ? "leaving-back" : "leaving");
    timer.current = window.setTimeout(() => { setStep(next); window.history.pushState({ ...window.history.state, quizStep: next }, ""); setPhase("entering"); requestAnimationFrame(() => requestAnimationFrame(() => setPhase("idle"))); }, 280);
  }

  function choose(label) {
    setAnswers((value) => ({ ...value, [current.id]: label }));
    timer.current = window.setTimeout(() => go(step + 1), 360);
  }

  function back() { if (step > 0) go(step - 1, "back"); }

  function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    window.localStorage.setItem("globtrekQuiz", JSON.stringify({ answers, tripStart, tripEnd, isFlexible, originAirport, guestCount, createdAt: Date.now() }));
    setPhase("complete");
    timer.current = window.setTimeout(() => window.location.assign("/thinking"), 850);
  }

  if (phase === "complete") return <div className="grid min-h-[calc(100svh-5rem)] place-items-center bg-[#f5f3ef] px-5"><p className="text-[clamp(3.5rem,8vw,8rem)] font-medium tracking-[-0.07em]">We found it.</p></div>;

  return <section id="quiz" className={`overflow-hidden bg-[#f5f3ef] text-[#171717] transition-[opacity,transform] duration-300 ease-out ${phase === "leaving" ? "-translate-y-2 opacity-0" : phase === "leaving-back" ? "translate-y-2 opacity-0" : phase === "entering" ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
    {step < questions.length ? <VisualQuestion question={current} value={answers[current.id]} onChoose={choose} /> : <DateQuestion answers={answers} setAnswers={setAnswers} tripStart={tripStart} tripEnd={tripEnd} isFlexible={isFlexible} setTripStart={setTripStart} setTripEnd={setTripEnd} setIsFlexible={setIsFlexible} originAirport={originAirport} setOriginAirport={setOriginAirport} guestCount={guestCount} setGuestCount={setGuestCount} onBack={back} onSubmit={submit} canSubmit={canSubmit} />}
  </section>;
}

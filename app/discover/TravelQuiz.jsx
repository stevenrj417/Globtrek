"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const questions = [
  {
    id: "alive",
    question: "Where do you wanna be?",
    type: "visual",
    options: [
      { label: "Ocean", image: "/luxury-coast.jpg", alt: "A woman overlooking a bright Mediterranean sea" },
      { label: "Mountains", image: "/luxury-snow.jpg", alt: "A fashion portrait in a snowy mountain landscape" },
      { label: "Cities", image: "/luxury-paris-bw.jpg", alt: "A black-and-white fashion portrait in Paris" },
      { label: "Road Trips", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee", alt: "An open road through a dramatic desert landscape" },
      { label: "Culture", image: "/kyoto-feature.jpg", alt: "A quiet tree-lined street in Kyoto" },
      { label: "Surprise Me", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325", alt: "Rio de Janeiro seen from above" },
    ],
  },
  {
    id: "escape",
    question: "How should it feel?",
    type: "text",
    options: [
      { label: "Slow mornings" }, { label: "Balanced days" }, { label: "Packed schedule" },
      { label: "Mostly relaxing" }, { label: "Adventure days" }, { label: "Surprise me" },
    ],
  },
  {
    id: "self",
    question: "Who’s coming?",
    type: "text",
    options: [
      { label: "Solo", display: "Just me" }, { label: "Couple", display: "Two of us" },
      { label: "Friends" }, { label: "Family" }, { label: "Honeymoon" }, { label: "Not sure" },
    ],
  },
  {
    id: "hotel",
    question: "Where are you staying?",
    type: "visual",
    options: [
      { label: "Boutique hotel", image: "/luxury-paris-bw.jpg", alt: "Editorial city style in Paris" },
      { label: "Beach resort", image: "/luxury-coast.jpg", alt: "White architecture beside the sea" },
      { label: "Mountain lodge", image: "/banff-feature.jpg", alt: "A grand mountain hotel in Banff" },
      { label: "Private villa", image: "https://images.unsplash.com/photo-1494526585095-c41746248156", alt: "A private villa surrounded by greenery" },
      { label: "Design hotel", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", alt: "A minimal contemporary hotel interior" },
      { label: "Traditional inn", image: "/kyoto-feature.jpg", alt: "A traditional inn on a quiet Kyoto street" },
    ],
  },
  {
    id: "luxury",
    question: "What matters most?",
    type: "visual",
    options: [
      { label: "Food", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0", alt: "A considered restaurant table" },
      { label: "Nature", image: "/luxury-snow.jpg", alt: "Snowy mountains in clear light" },
      { label: "Culture", image: "/kyoto-feature.jpg", alt: "A quiet Kyoto street" },
      { label: "Nightlife", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819", alt: "A crowd beneath city lights" },
      { label: "Wellness", image: "/luxury-coast.jpg", alt: "A calm coastal setting" },
      { label: "Shopping", image: "/luxury-paris-bw.jpg", alt: "Editorial fashion in Paris" },
    ],
  },
  {
    id: "memory",
    question: "What are we spending?",
    type: "text",
    options: [
      { label: "Smart value" }, { label: "Comfortable" }, { label: "Premium" },
      { label: "Blowout" }, { label: "Mixed" }, { label: "Not sure" },
    ],
  },
  {
    id: "length",
    question: "How long are you gone?",
    type: "text",
    options: [
      { label: "Long Weekend", display: "A long weekend" }, { label: "Five Nights", display: "Five nights" },
      { label: "One Week", display: "A week" }, { label: "Ten Days", display: "Ten days" },
      { label: "Two Weeks", display: "Two weeks" }, { label: "Open-Ended", display: "Open-ended" },
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

function TextQuestion({ question, value, step, onChoose, onBack }) {
  return (
    <div className="quiz-stage flex min-h-[calc(100svh-5rem)] flex-col px-5 pb-10 pt-9 sm:px-10 lg:px-16">
      <div className="flex items-center justify-between"><span className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</span><Progress step={step} /></div>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-16">
        <h1 className="max-w-5xl text-[clamp(3.6rem,8vw,8.5rem)] font-medium leading-[0.88] tracking-[-0.075em]">{question.question}</h1>
        <div className="mt-14 border-t border-black/15">
          {question.options.map((option, index) => <button type="button" key={option.label} onClick={() => onChoose(option.label)} className={`group flex min-h-16 w-full items-center justify-between border-b border-black/15 py-4 text-left text-xl transition-colors sm:min-h-20 sm:text-3xl ${value === option.label ? "text-black" : "text-[#777] hover:text-black"}`}><span><span className="mr-5 text-[10px] tabular-nums text-[#999]">{String(index + 1).padStart(2, "0")}</span>{option.display || option.label}</span><span aria-hidden="true" className={`text-lg transition-transform ${value === option.label ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}>→</span></button>)}
        </div>
      </div>
      <button type="button" onClick={onBack} className="min-h-11 w-fit text-xs text-[#777] underline decoration-black/20 hover:text-black">Back</button>
    </div>
  );
}

function DateQuestion({ answers, setAnswers, tripStart, tripEnd, isFlexible, setTripStart, setTripEnd, setIsFlexible, onBack, onSubmit, canSubmit }) {
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
    window.localStorage.setItem("globtrekQuiz", JSON.stringify({ answers, tripStart, tripEnd, isFlexible, createdAt: Date.now() }));
    setPhase("complete");
    timer.current = window.setTimeout(() => window.location.assign("/thinking"), 850);
  }

  if (phase === "complete") return <div className="grid min-h-[calc(100svh-5rem)] place-items-center bg-[#f5f3ef] px-5"><p className="text-[clamp(3.5rem,8vw,8rem)] font-medium tracking-[-0.07em]">We found it.</p></div>;

  return <section id="quiz" className={`overflow-hidden bg-[#f5f3ef] text-[#171717] transition-[opacity,transform] duration-300 ease-out ${phase === "leaving" ? "-translate-y-2 opacity-0" : phase === "leaving-back" ? "translate-y-2 opacity-0" : phase === "entering" ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
    {step < questions.length ? current.type === "visual" ? <VisualQuestion question={current} value={answers[current.id]} onChoose={choose} /> : <TextQuestion question={current} value={answers[current.id]} step={step} onChoose={choose} onBack={back} /> : <DateQuestion answers={answers} setAnswers={setAnswers} tripStart={tripStart} tripEnd={tripEnd} isFlexible={isFlexible} setTripStart={setTripStart} setTripEnd={setTripEnd} setIsFlexible={setIsFlexible} onBack={back} onSubmit={submit} canSubmit={canSubmit} />}
  </section>;
}

"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { roadTripQuestions } from "../../data/roadTripQuiz";
import { roadTripDiscovery } from "../../data/journeyDiscovery";
import { StartingLocationField } from "../../components/StartingLocationField";

const landscapeImages = {
  Coastline: "/quiz/ocean.jpg", Forest: "/quiz/nature.jpg", Mountains: "/quiz/mountains.jpg",
  Desert: "/quiz/road-trips.jpg", Countryside: "/provence-hero-v2.jpg", Lakes: "/banff-feature.jpg", Cities: "/quiz/cities.jpg",
};
const journeyImages = {
  "Slow scenic journey": "/quiz/slow-mornings.jpg", "Adventure route": "/quiz/adventure-days.jpg",
  "Food and culture": "/quiz/food.jpg", "National parks": "/quiz/nature.jpg",
  "Luxury escape": "/quiz/premium.jpg", "Hidden places": "/quiz/surprise-me.jpg",
};
const distanceNotes = {
  "Weekend Escape": "1–3 days", "Regional Adventure": "300–700 miles",
  "Big Journey": "1,000+ miles", "Cross Country": "2,000+ miles",
};

function Choice({ option, selected, onClick, image, note }) {
  if (image) return <button type="button" aria-pressed={selected} onClick={onClick} className={`group overflow-hidden border bg-[#f4f1eb] text-center transition ${selected ? "border-black" : "border-black/14 hover:border-black/45"}`}>
    <span className="relative block aspect-[5/3] overflow-hidden bg-black/5"><Image src={image} alt="" fill sizes="(min-width:1024px) 28vw, (min-width:640px) 46vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" /></span>
    <span className="flex min-h-16 items-center justify-center gap-3 px-4 py-4 text-sm text-black"><span>{option}</span><span className="text-[10px]" aria-hidden="true">{selected ? "●" : "○"}</span></span>
  </button>;
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`grid min-h-24 place-items-center border px-5 py-5 text-center transition ${selected ? "border-black bg-black text-white" : "border-black/14 text-black hover:border-black/50"}`}><span><span className="block text-lg sm:text-xl">{option}</span>{note ? <span className={`mt-2 block text-xs ${selected ? "text-white/70" : "text-black/48"}`}>{note}</span> : null}</span></button>;
}

export function RoadTripQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedJourney = roadTripDiscovery.find((item) => item.id === searchParams.get("journey")) || null;
  const fullQuestions = [{ id: "origin", eyebrow: "The beginning", title: "Where are you leaving from?", options: [] }, ...roadTripQuestions];
  const miniQuestions = [
    { id: "origin", eyebrow: "The beginning", title: "Where are you leaving from?", options: [] },
    { id: "duration", eyebrow: "The time", title: "How long do you have?", options: ["3–5 days", "6–8 days", "9–14 days", "15+ days"] },
    { id: "budget", eyebrow: "The budget", title: "What should the whole journey fit?", options: [] },
    { id: "travelers", eyebrow: "The company", title: "Who is coming along?", options: ["Solo", "Couple", "Friends", "Family"] },
    { id: "style", eyebrow: "The journey", title: "How should the road feel?", options: ["Scenic and slow", "Balanced", "Maximum exploring"] },
    { id: "driving", eyebrow: "The rhythm", title: "How do you like to drive?", options: ["Short drives, more stops", "Balanced", "Long driving days"] },
  ];
  const questions = selectedJourney ? miniQuestions : fullQuestions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [transitioning, setTransitioning] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const transitionTimer = useRef(null);
  const question = questions[step];
  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  function finish(finalAnswers) {
    const payload = { ...finalAnswers, ...(finalAnswers.style ? { kind: finalAnswers.style === "Scenic and slow" ? "Slow scenic journey" : finalAnswers.style === "Maximum exploring" ? "Adventure route" : "Food and culture" } : {}), requestedRouteId: selectedJourney?.id || null, version: 2, createdAt: new Date().toISOString() };
    window.localStorage.setItem("globtrekRoadTripQuiz", JSON.stringify(payload));
    track("road_trip_quiz_completed", { landscape: payload.landscape, distance: payload.distance, kind: payload.kind, budget: Number(payload.budget) });
    setFinishing(true);
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => router.push("/road-trips/results"), 650);
  }
  function advance(finalAnswers) {
    if (transitioning) return;
    setTransitioning(true);
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      if (step < questions.length - 1) {
        setStep((current) => current + 1);
        setTransitioning(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else finish(finalAnswers);
    }, 280);
  }
  function choose(option) {
    const nextAnswers = { ...answers, [question.id]: option };
    setAnswers(nextAnswers);
    advance(nextAnswers);
  }
  function chooseOrigin(originDetails) {
    const nextAnswers = { ...answers, originDetails };
    setAnswers(nextAnswers);
    if (originDetails?.city && originDetails?.countryCode && Number.isFinite(originDetails?.latitude) && Number.isFinite(originDetails?.longitude)) advance(nextAnswers);
  }
  function submitBudget(event) {
    event.preventDefault();
    if (Number(answers.budget) >= 500) advance(answers);
  }
  function goBack() {
    window.clearTimeout(transitionTimer.current);
    setTransitioning(false);
    if (step) setStep((current) => current - 1);
    else router.push("/road-trips");
  }

  const selected = answers[question.id];
  const visual = question.id === "landscape" || question.id === "kind";
  if (finishing) return <section className="grid min-h-[calc(100svh-8rem)] place-items-center px-6 text-center" aria-live="polite"><div className="mx-auto max-w-xl"><p className="text-[10px] uppercase tracking-[0.2em] text-black/50">Road discovery</p><h1 className="mt-6 font-serif text-[clamp(2.9rem,5.5vw,5.4rem)] leading-[.9] tracking-[-0.05em]">Building your journey.</h1><div role="progressbar" aria-label="Building your road-trip results" className="mx-auto mt-10 h-px w-36 overflow-hidden bg-black/15"><span className="block h-full w-1/2 animate-pulse bg-black" /></div></div></section>;
  return <section className="min-h-[calc(100svh-8rem)] px-5 py-10 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-[1320px]">
      <div className="relative grid min-h-10 place-items-center border-b border-black/12 pb-5 text-[10px] uppercase tracking-[0.18em] text-black/50"><button type="button" onClick={goBack} aria-label="Go back" className="absolute left-0 top-0 text-black">← Back</button><span className="text-center">{selectedJourney ? selectedJourney.name : "Road discovery"} · {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span></div>
      <div className={`mx-auto max-w-[1100px] pt-12 text-center transition duration-300 sm:pt-16 ${transitioning ? "translate-y-1 opacity-55" : "opacity-100"}`}>
        <p className="text-[10px] uppercase tracking-[0.22em] text-black/50">{question.eyebrow}</p>
        <h1 className="mx-auto mt-5 max-w-4xl font-serif text-[clamp(2.9rem,5.4vw,5.8rem)] leading-[.9] tracking-[-0.05em]">{question.title}</h1>
        {question.id === "budget" ? <form onSubmit={submitBudget} className="mx-auto mt-12 max-w-2xl text-center sm:mt-16">
          <label className="block text-[10px] uppercase tracking-[0.18em] text-black/50" htmlFor="road-budget">Total trip budget · USD</label>
          <div className="mx-auto mt-5 flex max-w-xl items-baseline justify-center border-b border-black/35 pb-4"><span className="font-serif text-4xl text-black/45 sm:text-5xl">$</span><input id="road-budget" type="text" inputMode="numeric" pattern="[0-9]*" autoFocus value={answers.budget || ""} onChange={(event) => setAnswers((current) => ({ ...current, budget: event.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="4,000" className="min-w-0 max-w-[12rem] appearance-none border-0 bg-transparent px-3 text-center font-serif text-5xl tracking-[-0.05em] outline-none ring-0 placeholder:text-black/20 focus:outline-none focus:ring-0 sm:max-w-xs sm:text-7xl" /></div>
          <p className="mx-auto mt-5 max-w-md text-xs leading-6 text-black/50">Stays, food, experiences, and the road. Estimates are not live prices.</p><button type="submit" disabled={Number(answers.budget) < 500 || transitioning} className="mt-7 min-h-12 bg-black px-7 text-[10px] uppercase tracking-[0.12em] text-white disabled:opacity-25">Reveal route →</button>
        </form> : question.id === "origin" ? <div className="mx-auto mt-12 max-w-2xl text-center sm:mt-16"><p className="text-[10px] uppercase tracking-[0.18em] text-black/50">Starting point</p><div className="mt-3"><StartingLocationField centered id="road-origin" value={answers.originDetails} onChange={chooseOrigin} placeholder="City, address, or region" /></div><p className="mt-5 text-xs text-black/50">Choose a result to continue.</p></div> : <div className={`mx-auto mt-12 sm:mt-16 ${visual ? "grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid max-w-3xl gap-3 sm:grid-cols-2"}`}>
          {question.options.map((option) => <Choice key={option} option={option} selected={selected === option} onClick={() => choose(option)} image={question.id === "landscape" ? landscapeImages[option] : question.id === "kind" ? journeyImages[option] : null} note={question.id === "distance" ? distanceNotes[option] : null} />)}
        </div>}
      </div>
    </div>
  </section>;
}

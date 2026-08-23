"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
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
  if (image) return <button type="button" aria-pressed={selected} onClick={onClick} className={`group relative min-h-48 overflow-hidden text-left sm:min-h-60 ${selected ? "ring-2 ring-[#9b7b43] ring-offset-4 ring-offset-[#f4f1eb]" : ""}`}>
    <Image src={image} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" />
    <span className="absolute inset-0 bg-gradient-to-t from-black/68 via-transparent to-transparent" />
    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 text-sm text-white"><span>{option}</span><span aria-hidden="true">{selected ? "●" : "○"}</span></span>
  </button>;
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-20 items-center justify-between border-b px-1 py-4 text-left transition sm:min-h-24 ${selected ? "border-[#9b7b43] text-black" : "border-black/16 text-black/58 hover:border-black/50 hover:text-black"}`}><span><span className="block text-lg sm:text-xl">{option}</span>{note ? <span className="mt-1 block text-xs text-black/42">{note}</span> : null}</span><span className="text-sm" aria-hidden="true">{selected ? "●" : "○"}</span></button>;
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
  const transitionTimer = useRef(null);
  const question = questions[step];

  function finish(finalAnswers) {
    const payload = { ...finalAnswers, ...(finalAnswers.style ? { kind: finalAnswers.style === "Scenic and slow" ? "Slow scenic journey" : finalAnswers.style === "Maximum exploring" ? "Adventure route" : "Food and culture" } : {}), requestedRouteId: selectedJourney?.id || null, version: 2, createdAt: new Date().toISOString() };
    window.localStorage.setItem("globtrekRoadTripQuiz", JSON.stringify(payload));
    track("road_trip_quiz_completed", { landscape: payload.landscape, distance: payload.distance, kind: payload.kind, budget: Number(payload.budget) });
    router.push("/road-trips/results");
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
  return <section className="min-h-[calc(100svh-8rem)] px-5 py-10 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-[1320px]">
      <div className="flex items-center justify-between border-b border-black/12 pb-5 text-[10px] uppercase tracking-[0.18em] text-black/45"><button type="button" onClick={goBack} className="text-black/65">← Back</button><span>{selectedJourney ? selectedJourney.name : "Road discovery"} · {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span></div>
      <div className={`pt-12 transition duration-300 sm:pt-16 ${transitioning ? "translate-y-1 opacity-55" : "opacity-100"}`}>
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a6b36]">{question.eyebrow}</p>
        <h1 className="mt-5 max-w-5xl font-serif text-[clamp(3.2rem,6.2vw,7rem)] leading-[.87] tracking-[-0.055em]">{question.title}</h1>
        {question.id === "budget" ? <form onSubmit={submitBudget} className="mt-14 max-w-2xl sm:mt-20">
          <label className="block text-[10px] uppercase tracking-[0.18em] text-black/45" htmlFor="road-budget">Total trip budget · USD</label>
          <div className="mt-4 flex items-baseline border-b border-black/35 pb-4"><span className="font-serif text-4xl text-black/40 sm:text-6xl">$</span><input id="road-budget" type="number" inputMode="numeric" min="500" max="250000" step="100" autoFocus value={answers.budget || ""} onChange={(event) => setAnswers((current) => ({ ...current, budget: event.target.value }))} placeholder="4,000" className="min-w-0 flex-1 bg-transparent px-3 font-serif text-5xl tracking-[-0.05em] outline-none placeholder:text-black/18 sm:text-8xl" /></div>
          <div className="mt-5 flex items-center justify-between gap-6 text-xs text-black/45"><span>Stays, food, experiences, and the road. Estimates are not live prices.</span><button type="submit" disabled={Number(answers.budget) < 500 || transitioning} className="shrink-0 uppercase tracking-[0.12em] text-black disabled:opacity-25">Reveal route →</button></div>
        </form> : question.id === "origin" ? <div className="mt-14 max-w-2xl sm:mt-20"><p className="text-[10px] uppercase tracking-[0.18em] text-black/45">Starting point</p><StartingLocationField id="road-origin" value={answers.originDetails} onChange={chooseOrigin} placeholder="City, address, or region" /><p className="mt-5 text-xs text-black/42">Choose a result to continue.</p></div> : <div className={`mt-12 sm:mt-16 ${visual ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid max-w-4xl gap-x-10 sm:grid-cols-2"}`}>
          {question.options.map((option) => <Choice key={option} option={option} selected={selected === option} onClick={() => choose(option)} image={question.id === "landscape" ? landscapeImages[option] : question.id === "kind" ? journeyImages[option] : null} note={question.id === "distance" ? distanceNotes[option] : null} />)}
        </div>}
      </div>
    </div>
  </section>;
}

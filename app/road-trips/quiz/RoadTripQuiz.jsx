"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@vercel/analytics";
import { roadTripQuestions } from "../../data/roadTripQuiz";

const landscapeImages = {
  Coastline: "/quiz/ocean.jpg", Forest: "/quiz/nature.jpg", Mountains: "/quiz/mountains.jpg",
  Desert: "/quiz/road-trips.jpg", Countryside: "/quiz/balanced-days.jpg", Lakes: "/banff-feature.jpg", Cities: "/quiz/cities.jpg",
};

function Choice({ option, selected, onClick, visual }) {
  if (visual) return <button type="button" aria-pressed={selected} onClick={onClick} className={`group relative min-h-48 overflow-hidden text-left sm:min-h-64 ${selected ? "ring-2 ring-[#9b7b43] ring-offset-4 ring-offset-[#f4f1eb]" : ""}`}>
    <Image src={landscapeImages[option]} alt="" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" />
    <span className="absolute inset-0 bg-gradient-to-t from-black/68 via-transparent to-transparent" />
    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 text-sm text-white"><span>{option}</span><span aria-hidden="true">{selected ? "●" : "○"}</span></span>
  </button>;
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-16 items-center justify-between border-b px-1 text-left text-lg transition sm:min-h-20 sm:text-xl ${selected ? "border-[#9b7b43] text-black" : "border-black/16 text-black/58 hover:border-black/50 hover:text-black"}`}><span>{option}</span><span className="text-sm" aria-hidden="true">{selected ? "●" : "○"}</span></button>;
}

export function RoadTripQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const question = roadTripQuestions[step];
  const selected = answers[question.id];
  const ready = question.id === "budget" ? Number(answers.budget) >= 500 : Boolean(selected && (selected !== "Custom distance" || Number(answers.customDistance) >= 50));

  function choose(option) { setAnswers((current) => ({ ...current, [question.id]: option })); }
  function next() {
    if (!ready) return;
    if (step < roadTripQuestions.length - 1) { setStep((current) => current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const payload = { ...answers, version: 1, createdAt: new Date().toISOString() };
    window.localStorage.setItem("globtrekRoadTripQuiz", JSON.stringify(payload));
    track("road_trip_quiz_completed", { landscape: payload.landscape, distance: payload.distance, kind: payload.kind, budget: Number(payload.budget) });
    router.push("/road-trips/results");
  }

  return <section className="min-h-[calc(100svh-8rem)] px-5 py-10 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-[1320px]">
      <div className="flex items-center justify-between border-b border-black/12 pb-5 text-[10px] uppercase tracking-[0.18em] text-black/45"><button type="button" onClick={() => step ? setStep(step - 1) : router.push("/road-trips")} className="text-black/65">← Back</button><span>{String(step + 1).padStart(2, "0")} / {String(roadTripQuestions.length).padStart(2, "0")}</span></div>
      <div className="pt-12 sm:pt-16">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a6b36]">{question.eyebrow}</p>
        <h1 className="mt-5 max-w-5xl font-serif text-[clamp(3.2rem,6.2vw,7rem)] leading-[.87] tracking-[-0.055em]">{question.title}</h1>
        {question.id === "budget" ? <div className="mt-14 max-w-2xl sm:mt-20">
          <label className="block text-[10px] uppercase tracking-[0.18em] text-black/45" htmlFor="road-budget">Total trip budget · USD</label>
          <div className="mt-4 flex items-baseline border-b border-black/35 pb-4"><span className="font-serif text-4xl text-black/40 sm:text-6xl">$</span><input id="road-budget" type="number" inputMode="numeric" min="500" max="250000" step="100" autoFocus value={answers.budget || ""} onChange={(event) => setAnswers((current) => ({ ...current, budget: event.target.value }))} placeholder="4,000" className="min-w-0 flex-1 bg-transparent px-3 font-serif text-5xl tracking-[-0.05em] outline-none placeholder:text-black/18 sm:text-8xl" /></div>
          <p className="mt-5 text-sm text-black/48">Stays, food, experiences, and the road. Planning estimates—not live prices.</p>
        </div> : <div className={`mt-12 sm:mt-16 ${question.id === "landscape" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid max-w-4xl gap-x-10 sm:grid-cols-2"}`}>
          {question.options.map((option) => <Choice key={option} option={option} selected={selected === option} onClick={() => choose(option)} visual={question.id === "landscape"} />)}
        </div>}
        {question.id === "distance" && selected === "Custom distance" ? <label className="mt-9 block max-w-sm text-[10px] uppercase tracking-[0.18em] text-black/45">Distance in miles<input autoFocus type="number" min="50" max="10000" step="50" value={answers.customDistance || ""} onChange={(event) => setAnswers((current) => ({ ...current, customDistance: event.target.value }))} className="mt-3 w-full border-b border-black/35 bg-transparent py-3 font-serif text-4xl text-black outline-none" /></label> : null}
      </div>
      <div className="mt-14 flex justify-end border-t border-black/12 pt-6 sm:mt-20"><button type="button" disabled={!ready} onClick={next} className="inline-flex min-h-14 min-w-52 items-center justify-between bg-[#171714] px-6 text-xs font-semibold uppercase tracking-[0.09em] text-white transition disabled:cursor-not-allowed disabled:opacity-25">{step === roadTripQuestions.length - 1 ? "Reveal my route" : "Continue"}<span aria-hidden="true">→</span></button></div>
    </div>
  </section>;
}

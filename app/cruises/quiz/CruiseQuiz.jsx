"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { track } from "@vercel/analytics";
import { cruiseQuestions } from "../../data/cruiseQuiz";
import { cruiseDiscovery } from "../../data/journeyDiscovery";
import { StartingLocationField } from "../../components/StartingLocationField";

const images = { "Tropical islands": "/quiz/ocean.jpg", "Coastal cities": "/amalfi-feature.jpg", "Dramatic landscapes": "/banff-feature.jpg", "Remote exploration": "/quiz/nature.jpg" };
const examples = { "Tropical islands": "Caribbean · South Pacific · Hawaii", "Coastal cities": "Mediterranean · Adriatic · Northern Europe", "Dramatic landscapes": "Alaska · Norway · Iceland", "Remote exploration": "Arctic · Expedition passages" };
const cruiseMiniQuestions = [
  { id: "origin", eyebrow: "Getting there", title: "Where are you leaving from?", options: [] },
  { id: "budget", eyebrow: "The complete journey", title: "What should the whole trip cost?", options: [] },
  { id: "travelers", eyebrow: "Your company", title: "Who is traveling?", options: ["Couple", "Family", "Friends", "Solo"] },
  { id: "duration", eyebrow: "Time at sea", title: "How long?", options: ["3–5 nights", "6–8 nights", "9–14 nights", "15+ nights"] },
  { id: "style", eyebrow: "The rhythm", title: "How should the cruise feel?", options: ["Relaxing", "Adventure", "Luxury", "Family"] },
];
const presets = { "caribbean-island-passage": { experience: "Tropical islands", priority: "Beautiful beaches" }, "adriatic-cities": { experience: "Coastal cities", priority: "Historic cities" }, "alaska-inside-passage": { experience: "Dramatic landscapes", priority: "Nature and wildlife" }, "japan-coast": { experience: "Coastal cities", priority: "Amazing food" } };

function Choice({ option, selected, onClick, visual }) {
  if (visual) return <button type="button" aria-pressed={selected} onClick={onClick} className={`group relative min-h-56 overflow-hidden text-left sm:min-h-72 ${selected ? "ring-2 ring-[#9b7b43] ring-offset-4 ring-offset-[#f4f1eb]" : ""}`}><Image src={images[option]} alt="" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" /><span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" /><span className="absolute inset-x-0 bottom-0 p-5 text-white"><strong className="block text-sm font-medium">{option}</strong><span className="mt-2 block text-[10px] uppercase tracking-[0.1em] text-white/65">{examples[option]}</span></span></button>;
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-16 items-center justify-between border-b px-1 text-left text-lg transition sm:min-h-20 sm:text-xl ${selected ? "border-[#9b7b43] text-black" : "border-black/16 text-black/58 hover:border-black/50 hover:text-black"}`}><span>{option}</span><span className="text-sm" aria-hidden="true">{selected ? "●" : "○"}</span></button>;
}

export function CruiseQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const journeyId = searchParams.get("journey");
  const selectedJourney = cruiseDiscovery.find((item) => item.id === journeyId) || null;
  const questions = selectedJourney ? cruiseMiniQuestions : cruiseQuestions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [locationState, setLocationState] = useState("");
  const question = questions[step];
  const selected = answers[question.id];
  const ready = question.id === "budget" ? Number(answers.budget) >= 1000 : question.id === "origin" ? Boolean(answers.originDetails?.city && answers.originDetails?.countryCode && Number.isFinite(answers.originDetails?.latitude) && Number.isFinite(answers.originDetails?.longitude)) : Boolean(selected);
  function choose(option) { setAnswers((current) => ({ ...current, [question.id]: option })); }
  function next() { if (!ready) return; if (step < questions.length - 1) { setStep((current) => current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; } const style = answers.style; const payload = { ...answers, ...(presets[journeyId] || {}), ...(style ? { mood: style === "Relaxing" ? "Relaxed and slow" : style === "Adventure" ? "Adventure every day" : style === "Luxury" ? "Luxury escape" : "Balanced exploring and relaxing", priority: style === "Family" ? "Family experiences" : (presets[journeyId]?.priority || "Nature and wildlife") } : {}), requestedRouteId: selectedJourney?.id || null, version: 2, createdAt: new Date().toISOString() }; window.localStorage.setItem("globtrekCruiseQuiz", JSON.stringify(payload)); track("cruise_quiz_completed", { experience: payload.experience, duration: payload.duration, budget: Number(payload.budget), origin: payload.originDetails.airportCode || payload.originDetails.city, selectedJourney: selectedJourney?.id || "discovery" }); router.push("/cruises/results"); }
  function useLocation() {
    if (!navigator.geolocation) { setLocationState("Location is not available in this browser. Choose an airport manually."); return; }
    setLocationState("Finding the closest airport…");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => { try { const response = await fetch("/api/origin/nearest-airport", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }) }); const payload = await response.json(); if (!response.ok || !payload.origin) throw new Error(); setAnswers((current) => ({ ...current, originDetails: payload.origin })); setLocationState(`${payload.origin.city || payload.origin.airportName} (${payload.origin.airportCode}) selected.`); } catch { setLocationState("We couldn’t resolve that location confidently. Choose an airport manually."); } }, () => setLocationState("Location permission was not available. Choose an airport manually."), { timeout: 10000, maximumAge: 600000 });
  }
  return <section className="min-h-[calc(100svh-8rem)] px-5 py-10 sm:px-8 sm:py-16"><div className="mx-auto max-w-[1320px]"><div className="flex items-center justify-between border-b border-black/12 pb-5 text-[10px] uppercase tracking-[0.18em] text-black/45"><button type="button" onClick={() => step ? setStep(step - 1) : router.push("/cruises")} className="text-black/65">← Back</button><span>{selectedJourney ? selectedJourney.name : "Cruise discovery"} · {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span></div><div className="pt-12 sm:pt-16"><p className="text-[10px] uppercase tracking-[0.22em] text-[#8a6b36]">{question.eyebrow}</p><h1 className="mt-5 max-w-5xl font-serif text-[clamp(3.2rem,6.2vw,7rem)] leading-[.87] tracking-[-0.055em]">{question.title}</h1>
    {question.id === "budget" ? <div className="mt-14 max-w-2xl sm:mt-20"><label className="block text-[10px] uppercase tracking-[0.18em] text-black/45" htmlFor="cruise-budget">Total trip budget · USD</label><div className="mt-4 flex items-baseline border-b border-black/35 pb-4"><span className="font-serif text-4xl text-black/40 sm:text-6xl">$</span><input id="cruise-budget" type="number" inputMode="numeric" min="1000" max="500000" step="100" autoFocus value={answers.budget || ""} onChange={(event) => setAnswers((current) => ({ ...current, budget: event.target.value }))} placeholder="5,000" className="min-w-0 flex-1 bg-transparent px-3 font-serif text-5xl tracking-[-0.05em] outline-none placeholder:text-black/18 sm:text-8xl" /></div><p className="mt-5 text-sm text-black/48">Cruise, flights or driving, port hotel, and local transport. Planning estimates are never shown as live fares.</p></div> : question.id === "origin" ? <div className="mt-14 max-w-2xl sm:mt-20"><p className="text-[10px] uppercase tracking-[0.18em] text-black/45">Leaving from</p><StartingLocationField key={answers.originDetails?.placeId || "cruise-origin-empty"} id="cruise-origin" value={answers.originDetails} onChange={(originDetails) => setAnswers((current) => ({ ...current, originDetails }))} /><button type="button" onClick={useLocation} className="mt-7 border-b border-black pb-1 text-xs font-semibold uppercase tracking-[0.08em]">Use my location</button>{locationState ? <p aria-live="polite" className="mt-4 text-xs text-black/48">{locationState}</p> : null}</div> : <div className={`mt-12 sm:mt-16 ${question.visual ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid max-w-4xl gap-x-10 sm:grid-cols-2"}`}>{question.options.map((option) => <Choice key={option} option={option} selected={selected === option} onClick={() => choose(option)} visual={question.visual} />)}</div>}
    </div><div className="mt-14 flex justify-end border-t border-black/12 pt-6 sm:mt-20"><button type="button" disabled={!ready} onClick={next} className="inline-flex min-h-14 min-w-52 items-center justify-between bg-[#171714] px-6 text-xs font-semibold uppercase tracking-[0.09em] text-white transition disabled:cursor-not-allowed disabled:opacity-25">{step === questions.length - 1 ? "Reveal my journey" : "Continue"}<span aria-hidden="true">→</span></button></div></div></section>;
}

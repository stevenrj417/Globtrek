"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { cruiseQuestions } from "../../data/cruiseQuiz";
import { cruiseDiscovery } from "../../data/journeyDiscovery";
import { StartingLocationField } from "../../components/StartingLocationField";

const oceanImages = { "Tropical islands": "/luxury-coast.jpg", "Coastal cities": "/amalfi-feature.jpg", "Dramatic landscapes": "/banff-feature.jpg", "Remote exploration": "/quiz/nature.jpg" };
const rhythmImages = { "Relaxed and slow": "/quiz/mostly-relaxing.jpg", "Balanced exploring and relaxing": "/quiz/balanced-days.jpg", "Adventure every day": "/quiz/adventure-days.jpg", "Luxury escape": "/quiz/premium.jpg" };
const examples = { "Tropical islands": "Caribbean · South Pacific · Hawaii", "Coastal cities": "Mediterranean · Adriatic · Northern Europe", "Dramatic landscapes": "Alaska · Norway · Iceland", "Remote exploration": "Arctic · Expedition passages" };
const budgetOptions = [{ label: "$2K–$4K", value: 3000 }, { label: "$4K–$6K", value: 5000 }, { label: "$6K–$8K", value: 7000 }, { label: "$8K+", value: 10000 }];
const cruiseMiniQuestions = [
  { id: "origin", eyebrow: "Getting there", title: "Where are you leaving from?", options: [] },
  { id: "budget", eyebrow: "The complete journey", title: "What should the whole trip cost?", options: [] },
  { id: "travelers", eyebrow: "Your company", title: "Who is traveling?", options: ["Couple", "Family", "Friends", "Solo"] },
  { id: "duration", eyebrow: "Time at sea", title: "How long?", options: ["3–5 nights", "6–8 nights", "9–14 nights", "15+ nights"] },
  { id: "style", eyebrow: "The rhythm", title: "How should the cruise feel?", options: ["Relaxing", "Adventure", "Luxury", "Family"] },
];
const presets = { "caribbean-island-passage": { experience: "Tropical islands", priority: "Beautiful beaches", region: "Caribbean" }, "adriatic-cities": { experience: "Coastal cities", priority: "Historic cities", region: "Mediterranean" }, "alaska-inside-passage": { experience: "Dramatic landscapes", priority: "Nature and wildlife", region: "Alaska" }, "japan-coast": { experience: "Coastal cities", priority: "Amazing food", region: "Asia Pacific" } };

function Choice({ option, selected, onClick, image, note }) {
  if (image) return <button type="button" aria-pressed={selected} onClick={onClick} className={`group relative min-h-64 overflow-hidden text-left sm:min-h-80 ${selected ? "ring-2 ring-[#9b7b43] ring-offset-4 ring-offset-[#f4f1eb]" : ""}`}><Image src={image} alt="" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" /><span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" /><span className="absolute inset-x-0 bottom-0 p-5 text-white"><strong className="block text-sm font-medium">{option}</strong>{note ? <span className="mt-2 block text-[10px] uppercase tracking-[0.1em] text-white/65">{note}</span> : null}</span></button>;
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex min-h-20 items-center justify-between border px-5 text-left transition sm:min-h-24 ${selected ? "border-[#9b7b43] bg-[#eee8dc] text-black" : "border-black/13 text-black/58 hover:border-black/45 hover:text-black"}`}><span className="text-lg sm:text-xl">{option}</span><span className="text-sm" aria-hidden="true">{selected ? "●" : "○"}</span></button>;
}

export function CruiseQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const journeyId = searchParams.get("journey");
  const selectedJourney = cruiseDiscovery.find((item) => item.id === journeyId) || null;
  const questions = selectedJourney ? cruiseMiniQuestions : cruiseQuestions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [transitioning, setTransitioning] = useState(false);
  const [locationState, setLocationState] = useState("");
  const transitionTimer = useRef(null);
  const question = questions[step];

  function finish(finalAnswers) {
    const style = finalAnswers.style;
    const payload = { ...finalAnswers, ...(presets[journeyId] || {}), ...(style ? { mood: style === "Relaxing" ? "Relaxed and slow" : style === "Adventure" ? "Adventure every day" : style === "Luxury" ? "Luxury escape" : "Balanced exploring and relaxing", priority: style === "Family" ? "Family experiences" : (presets[journeyId]?.priority || "Nature and wildlife") } : {}), waterType: finalAnswers.waterType || "Ocean", season: finalAnswers.season || "Flexible", region: finalAnswers.region || presets[journeyId]?.region || "No preference", requestedRouteId: selectedJourney?.id || null, version: 3, createdAt: new Date().toISOString() };
    window.localStorage.setItem("globtrekCruiseQuiz", JSON.stringify(payload));
    track("cruise_quiz_completed", { experience: payload.experience, duration: payload.duration, budget: Number(payload.budget), origin: payload.originDetails.airportCode || payload.originDetails.city, selectedJourney: selectedJourney?.id || "discovery" });
    router.push("/cruises/results");
  }
  function advance(finalAnswers) {
    if (transitioning) return;
    setTransitioning(true);
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      if (step < questions.length - 1) { setStep((current) => current + 1); setTransitioning(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
      else finish(finalAnswers);
    }, 280);
  }
  function choose(option) { const nextAnswers = { ...answers, [question.id]: option }; setAnswers(nextAnswers); advance(nextAnswers); }
  function chooseBudget(value) { const nextAnswers = { ...answers, budget: String(value) }; setAnswers(nextAnswers); advance(nextAnswers); }
  function chooseOrigin(originDetails) { const nextAnswers = { ...answers, originDetails }; setAnswers(nextAnswers); if (originDetails?.city && originDetails?.countryCode && Number.isFinite(originDetails?.latitude) && Number.isFinite(originDetails?.longitude)) advance(nextAnswers); }
  function submitBudget(event) { event.preventDefault(); if (Number(answers.budget) >= 1000) advance(answers); }
  function goBack() { window.clearTimeout(transitionTimer.current); setTransitioning(false); if (step) setStep((current) => current - 1); else router.push("/cruises"); }
  function useLocation() {
    if (!navigator.geolocation) { setLocationState("Location is not available in this browser. Choose a city or airport."); return; }
    setLocationState("Finding your starting point…");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => { try { const response = await fetch("/api/origin/nearest-airport", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }) }); const payload = await response.json(); if (!response.ok || !payload.origin) throw new Error(); setLocationState(`${payload.origin.city || payload.origin.airportName} selected.`); chooseOrigin(payload.origin); } catch { setLocationState("We couldn’t resolve that location confidently. Choose a city or airport."); } }, () => setLocationState("Location permission was not available. Choose a city or airport."), { timeout: 10000, maximumAge: 600000 });
  }

  const selected = answers[question.id];
  const visual = question.visual || question.id === "mood";
  return <section className="min-h-[calc(100svh-8rem)] px-5 py-10 sm:px-8 sm:py-16"><div className="mx-auto max-w-[1320px]"><div className="flex items-center justify-between border-b border-black/12 pb-5 text-[10px] uppercase tracking-[0.18em] text-black/45"><button type="button" onClick={goBack} className="text-black/65">← Back</button><span>{selectedJourney ? selectedJourney.name : "Cruise discovery"} · {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span></div><div className={`pt-12 text-center transition duration-300 sm:pt-16 ${transitioning ? "translate-y-1 opacity-55" : "opacity-100"}`}><p className="text-[10px] uppercase tracking-[0.22em] text-[#8a6b36]">{question.eyebrow}</p><h1 className="mx-auto mt-5 max-w-5xl font-serif text-[clamp(3.2rem,6.2vw,7rem)] leading-[.87] tracking-[-0.055em]">{question.title}</h1>
    {question.id === "budget" ? <form onSubmit={submitBudget} className="mx-auto mt-14 max-w-3xl text-left sm:mt-20"><label className="block text-center text-[10px] uppercase tracking-[0.18em] text-black/45" htmlFor="cruise-budget">Total trip budget · USD</label><div className="mx-auto mt-4 flex max-w-2xl items-baseline border-b border-black/35 pb-4"><span className="font-serif text-4xl text-black/40 sm:text-6xl">$</span><input id="cruise-budget" type="number" inputMode="numeric" min="1000" max="500000" step="100" autoFocus value={answers.budget || ""} onChange={(event) => setAnswers((current) => ({ ...current, budget: event.target.value }))} placeholder="5,000" className="min-w-0 flex-1 bg-transparent px-3 text-center font-serif text-5xl tracking-[-0.05em] outline-none placeholder:text-black/18 sm:text-8xl" /></div><div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{budgetOptions.map((option) => <button key={option.label} type="button" onClick={() => chooseBudget(option.value)} className="min-h-14 border border-black/15 text-sm hover:border-black">{option.label}</button>)}</div><div className="mt-5 flex items-center justify-between gap-6 text-xs text-black/45"><span>Cruise, access, port stay, and transport. Estimates are not live fares.</span><button type="submit" disabled={Number(answers.budget) < 1000 || transitioning} className="shrink-0 uppercase tracking-[0.12em] text-black disabled:opacity-25">Use budget →</button></div></form> : question.id === "origin" ? <div className="mx-auto mt-14 max-w-2xl text-left sm:mt-20"><p className="text-center text-[10px] uppercase tracking-[0.18em] text-black/45">Starting point</p><StartingLocationField key={answers.originDetails?.placeId || "cruise-origin-empty"} id="cruise-origin" value={answers.originDetails} onChange={chooseOrigin} placeholder="City, airport, or code" /><div className="mt-6 text-center"><button type="button" onClick={useLocation} className="border-b border-black pb-1 text-xs uppercase tracking-[0.08em]">Use my location</button>{locationState ? <p aria-live="polite" className="mt-4 text-xs text-black/48">{locationState}</p> : null}</div></div> : <div className={`mx-auto mt-12 grid sm:mt-16 ${visual ? "gap-3 sm:grid-cols-2 lg:grid-cols-4" : "max-w-4xl gap-3 sm:grid-cols-2"}`}>{question.options.map((option) => <Choice key={option} option={option} selected={selected === option} onClick={() => choose(option)} image={question.id === "experience" ? oceanImages[option] : question.id === "mood" ? rhythmImages[option] : null} note={question.id === "experience" ? examples[option] : null} />)}</div>}
    </div></div></section>;
}

"use client";

import Image from "../components/Photo";
import { useEffect, useRef, useState } from "react";
import { AirportAutocomplete } from "../components/AirportAutocomplete";
import { calm, nextGoodStart } from "../components/TripPricer";
import { formatMoney } from "../lib/format";

const SPIN_NAMES = ["Lisbon", "Kyoto", "Oaxaca", "Cape Town", "Hanoi", "Reykjavík", "Marrakech", "Cusco", "Prague", "Bali", "Tromsø", "Seville", "Buenos Aires", "Crete"];
const LINES = [["flights", "Flights"], ["hotel", "Places to stay"], ["food", "Food"], ["activities", "Things to do"], ["transportation", "Getting around"], ["miscBuffer", "A little extra"]];

export function SurpriseClient() {
  const [budget, setBudget] = useState("1500");
  const [nights, setNights] = useState(5);
  const [origin, setOrigin] = useState(null);
  const [travelers, setTravelers] = useState(1);
  const [start] = useState(() => nextGoodStart([]));
  const [state, setState] = useState({ status: "idle" });
  const [spin, setSpin] = useState("");
  const seen = useRef([]);
  const resultRef = useRef(null);

  useEffect(() => {
    try {
      const quiz = JSON.parse(window.localStorage.getItem("globtrekQuiz") || "null");
      window.setTimeout(() => {
        if (quiz?.originDetails?.airportCode) setOrigin(quiz.originDetails);
        if (quiz?.exactBudget > 0) setBudget(String(quiz.exactBudget));
      }, 0);
    } catch {}
  }, []);

  async function surprise(event) {
    event?.preventDefault();
    if (!origin?.airportCode) { setState({ status: "error", message: "Pick the airport you'd fly from first." }); return; }
    setState({ status: "spinning" });
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let tick = 0;
    const timer = still ? null : window.setInterval(() => { setSpin(SPIN_NAMES[tick % SPIN_NAMES.length]); tick += 1; }, 90);
    const params = new URLSearchParams({ budget, nights: String(nights), origin: origin.airportCode, travelers: String(travelers), start, skip: seen.current.join(",") });
    const [data] = await Promise.all([
      fetch(`/api/surprise?${params}`).then((response) => response.json()).catch(() => ({ error: "network" })),
      new Promise((resolve) => window.setTimeout(resolve, still ? 0 : 1400)),
    ]);
    if (timer) window.clearInterval(timer);
    if (data.result) {
      seen.current.push(data.result.id);
      setState({ status: "ready", result: data.result });
      window.setTimeout(() => resultRef.current?.focus(), 50);
    } else if (data.error === "none_fit") {
      setState({ status: "error", message: data.cheapest ? `Nothing fits ${formatMoney(Number(budget))} for ${nights} nights from ${origin.airportCode} yet. The cheapest we found was ${calm(data.cheapest.city)} at about ${formatMoney(data.cheapest.total)}. Try fewer nights or a bigger budget.` : "Nothing fits that budget yet. Try fewer nights or a bigger budget." });
    } else setState({ status: "error", message: data.error && data.error !== "network" ? data.error : "That didn't load. Check your connection and try again." });
  }

  function plan(result) {
    try {
      window.localStorage.setItem("globtrekQuiz", JSON.stringify({ answers: { exactBudget: Number(budget) }, exactBudget: Number(budget), tripStart: result.start, tripEnd: result.end, isFlexible: false, originAirport: origin.airportCode, originDetails: origin, guestCount: String(travelers), adults: travelers, children: 0, destination: result.id, createdAt: Date.now() }));
    } catch {}
    window.location.href = `/results?destination=${encodeURIComponent(result.id)}`;
  }

  const result = state.result;
  return <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
    <form onSubmit={surprise} className="border border-black bg-white p-5 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block"><span className="text-micro font-medium uppercase tracking-label">Total budget (USD)</span><span className="mt-3 flex min-h-11 items-center border border-black/25 px-3"><span aria-hidden="true">$</span><input inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))} className="w-full bg-transparent px-1 text-base outline-none" aria-label="Total budget in US dollars" /></span></label>
        <label className="block"><span className="text-micro font-medium uppercase tracking-label">Nights</span><select value={nights} onChange={(event) => setNights(Number(event.target.value))} className="mt-3 block min-h-11 w-full border border-black/25 bg-white px-3 text-base">{[2, 3, 4, 5, 6, 7, 10, 14, 21].map((value) => <option key={value} value={value}>{value} nights</option>)}</select></label>
        <div><p className="text-micro font-medium uppercase tracking-label">Flying from</p><AirportAutocomplete key={origin?.airportCode || "none"} id="surprise-from" value={origin} onChange={(value) => value?.airportCode && setOrigin(value)} /></div>
        <div><p className="text-micro font-medium uppercase tracking-label">Travelers</p><div className="mt-3 flex items-center gap-3"><button type="button" aria-label="One fewer traveler" onClick={() => setTravelers((value) => Math.max(1, value - 1))} className="grid h-11 w-11 place-items-center border border-black/25 text-lg hover:border-black">−</button><span className="tabular min-w-8 text-center text-lg">{travelers}</span><button type="button" aria-label="One more traveler" onClick={() => setTravelers((value) => Math.min(8, value + 1))} className="grid h-11 w-11 place-items-center border border-black/25 text-lg hover:border-black">+</button></div></div>
      </div>
      <button type="submit" disabled={state.status === "spinning"} className="btn btn-primary mt-7 min-h-14 w-full sm:w-auto">{state.status === "spinning" ? "Picking…" : result ? "Surprise me again" : "Surprise me"}</button>
      <p className="mt-3 text-sm">Your whole trip has to fit: flights, where you sleep, food, things to do and getting around.</p>
    </form>

    <div aria-live="polite" className="mt-10">
      {state.status === "spinning" ? <p className="py-16 text-center font-serif text-[clamp(3rem,9vw,7rem)] leading-none tracking-tight-3">{spin || "…"}</p> : null}
      {state.status === "error" ? <p className="border-l-2 border-black pl-4 text-base leading-7">{state.message}</p> : null}
      {state.status === "ready" && result ? <article ref={resultRef} tabIndex={-1} className="rise grid gap-8 outline-none lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        <div className="relative aspect-[4/3] overflow-hidden bg-placeholder"><Image src={result.image} alt={result.imageAlt} fill priority className="image-calm object-cover" sizes="(min-width: 1024px) 55vw, 100vw" quality={80} /></div>
        <div>
          <p className="eyebrow">You&apos;re going to</p>
          <h2 className="mt-3 font-serif text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] tracking-tight-3">{calm(result.city)}</h2>
          <p className="mt-2 text-micro uppercase tracking-label">{calm(result.country)}</p>
          <p className="tabular mt-6 text-xl">About <strong className="font-semibold">{formatMoney(result.total)}</strong> for {result.nights} nights{result.travelers > 1 ? ` for ${result.travelers}` : ""}, with {formatMoney(result.spare)} of your budget to spare.</p>
          {result.tags?.length ? <p className="mt-4 text-sm">{result.tags.join(" · ")}</p> : null}
          <dl className="mt-6 grid gap-px bg-black/10">{LINES.map(([key, label]) => result.lines[key] > 0 ? <div key={key} className="flex justify-between bg-bg py-2"><dt className="text-sm">{label}</dt><dd className="tabular text-sm font-medium">{formatMoney(result.lines[key])}</dd></div> : null)}</dl>
          <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => plan(result)} className="btn btn-primary min-h-14">Plan and book this trip</button><button type="button" onClick={surprise} className="inline-flex min-h-14 items-center border border-black px-6 text-micro font-medium uppercase tracking-label hover:bg-black hover:text-white">Not feeling it? Spin again</button></div>
          <p className="mt-3 text-sm">GlobTrek estimate for these dates; you see live prices before you book anything.</p>
        </div>
      </article> : null}
    </div>
  </div>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { destinations } from "../data/destinations";
import { discoverySliderToUnknownness, legacyBudgetLabel } from "../lib/recommendation/travelerProfile";
import { searchDestinations } from "../lib/search/destinationSearch";
import { useAuth } from "./AuthProvider";

const VIBES = ["Food", "Culture", "Nature", "Nightlife"];
const PACES = ["Slow mornings", "Balanced days", "Packed schedule"];
const BUDGETS = [2500, 4500, 7500, 12000];

function titleCase(value) {
  return String(value).toLowerCase().replace(/(^|[\s&-])\S/g, (letter) => letter.toUpperCase());
}

export function DestinationSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState(null);
  const [budget, setBudget] = useState(4500);
  const [vibe, setVibe] = useState("Food");
  const [pace, setPace] = useState("Balanced days");
  const [knownness, setKnownness] = useState(50);
  const [included, setIncluded] = useState({ flights: true, hotel: true, food: true, activities: true, transportation: true });
  const [originAirport, setOriginAirport] = useState("");
  const { user } = useAuth();

  const suggestions = useMemo(() => {
    return searchDestinations(destinations, query);
  }, [query]);

  useEffect(() => { if (!open || !user || originAirport) return; fetch("/api/account").then((response) => response.ok ? response.json() : null).then((payload) => { if (payload?.profile?.home_airport) setOriginAirport(payload.profile.home_airport); }).catch(() => {}); }, [open, originAirport, user]);

  function close() {
    setOpen(false);
    setDestination(null);
    setQuery("");
  }

  function launch() {
    if (!destination) return;
    const answers = {
      alive: destination.tags.includes("Ocean") ? "Ocean" : destination.tags.includes("Mountains") ? "Mountains" : destination.tags.includes("Culture") ? "Culture" : "Cities",
      escape: pace,
      self: "Couple",
      duration: "One Week",
      hotel: destination.tags.includes("Private villa") ? "Private villa" : destination.tags.includes("Beach resort") ? "Beach resort" : "Boutique hotel",
      luxury: vibe,
      memory: legacyBudgetLabel(budget),
      exactBudget: budget,
      discovery: discoverySliderToUnknownness(knownness),
      season: "Flexible dates",
      includedBudgetCategories: included,
    };
    window.localStorage.setItem("globtrekQuiz", JSON.stringify({ answers, exactBudget: budget, includedBudgetCategories: included, budgetIncludesFlights: included.flights, budgetIncludesHotel: included.hotel, budgetIncludesFood: included.food, budgetIncludesActivities: included.activities, budgetIncludesTransportation: included.transportation, tripStart: "", tripEnd: "", isFlexible: true, originAirport, guestCount: "2", createdAt: Date.now() }));
    window.location.assign(`/thinking?destination=${encodeURIComponent(destination.airport)}`);
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-black/50 transition hover:text-black" aria-label="Search destinations"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg><span className="hidden xl:inline">Destinations</span></button>
    {open ? <div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-[3px]" onMouseDown={close}>
      <section role="dialog" aria-modal="true" aria-label={destination ? `Personalize ${destination.city}` : "Search destinations"} className="my-auto w-full max-w-2xl bg-[#f7f7f4] p-6 shadow-[0_30px_100px_rgba(0,0,0,.2)] sm:p-10" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-6"><div><p className="text-[9px] uppercase tracking-[0.25em] text-black/40">{destination ? "A quick edit" : "Go somewhere specific"}</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.045em] sm:text-5xl">{destination ? titleCase(destination.city) : "Find a destination."}</h2></div><button type="button" onClick={close} aria-label="Close" className="grid h-10 w-10 place-items-center text-xl font-light">×</button></div>
        {!destination ? <div className="mt-8"><label className="sr-only" htmlFor="destination-search">Destination</label><input id="destination-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Provence, Japan, coast…" className="min-h-16 w-full border-b border-black/20 bg-transparent font-serif text-2xl outline-none placeholder:text-black/25 focus:border-black" />
          <div className="mt-3">{suggestions.map((item) => <button key={item.airport} type="button" onClick={() => setDestination(item)} className="flex w-full items-center justify-between border-b border-black/10 py-4 text-left transition hover:pl-2"><span><strong className="font-serif text-xl font-normal">{titleCase(item.city)}</strong><span className="ml-3 text-[9px] uppercase tracking-[0.16em] text-black/40">{titleCase(item.country)}</span></span><span className="text-[9px] tracking-[0.15em] text-black/35">{item.airport}</span></button>)}{query && !suggestions.length ? <p className="py-8 text-sm font-light text-black/45">That place is not in the Globtrek collection yet.</p> : null}</div>
        </div> : <div className="mt-9 grid gap-8">
          <fieldset><legend className="text-[9px] uppercase tracking-[0.2em] text-black/40">Exact budget</legend><div className="mt-3 flex items-center border-b border-black/20 font-serif text-3xl"><span>$</span><input type="number" min="100" max="1000000" step="50" value={budget} onChange={(event) => setBudget(Math.max(100, Number(event.target.value) || 0))} className="min-h-14 min-w-0 flex-1 bg-transparent px-2 outline-none" /></div><div className="mt-3 flex flex-wrap gap-2">{BUDGETS.map((amount) => <button key={amount} type="button" onClick={() => setBudget(amount)} className="border border-black/12 px-3 py-2 text-[8px] uppercase tracking-[0.13em]">${amount.toLocaleString()}</button>)}</div></fieldset>
          <fieldset><legend className="text-[9px] uppercase tracking-[0.2em] text-black/40">What should that include?</legend><div className="mt-3 flex flex-wrap gap-2">{Object.keys(included).map((key) => <label key={key} className={`cursor-pointer border px-3 py-3 text-[8px] uppercase tracking-[0.14em] ${included[key] ? "border-black bg-black text-white" : "border-black/15"}`}><input type="checkbox" checked={included[key]} onChange={() => setIncluded((current) => ({ ...current, [key]: !current[key] }))} className="sr-only" />{key}</label>)}</div></fieldset>
          <label className="block text-[9px] uppercase tracking-[0.2em] text-black/40">Leaving from<input maxLength={3} value={originAirport} onChange={(event) => setOriginAirport(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} placeholder="Airport code" className="mt-3 min-h-12 w-full border-b border-black/20 bg-transparent text-sm tracking-normal outline-none focus:border-black" /></label>
          <fieldset><legend className="text-[9px] uppercase tracking-[0.2em] text-black/40">What matters most?</legend><div className="mt-3 flex flex-wrap gap-2">{VIBES.map((item) => <button key={item} type="button" onClick={() => setVibe(item)} className={`border px-4 py-3 text-[9px] uppercase tracking-[0.15em] ${vibe === item ? "border-black bg-black text-white" : "border-black/15"}`}>{item}</button>)}</div></fieldset>
          <fieldset><legend className="text-[9px] uppercase tracking-[0.2em] text-black/40">Pace</legend><div className="mt-3 flex flex-wrap gap-2">{PACES.map((item) => <button key={item} type="button" onClick={() => setPace(item)} className={`border px-4 py-3 text-[9px] uppercase tracking-[0.15em] ${pace === item ? "border-black bg-black text-white" : "border-black/15"}`}>{item}</button>)}</div></fieldset>
          <label className="block"><span className="flex justify-between text-[9px] uppercase tracking-[0.18em] text-black/40"><span>Hidden</span><span>Iconic</span></span><input type="range" min="0" max="100" value={knownness} onChange={(event) => setKnownness(Number(event.target.value))} className="mt-4 w-full accent-black" aria-label="Destination knownness" /></label>
          <div className="flex items-center justify-between border-t border-black/10 pt-6"><button type="button" onClick={() => setDestination(null)} className="text-[9px] uppercase tracking-[0.18em] text-black/45">← Back</button><button type="button" onClick={launch} className="min-h-14 bg-black px-7 text-[9px] uppercase tracking-[0.2em] text-white">Build this trip →</button></div>
        </div>}
      </section>
    </div> : null}
  </>;
}

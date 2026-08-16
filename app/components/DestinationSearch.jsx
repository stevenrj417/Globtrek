"use client";

import { useMemo, useState } from "react";
import { destinations } from "../data/destinations";
import { discoverySliderToUnknownness, legacyBudgetLabel } from "../lib/recommendation/travelerProfile";

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

  const suggestions = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (search.length < 1) return [];
    return destinations.filter((item) => [item.city, item.country, item.airport, item.style, ...(item.tags || [])].some((value) => String(value).toLowerCase().includes(search))).slice(0, 6);
  }, [query]);

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
      includedBudgetCategories: { flights: true, hotel: true, food: true, activities: true, transportation: true },
    };
    window.localStorage.setItem("globtrekQuiz", JSON.stringify({ answers, exactBudget: budget, includedBudgetCategories: answers.includedBudgetCategories, budgetIncludesFlights: true, budgetIncludesHotel: true, budgetIncludesFood: true, budgetIncludesActivities: true, budgetIncludesTransportation: true, tripStart: "", tripEnd: "", isFlexible: true, originAirport: "", guestCount: "2", createdAt: Date.now() }));
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
          <fieldset><legend className="text-[9px] uppercase tracking-[0.2em] text-black/40">Budget</legend><div className="mt-3 grid grid-cols-2 gap-px bg-black/10 sm:grid-cols-4">{BUDGETS.map((amount, index) => <button key={amount} type="button" onClick={() => setBudget(amount)} className={`min-h-12 bg-[#f7f7f4] px-3 text-[9px] uppercase tracking-[0.12em] ${budget === amount ? "bg-black text-white" : "hover:bg-white"}`}>{index === BUDGETS.length - 1 ? "$10,000+" : index === 0 ? "$0–$3,000" : index === 1 ? "$3,000–$6,000" : "$6,000–$10,000"}</button>)}</div></fieldset>
          <fieldset><legend className="text-[9px] uppercase tracking-[0.2em] text-black/40">What matters most?</legend><div className="mt-3 flex flex-wrap gap-2">{VIBES.map((item) => <button key={item} type="button" onClick={() => setVibe(item)} className={`border px-4 py-3 text-[9px] uppercase tracking-[0.15em] ${vibe === item ? "border-black bg-black text-white" : "border-black/15"}`}>{item}</button>)}</div></fieldset>
          <fieldset><legend className="text-[9px] uppercase tracking-[0.2em] text-black/40">Pace</legend><div className="mt-3 flex flex-wrap gap-2">{PACES.map((item) => <button key={item} type="button" onClick={() => setPace(item)} className={`border px-4 py-3 text-[9px] uppercase tracking-[0.15em] ${pace === item ? "border-black bg-black text-white" : "border-black/15"}`}>{item}</button>)}</div></fieldset>
          <label className="block"><span className="flex justify-between text-[9px] uppercase tracking-[0.18em] text-black/40"><span>Hidden</span><span>Iconic</span></span><input type="range" min="0" max="100" value={knownness} onChange={(event) => setKnownness(Number(event.target.value))} className="mt-4 w-full accent-black" aria-label="Destination knownness" /></label>
          <div className="flex items-center justify-between border-t border-black/10 pt-6"><button type="button" onClick={() => setDestination(null)} className="text-[9px] uppercase tracking-[0.18em] text-black/45">← Back</button><button type="button" onClick={launch} className="min-h-14 bg-black px-7 text-[9px] uppercase tracking-[0.2em] text-white">Build this trip →</button></div>
        </div>}
      </section>
    </div> : null}
  </>;
}

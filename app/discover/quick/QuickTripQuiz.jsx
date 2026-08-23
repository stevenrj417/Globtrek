"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { StartingLocationField } from "../../components/StartingLocationField";

const destinations = {
  KIX: { name: "Kyoto", answers: { alive: "Culture", escape: "Balanced days", hotel: "Traditional inn", luxury: "Culture" } },
  NAP: { name: "Amalfi Coast", answers: { alive: "Ocean", escape: "Mostly relaxing", hotel: "Beach resort", luxury: "Food" } },
  YYC: { name: "Banff", answers: { alive: "Mountains", escape: "Adventure days", hotel: "Mountain lodge", luxury: "Nature" } },
};
const durations = [["Long weekend", "Long Weekend"], ["Five nights", "Five Nights"], ["One week", "One Week"], ["Ten days", "Ten Days"], ["Two weeks", "Two Weeks"]];

export function QuickTripQuiz() {
  const router = useRouter();
  const params = useSearchParams();
  const destinationId = params.get("destination");
  const destination = destinations[destinationId] || null;
  const [originDetails, setOriginDetails] = useState(null);
  const [travelers, setTravelers] = useState("2");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("One Week");
  const ready = useMemo(() => destination && originDetails?.city && originDetails?.countryCode && Number.isFinite(originDetails?.latitude) && Number.isFinite(originDetails?.longitude) && Number(budget) >= 500 && Number(travelers) >= 1, [budget, destination, originDetails, travelers]);
  function submit(event) { event.preventDefault(); if (!ready) return; const included = { flights: true, hotel: true, food: true, activities: true, transportation: true }; const answers = { ...destination.answers, duration, discovery: 50, exactBudget: Number(budget), includedBudgetCategories: included }; window.localStorage.setItem("globtrekQuiz", JSON.stringify({ answers, exactBudget: Number(budget), includedBudgetCategories: included, budgetIncludesFlights: true, budgetIncludesHotel: true, budgetIncludesFood: true, budgetIncludesActivities: true, budgetIncludesTransportation: true, tripStart: "", tripEnd: "", isFlexible: true, originAirport: originDetails.airportCode || null, originDetails, originCountryCode: originDetails.countryCode, originCountryName: originDetails.countryName, travelAreaPreference: "anywhere", guestCount: travelers, destination: destinationId, preferredDestination: { id: destinationId, name: destination.name }, source: "trending_quick_quiz", createdAt: Date.now() })); router.push(`/thinking?destination=${encodeURIComponent(destinationId)}`); }
  if (!destination) return <section className="grid min-h-[70svh] place-items-center px-6 text-center"><div><h1 className="font-serif text-5xl">Choose a destination first.</h1><button type="button" onClick={() => router.push("/")} className="mt-8 bg-black px-6 py-4 text-xs uppercase tracking-[0.09em] text-white">See trending trips</button></div></section>;
  return <form onSubmit={submit} className="px-6 py-14 sm:px-10 sm:py-20"><div className="mx-auto max-w-[1100px]"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Your {destination.name} trip</p><h1 className="mt-5 max-w-4xl font-serif text-[clamp(3.5rem,7vw,7rem)] leading-[.86] tracking-[-0.055em]">Just the details that make it yours.</h1><div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2"><label className="text-[10px] uppercase tracking-[0.17em] text-black/45">Leaving from<StartingLocationField id="trip-origin" value={originDetails} onChange={setOriginDetails} /></label><label className="text-[10px] uppercase tracking-[0.17em] text-black/45">Travelers<input type="number" min="1" max="30" value={travelers} onChange={(event) => setTravelers(event.target.value)} className="mt-3 w-full border-b border-black/30 bg-transparent py-5 text-xl outline-none" /></label><label className="text-[10px] uppercase tracking-[0.17em] text-black/45">Total trip budget · USD<input type="number" min="500" step="100" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="4,000" className="mt-3 w-full border-b border-black/30 bg-transparent py-5 font-serif text-4xl outline-none placeholder:text-black/18" /></label><fieldset><legend className="text-[10px] uppercase tracking-[0.17em] text-black/45">Trip length</legend><div className="mt-3 grid grid-cols-2 border border-black/15">{durations.map(([label, value]) => <button key={value} type="button" aria-pressed={duration === value} onClick={() => setDuration(value)} className={`min-h-14 border-b border-r border-black/15 px-3 text-left text-xs last:border-b-0 ${duration === value ? "bg-black text-white" : ""}`}>{label}</button>)}</div></fieldset></div><div className="mt-14 flex justify-end border-t border-black/12 pt-7"><button disabled={!ready} type="submit" className="min-h-14 bg-black px-7 text-xs font-semibold uppercase tracking-[0.09em] text-white disabled:opacity-25">Create my {destination.name} trip →</button></div></div></form>;
}

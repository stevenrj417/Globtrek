"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AccountEntry } from "../../components/AccountEntry";
import { ItineraryDocument } from "../../components/ItineraryDocument";
import { SaveTripButton } from "../../components/SaveTripButton";
import { EmailTripButton } from "../../components/EmailTripButton";

function venueUrl(name, destination) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${name}, ${destination.city}, ${destination.country}`)}`;
}

export default function FullTripPage({ params }) {
  const { id } = use(params);
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("Loading your full trip…");
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (id === "current") {
        const raw = window.sessionStorage.getItem("globtrekCurrentTrip");
        if (!cancelled && raw) setPayload(JSON.parse(raw));
        if (!raw) setStatus("This trip is no longer available in this browser.");
        return;
      }
      const response = await fetch(`/api/trips/${encodeURIComponent(id)}`);
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (!response.ok) return setStatus(response.status === 401 ? "Sign in to view this saved trip." : "This trip could not be found.");
      const savedTrip = data.trip?.trip_data;
      const trip = savedTrip?.destination && { ...savedTrip.destination, plan: savedTrip.itinerary, budgetPlan: savedTrip.estimatedCosts, why: savedTrip.destination.why || "A trip shaped around the way you travel." };
      setPayload({ trip, quiz: savedTrip?.trip, savedTrip });
    }
    load().catch(() => !cancelled && setStatus("This trip could not be loaded."));
    return () => { cancelled = true; };
  }, [id]);

  async function refine(tune) {
    if (!payload?.quiz || !payload?.trip || refining) return;
    setRefining(true);
    try {
      const destinationKey = payload.trip.id || payload.trip.airport;
      const response = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload.quiz, tune, destination: destinationKey }) });
      const data = await response.json();
      const trip = data.matches?.find((item) => (item.id || item.airport) === destinationKey) || data.matches?.[0];
      if (trip) {
        const next = { ...payload, trip, savedTrip: { ...payload.savedTrip, itinerary: trip.plan, estimatedCosts: trip.budgetPlan } };
        setPayload(next);
        window.sessionStorage.setItem("globtrekCurrentTrip", JSON.stringify(next));
      }
    } finally { setRefining(false); }
  }

  if (!payload?.trip?.plan) return <main className="grid min-h-screen place-items-center bg-[#f3f0eb] px-6 text-center text-[#171714]"><div><p className="font-serif text-4xl">{status}</p><Link href="/results" className="mt-8 inline-block border-b border-black/30 pb-1 text-[9px] uppercase tracking-[0.2em]">Return to results</Link></div></main>;
  const { trip, quiz, savedTrip } = payload;

  return <main className="min-h-screen bg-[#f3f0eb] text-[#171714]">
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-7 text-white sm:px-12"><Link href="/" className="text-[13px] font-semibold uppercase tracking-[0.32em]">Globtrēk</Link><AccountEntry compact light /></header>
    <section className="relative min-h-[72svh] overflow-hidden"><Image src={trip.image} alt={`${trip.city}, ${trip.country}`} fill priority className="object-cover" sizes="100vw" quality={88} /><div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" /><div className="absolute inset-x-6 bottom-14 text-white sm:inset-x-12"><p className="text-[9px] uppercase tracking-[0.3em] text-white/70">Your complete trip</p><h1 className="mt-4 font-serif text-[clamp(3.5rem,9vw,8rem)] leading-[.82] tracking-[-0.055em]">{trip.city}</h1><p className="mt-6 text-[10px] uppercase tracking-[0.24em]">{trip.plan.days.length} days · {trip.country}</p></div></section>
    <section className="mx-auto max-w-[1460px] px-6 pb-24 sm:px-12">
      <div className="grid gap-px bg-black/10 sm:grid-cols-[1fr_auto_auto_auto]"><div className="bg-[#f3f0eb] px-5 py-5"><p className="text-[8px] uppercase tracking-[0.2em] text-black/40">Complete itinerary</p><p className="mt-2 font-serif text-xl">Every day, one shared plan.</p></div><SaveTripButton trip={savedTrip} className="min-h-20 bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] hover:bg-white" /><EmailTripButton trip={savedTrip} viewUrl={`/trip/${id}`} className="min-h-20 bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] hover:bg-white" /><Link href="/results" className="grid min-h-20 place-items-center bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] hover:bg-white">Back to overview</Link></div>
      <ItineraryDocument trip={trip} quiz={quiz} onRefine={refine} refining={refining} venueUrl={venueUrl} />
    </section>
  </main>;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AccountEntry } from "../../components/AccountEntry";
import { ItineraryDocument } from "../../components/ItineraryDocument";
import { SaveTripButton } from "../../components/SaveTripButton";
import { EmailTripButton } from "../../components/EmailTripButton";
import { ShareTripButton } from "../../components/ShareTripButton";

export default function FullTripPage({ params }) {
  const { id } = use(params);
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("Loading your full trip…");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (id === "current") {
        const raw = window.sessionStorage.getItem("globtrekCurrentTrip");
        if (!cancelled && raw) setPayload(JSON.parse(raw));
        if (!raw) setStatus("This trip is no longer available in this browser.");
        return;
      }
      const response = await fetch(id.startsWith("s_") ? `/api/public-trips/${encodeURIComponent(id)}` : `/api/trips/${encodeURIComponent(id)}`);
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (!response.ok) return setStatus(response.status === 401 ? "Sign in to view this saved trip." : response.status === 410 ? "This shared trip link has expired." : "This trip could not be found, or its owner stopped sharing it.");
      const savedTrip = data.trip?.trip_data;
      const trip = savedTrip?.destination && { ...savedTrip.destination, plan: savedTrip.itinerary, budgetPlan: savedTrip.estimatedCosts, why: savedTrip.destination.why || "A trip shaped around the way you travel." };
      setPayload({ trip, quiz: savedTrip?.trip, savedTrip });
    }
    load().catch(() => !cancelled && setStatus("This trip could not be loaded."));
    return () => { cancelled = true; };
  }, [id]);

  if (!payload?.trip?.plan) return <main className="grid min-h-screen place-items-center bg-canvas px-6 text-center text-ink"><div><p className="font-serif text-4xl">{status}</p><Link href="/results" className="mt-8 inline-block border-b border-black/30 pb-1 text-micro uppercase tracking-editorial">Return to results</Link></div></main>;
  const { trip, quiz, savedTrip } = payload;

  return <main className="min-h-screen bg-canvas text-ink">
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-7 text-white sm:px-12"><Link href="/" className="text-sm font-semibold uppercase tracking-editorial">GlobTrek</Link><AccountEntry compact light /></header>
    <section className="relative min-h-[72svh] overflow-hidden"><Image src={trip.image} alt={`${trip.city}, ${trip.country}`} fill priority className="object-cover" sizes="100vw" quality={88} /><div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" /><div className="absolute inset-x-6 bottom-14 text-white sm:inset-x-12"><p className="text-micro uppercase tracking-editorial text-white/70">Your complete trip</p><h1 className="mt-4 font-serif text-[clamp(3.5rem,9vw,8rem)] leading-[.82] tracking-tight-3">{trip.city}</h1><p className="mt-6 text-micro uppercase tracking-editorial">{trip.plan.days.length} days · {trip.country}</p></div></section>
    <section className="mx-auto max-w-[1460px] px-6 pb-24 sm:px-12">
      <div className="grid gap-px bg-black/10 sm:grid-cols-[1fr_auto_auto_auto_auto]"><div className="bg-canvas px-5 py-5"><p className="text-micro uppercase tracking-editorial text-black/40">Complete itinerary</p><p className="mt-2 font-serif text-xl">Every day, one shared plan.</p></div>{!id.startsWith("s_") ? <SaveTripButton trip={savedTrip} className="min-h-20 bg-canvas px-7 text-micro uppercase tracking-editorial hover:bg-white" /> : null}<EmailTripButton trip={savedTrip} viewUrl={`/trip/${id}`} className="min-h-20 bg-canvas px-7 text-micro uppercase tracking-editorial hover:bg-white" />{id !== "current" && !id.startsWith("s_") ? <ShareTripButton tripId={id} className="min-h-20 bg-canvas px-7 text-micro uppercase tracking-editorial hover:bg-white" /> : null}<Link href="/results" className="grid min-h-20 place-items-center bg-canvas px-7 text-micro uppercase tracking-editorial hover:bg-white">Back to overview</Link></div>
      <ItineraryDocument trip={trip} quiz={quiz} previewDays={trip.plan.days.length} />
    </section>
  </main>;
}

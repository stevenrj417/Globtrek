"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { destinations } from "../data/destinations";
import { normalizeTravelerProfile } from "../lib/recommendation/travelerProfile";
import { rankDestinations } from "../lib/recommendation/destinationEngine";

function decodeTrip(value) {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export default function AlternativesPage() {
  const [context, setContext] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedTrip = params.get("trip");
    const shared = encodedTrip ? decodeTrip(encodedTrip) : null;
    const raw = window.localStorage.getItem("globtrekQuiz");
    const quiz = shared?.quiz || (raw ? JSON.parse(raw) : { answers: {} });
    const timer = window.setTimeout(() => setContext({ quiz, current: shared?.destination || null, encodedTrip }), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!context) return <main className="min-h-screen bg-[#f3f0eb]" />;
  const alternatives = rankDestinations(destinations, normalizeTravelerProfile(context.quiz))
    .filter((place) => (place.id || place.airport) !== context.current);

  return <main className="min-h-screen bg-[#f3f0eb] text-[#171714]">
    <header className="flex items-center justify-between border-b border-black/10 px-6 py-7 sm:px-12">
      <Link href="/" className="text-[13px] font-semibold uppercase tracking-[0.32em]">Globtrēk</Link>
      <Link href={context.encodedTrip ? `/results?trip=${context.encodedTrip}` : "/results"} className="text-[9px] uppercase tracking-[0.2em] text-black/50 transition hover:text-black">Back to your result</Link>
    </header>

    <section className="mx-auto max-w-[1460px] px-6 py-16 sm:px-12 sm:py-24">
      <div className="max-w-3xl border-b border-black/15 pb-12">
        <p className="text-[9px] uppercase tracking-[0.25em] text-black/40">Other destinations</p>
        <h1 className="mt-5 font-serif text-[clamp(3rem,7vw,7rem)] leading-[0.88] tracking-[-0.05em]">Find a better fit.</h1>
        <p className="mt-7 max-w-xl text-sm font-light leading-6 text-black/55">These places are ranked from the same travel preferences. Choose one to see its complete GlobTrek plan.</p>
      </div>

      <div className="grid gap-x-6 gap-y-12 pt-10 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((place, index) => <Link key={place.id || place.airport} href={`/results?destination=${encodeURIComponent(place.id || place.airport)}`} className="group block" aria-label={`See your trip to ${place.city}`}>
          <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
            <Image src={place.image} alt={`${place.city}, ${place.country}`} fill className="object-cover transition duration-700 group-hover:scale-[1.035]" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" quality={82} />
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 text-[8px] uppercase tracking-[0.18em]">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <div className="flex items-end justify-between gap-5 border-b border-black/10 py-5">
            <div><h2 className="font-serif text-2xl">{place.city}</h2><p className="mt-2 text-[8px] uppercase tracking-[0.18em] text-black/45">{place.country} · {place.season}</p></div>
            <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
          </div>
        </Link>)}
      </div>
    </section>
  </main>;
}

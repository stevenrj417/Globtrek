"use client";

import { useEffect, useState } from "react";

const words = ["Finding the right places", "Building your days", "Refining your route", "Adding the finishing touches"];

export default function ThinkingPage() {
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const ticker = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 520);
    const close = window.setTimeout(() => setClosing(true), 3000);
    const destination = new URLSearchParams(window.location.search).get("destination");
    const redirect = window.setTimeout(() => window.location.assign(destination ? `/results?destination=${encodeURIComponent(destination)}` : "/results"), 3900);
    return () => { window.clearInterval(ticker); window.clearTimeout(close); window.clearTimeout(redirect); };
  }, []);

  return (
    <main className={`relative grid min-h-svh overflow-hidden bg-canvas text-ink transition duration-700 ${closing ? "scale-[1.025] opacity-0" : "scale-100 opacity-100"}`}>
      <div className="absolute left-6 top-7 text-eyebrow font-semibold uppercase tracking-editorial sm:left-12 sm:top-10">GlobTrek</div>
      <section className="grid place-items-center px-6 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 animate-spin place-items-center rounded-full border border-black/15 border-t-black text-micro font-semibold uppercase tracking-label">GT</span>
          <h1 className="mt-9 font-serif text-[clamp(2.5rem,6vw,5rem)] tracking-tight-3">Custom itinerary loading…</h1>
          <p className="mt-4 text-xs font-light text-black/45">Building your trip around the way you travel.</p>
          <p key={words[index]} className="result-word mt-10 text-micro uppercase tracking-editorial text-black/35">{words[index]}</p>
        </div>
      </section>
    </main>
  );
}

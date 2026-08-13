"use client";

import { useEffect, useState } from "react";

const words = ["PLACE", "PACE", "LIGHT", "TASTE", "TIME"];

export default function ThinkingPage() {
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const ticker = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 520);
    const close = window.setTimeout(() => setClosing(true), 3000);
    const redirect = window.setTimeout(() => window.location.assign("/results"), 3900);
    return () => { window.clearInterval(ticker); window.clearTimeout(close); window.clearTimeout(redirect); };
  }, []);

  return (
    <main className={`relative grid min-h-svh overflow-hidden bg-[#f3f0eb] text-[#171714] transition duration-700 ${closing ? "scale-[1.025] opacity-0" : "scale-100 opacity-100"}`}>
      <div className="absolute left-6 top-7 text-[12px] font-semibold uppercase tracking-[0.32em] sm:left-12 sm:top-10">Globtrēk</div>
      <div className="absolute right-6 top-7 text-[9px] uppercase tracking-[0.25em] text-black/45 sm:right-12 sm:top-10">Finding your place</div>
      <section className="grid place-items-center px-6 text-center">
        <div>
          <p className="text-[9px] uppercase tracking-[0.35em] text-black/45">Reading the way you travel</p>
          <div className="mt-10 h-[clamp(4rem,11vw,10rem)] overflow-hidden">
            <p key={words[index]} className="result-word font-serif text-[clamp(4rem,11vw,10rem)] leading-none tracking-[-0.055em]">{words[index]}</p>
          </div>
          <div className="mx-auto mt-12 h-px w-52 overflow-hidden bg-black/10 sm:w-80"><span className="result-progress block h-full bg-black" /></div>
        </div>
      </section>
      <p className="absolute inset-x-0 bottom-8 text-center text-[9px] uppercase tracking-[0.25em] text-black/40">Your answer is almost here</p>
    </main>
  );
}

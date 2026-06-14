"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const thoughts = [
  "Reading your travel mood",
  "Comparing pace, place, and season",
  "Scoring destinations against your answers",
  "Building your reveal",
];

export default function ThinkingPage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const ticker = window.setInterval(() => {
      setIndex((current) => Math.min(current + 1, thoughts.length - 1));
    }, 650);
    const redirect = window.setTimeout(() => {
      window.location.assign("/results");
    }, 3100);

    return () => {
      window.clearInterval(ticker);
      window.clearTimeout(redirect);
    };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#070604] px-6 text-[#efe6dc]">
      <section className="w-full max-w-3xl border-y border-[#efe6dc]/10 py-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#b8a796]">
          Globtrek AI · Coming Soon
        </p>
        <h1 className="mt-6 text-[clamp(2.4rem,6vw,5rem)] font-light leading-[0.95]">
          Thinking through your trip
        </h1>
        <div className="mx-auto mt-10 h-px max-w-md bg-[#efe6dc]/10">
          <div
            className="h-px bg-[#efe6dc] transition-all duration-700"
            style={{ width: `${((index + 1) / thoughts.length) * 100}%` }}
          />
        </div>
        <p className="mt-8 text-sm uppercase tracking-[0.18em] text-[#d8c7b6]">
          {thoughts[index]}
        </p>
        <Link
          className="mt-12 inline-block text-xs uppercase tracking-[0.18em] text-[#8f857b] transition hover:text-[#efe6dc]"
          href="/results"
        >
          Skip wait
        </Link>
      </section>
    </main>
  );
}

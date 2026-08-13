"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "../components/BrandMark";

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
    <main className="grid min-h-screen place-items-center bg-[#f7f7f4] px-6 text-[#171717]">
      <section className="w-full max-w-3xl border-y border-black/10 py-16 text-center">
        <BrandMark className="mx-auto mb-7" />
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#707070]">
          Finding your trip
        </p>
        <h1 className="mt-6 text-[clamp(2.4rem,6vw,5rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
          Matching what matters.
        </h1>
        <div className="mx-auto mt-10 h-px max-w-md bg-black/10">
          <div
            className="h-px bg-black transition-all duration-700"
            style={{ width: `${((index + 1) / thoughts.length) * 100}%` }}
          />
        </div>
        <p className="mt-8 text-sm text-[#606060]">
          {thoughts[index]}
        </p>
        <Link
          className="mt-12 inline-block text-xs font-medium text-[#707070] underline decoration-black/20 transition hover:text-black hover:decoration-black"
          href="/results"
        >
          Skip wait
        </Link>
      </section>
    </main>
  );
}

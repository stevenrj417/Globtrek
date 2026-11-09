"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PREFETCH_KEY } from "../lib/matchPrefetch";

// Each line corresponds to work the matcher really does for every candidate trip.
const STEPS = ["Reading your answers", "Pricing round-trip flights", "Finding stays under your budget", "Adding food, transit and taxes", "Picking free and cheap things to do", "Checking the total against your budget", "Putting your trip together"];
// A short, honest wait reads as more careful work than an instant answer, so
// the screen stays up for at least MIN_MS even when the matcher is faster.
const MIN_MS = 4200;
const MAX_MS = 6500;

const ROUTE = "M -40 230 C 260 40, 640 40, 1040 190";
const PLANE = "M 18 0 L -6 -4 L -14 -16 L -19 -16 L -13 -3 L -24 -2 L -29 -8 L -32 -8 L -29 0 L -32 8 L -29 8 L -24 2 L -13 3 L -19 16 L -14 16 L -6 4 Z";

// A plane flying a dotted route across the screen. With reduced motion it is
// drawn parked partway along the route instead.
function FlightPath() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return <svg aria-hidden="true" viewBox="0 0 1000 280" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-x-0 top-[10%] h-[38vh] w-full text-ink">
    <path id="flight-route" d={ROUTE} fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 9" />
    {still ? <path d={PLANE} fill="currentColor" transform="translate(520 92) rotate(-4)" /> : <>
      <path d={ROUTE} fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1200" strokeDashoffset="1200">
        <animate attributeName="stroke-dashoffset" values="1200;0" dur="4.2s" repeatCount="indefinite" calcMode="spline" keySplines=".45 .05 .35 1" />
      </path>
      <path d={PLANE} fill="currentColor">
        <animateMotion dur="4.2s" repeatCount="indefinite" rotate="auto" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".45 .05 .35 1"><mpath href="#flight-route" /></animateMotion>
      </path>
    </>}
  </svg>;
}

export default function ThinkingPage() {
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef(0);

  const run = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const destination = params.get("destination");
    const target = destination ? `/results?destination=${encodeURIComponent(destination)}` : "/results";
    let quiz = null;
    try { quiz = JSON.parse(window.localStorage.getItem("globtrekQuiz") || "null"); } catch {}
    if (!quiz) { window.location.replace("/discover"); return () => {}; }

    started.current = performance.now();
    const ticks = STEPS.slice(1).map((_, index) => window.setTimeout(() => setDone((value) => Math.max(value, index + 1)), ((index + 1) * MIN_MS) / STEPS.length));
    let finished = false;
    const go = () => { if (finished) return; finished = true; setDone(STEPS.length); window.setTimeout(() => window.location.assign(target), 180); };
    const cap = window.setTimeout(go, MAX_MS);

    fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...quiz, destination }) })
      .then((response) => { if (!response.ok) throw new Error("match_failed"); return response.json(); })
      .then((data) => {
        try { window.sessionStorage.setItem(PREFETCH_KEY, JSON.stringify({ createdAt: quiz.createdAt || null, destination: destination || null, matches: data.matches || [] })); } catch {}
        const hero = data.matches?.[0]?.image;
        if (hero) { const image = new window.Image(); image.src = hero; }
        window.setTimeout(go, Math.max(0, MIN_MS - (performance.now() - started.current)));
      })
      .catch(() => {
        // The results page can still build a trip locally; only stop when we're offline.
        if (navigator.onLine === false) { finished = true; window.clearTimeout(cap); setFailed(true); return; }
        window.setTimeout(go, Math.max(0, MIN_MS - (performance.now() - started.current)));
      });

    return () => { ticks.forEach(window.clearTimeout); window.clearTimeout(cap); };
  }, []);

  useEffect(() => run(), [run]);

  function retry() { setFailed(false); setDone(0); run(); }

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-canvas px-6 text-ink">
      {failed ? null : <FlightPath />}
      <div className="absolute left-6 top-7 text-eyebrow font-semibold uppercase tracking-editorial sm:left-12 sm:top-10">GlobTrek</div>
      {failed ? <section className="max-w-md text-center" role="alert">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.1] tracking-tight-3">We couldn&apos;t build your trip.</h1>
        <p className="mt-4 text-base leading-7 text-muted">Check your connection and try again. Your answers are saved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className="btn btn-primary">Try again</button>
          <Link href="/discover" className="btn btn-secondary">Edit answers</Link>
        </div>
      </section> : <section className="relative z-10 mt-[22vh] w-full max-w-sm sm:mt-[18vh]">
        <h1 className="font-serif text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.1] tracking-tight-3">Building your trip</h1>
        <div className="mt-8 h-px w-full bg-black/15" aria-hidden="true"><div className="h-px bg-ink transition-[width] duration-300 ease-[cubic-bezier(.2,0,0,1)]" style={{ width: `${(Math.max(done, 0.4) / STEPS.length) * 100}%` }} /></div>
        <ol className="mt-6 space-y-3" aria-live="polite">
          {STEPS.map((label, index) => {
            const state = index < done ? "done" : index === done ? "active" : "pending";
            return <li key={label} className={`flex items-center gap-3 text-sm transition-colors duration-200 ${state === "pending" ? "text-subtle" : "text-ink"}`} aria-current={state === "active" ? "step" : undefined}>
              <span aria-hidden="true" className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-micro leading-none ${state === "done" ? "border-ink bg-ink text-white" : "border-black/25"}`}>{state === "done" ? "✓" : ""}</span>
              {label}{state === "done" ? <span className="sr-only"> (done)</span> : null}
            </li>;
          })}
        </ol>
      </section>}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PREFETCH_KEY } from "../lib/matchPrefetch";

const STEPS = ["Matching your answers", "Finding stays under your budget", "Picking dinners and things to do", "Putting your trip together"];
const MIN_MS = 1200;
const MAX_MS = 2500;

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
    const ticks = [1, 2, 3].map((count, index) => window.setTimeout(() => setDone((value) => Math.max(value, count)), ((index + 1) * MIN_MS) / 4));
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
    <main className="grid min-h-svh place-items-center bg-canvas px-6 text-ink">
      <div className="absolute left-6 top-7 text-eyebrow font-semibold uppercase tracking-editorial sm:left-12 sm:top-10">GlobTrek</div>
      {failed ? <section className="max-w-md text-center" role="alert">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.1] tracking-tight-3">We couldn&apos;t build your trip.</h1>
        <p className="mt-4 text-base leading-7 text-muted">Check your connection and try again. Your answers are saved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className="btn btn-primary">Try again</button>
          <Link href="/discover" className="btn btn-secondary">Edit answers</Link>
        </div>
      </section> : <section className="w-full max-w-sm">
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

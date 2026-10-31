"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { handoffContext, isPartnerUrl } from "../lib/handoff";

const HANDOFF_MS = 850;

function formatDay(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default function HandoffPage() {
  const [handoff, setHandoff] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to") || "";
    const valid = isPartnerUrl(to);
    const next = { to, valid, partner: params.get("partner") || "our partner", name: params.get("name") || "", ...handoffContext(to) };
    const show = window.setTimeout(() => setHandoff(next), 0);
    const redirect = valid ? window.setTimeout(() => window.location.replace(to), HANDOFF_MS) : null;
    return () => { window.clearTimeout(show); if (redirect) window.clearTimeout(redirect); };
  }, []);

  if (!handoff) return <main className="min-h-svh bg-canvas" />;

  if (!handoff.valid) return <main className="grid min-h-svh place-items-center bg-canvas px-6 text-center text-ink">
    <div>
      <h1 className="text-3xl font-semibold tracking-tight-2">This link isn&apos;t one of ours.</h1>
      <p className="mt-3 text-muted">For your safety, GlobTrek only sends you to its booking partners.</p>
      <Link href="/" className="btn btn-primary mt-8">Go home</Link>
    </div>
  </main>;

  const dates = handoff.checkin && handoff.checkout ? `${formatDay(handoff.checkin)}–${formatDay(handoff.checkout)}` : null;
  const travelers = handoff.adults ? `${handoff.adults} traveler${handoff.adults === 1 ? "" : "s"}` : null;
  const details = [handoff.name, dates, travelers].filter(Boolean).join(" · ");

  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-6 text-center text-ink">
      <div className="max-w-lg" aria-live="polite">
        <p className="text-eyebrow font-semibold uppercase tracking-editorial">GlobTrek</p>
        <h1 className="mt-8 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.15] tracking-tight-2">Taking you to {handoff.partner} to check live prices</h1>
        {details ? <p className="tabular mt-3 text-base text-muted">{details}</p> : null}
        <div className="mx-auto mt-8 h-px w-40 overflow-hidden bg-black/15" aria-hidden="true"><div className="handoff-bar h-px bg-ink" /></div>
        <a href={handoff.to} rel="noopener sponsored" className="mt-8 inline-flex min-h-11 items-center text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">Continue now</a>
        <p className="mt-6 text-xs text-subtle">GlobTrek may earn a commission. Your price doesn&apos;t change.</p>
      </div>
    </main>
  );
}

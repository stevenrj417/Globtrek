"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { ASSISTANT_INSTALL_URL, assistantRequest, assistantTrip, canUseExtension, onAssistantStatus } from "../lib/booking/assistant";

const SESSION_KEY = (tripKey) => `globtrek:assistant-session:${tripKey}`;

// "Book my trip": hands the checklist to the GlobTrek Booking Assistant extension
// when it's installed, explains it when it isn't, and says plainly when the
// device can't run it. The checklist below always works on its own.
export function BookingAssistant({ entries, trip, tripKey, onStatuses }) {
  const [state, setState] = useState("checking");
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);
  const payload = assistantTrip({ entries, ...trip });

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAssistantStatus((status) => {
      if (status.sessionId !== session?.sessionId && status.sessionId !== readSession()) return;
      setSession(status);
      onStatuses?.(status);
    });
    function readSession() {
      try { return window.sessionStorage.getItem(SESSION_KEY(tripKey)); } catch { return null; }
    }
    (async () => {
      if (!canUseExtension(window.navigator)) { if (!cancelled) setState("unsupported"); return; }
      const pong = await assistantRequest("PING", {}, { timeoutMs: 900 });
      if (cancelled) return;
      if (!pong?.ok) { setState("absent"); return; }
      setState("present");
      const existing = readSession();
      if (existing) {
        const status = await assistantRequest("GET_STATUS", { sessionId: existing });
        if (!cancelled && status?.ok) { setSession(status.status); onStatuses?.(status.status); }
      }
    })();
    return () => { cancelled = true; unsubscribe(); };
  }, [tripKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    if (state !== "present") { dialog.current?.showModal(); track("assistant_install_prompt", { state }); return; }
    if (!payload) return;
    if (session) {
      // Bring back the assistant tab for this trip rather than starting a second checklist.
      const reopened = await assistantRequest("OPEN_SESSION", { sessionId: session.sessionId });
      if (reopened?.ok) return;
    }
    setBusy(true);
    setError("");
    const response = await assistantRequest("START_SESSION", { trip: payload }, { timeoutMs: 5000 });
    setBusy(false);
    if (!response?.ok) { setError("The assistant couldn't start. Open each booking below instead."); return; }
    try { window.sessionStorage.setItem(SESSION_KEY(tripKey), response.sessionId); } catch {}
    setSession(response.status);
    onStatuses?.(response.status);
    track("assistant_session_started", { items: payload.items.length });
  }

  if (!payload) return null;
  const done = session ? session.items.filter((item) => item.status === "user_complete").length : 0;
  const attention = session ? session.items.filter((item) => item.status === "needs_attention" || item.status === "failed_safely").length : 0;

  return <div className="mt-5 border border-black/15 bg-surface p-5 sm:p-6">
    {state === "unsupported" ? <>
      <p className="text-micro uppercase tracking-label text-black/55">One-tab booking</p>
      <p className="mt-2 text-sm leading-6">The GlobTrek Booking Assistant runs in Chrome on a computer. On this device, open each booking below — this page keeps your checklist. <Link href="/booking-assistant" className="underline decoration-black/25 underline-offset-4 hover:decoration-ink">How the assistant works</Link></p>
    </> : <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-micro uppercase tracking-label text-black/55">{session ? "Booking assistant · in progress" : "One-tab booking"}</p>
        {session ? <p className="tabular mt-2 text-sm leading-6" aria-live="polite">{done} of {session.items.length} marked booked{attention ? ` · ${attention} need${attention === 1 ? "s" : ""} you` : ""}. The assistant tab has your checklist and copy buttons; statuses appear below too.</p>
          : <p className="mt-2 max-w-xl text-sm leading-6">Open {payload.items.length === 1 ? "your booking" : `all ${payload.items.length} bookings`} at once. You pay each provider on their site.</p>}
        {error ? <p role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>
      <button type="button" onClick={start} disabled={state === "checking" || busy} aria-haspopup={state === "present" ? undefined : "dialog"} className="inline-flex min-h-12 items-center justify-center gap-2 bg-black px-6 text-micro font-medium uppercase tracking-label text-white disabled:opacity-40">
        {state === "checking" ? "Checking…" : busy ? "Opening…" : session ? "Open the assistant again" : "Book my trip"} <span aria-hidden="true">→</span>
      </button>
    </div>}
    <dialog ref={dialog} aria-labelledby="assistant-install-title" className="m-auto w-[min(560px,calc(100%-2rem))] border border-black/20 bg-surface-raised p-0 text-ink shadow-overlay backdrop:bg-black/35">
      <div className="p-6 sm:p-8">
        <p className="text-micro uppercase tracking-label text-black/55">GlobTrek Booking Assistant</p>
        <h3 id="assistant-install-title" className="mt-3 font-serif text-[clamp(1.6rem,3vw,2.1rem)] leading-[1.02] tracking-tight-2">Book every piece of this trip from one tab.</h3>
        <ul className="mt-5 space-y-2 text-sm leading-6 text-black/75">
          <li>Opens your stay, flight, activities and dinners with GlobTrek&apos;s exact links.</li>
          <li>Fills your name and contact details where the partner allows it; copy buttons everywhere else.</li>
          <li>Stops before anything is booked. You review and pay on the partner&apos;s site.</li>
          <li>No account. Your details stay on your computer; card numbers are never stored.</li>
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href={ASSISTANT_INSTALL_URL} className="btn btn-primary" onClick={() => track("assistant_install_clicked")}>Add to Chrome</a>
          <button type="button" className="btn btn-secondary" onClick={() => dialog.current?.close()}>Book without it</button>
        </div>
        <p className="mt-4 text-xs leading-5 text-black/55">Free. Installs from the Chrome Web Store. <Link href="/booking-assistant/privacy" className="underline decoration-black/25 underline-offset-2">Privacy policy</Link></p>
      </div>
    </dialog>
  </div>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { isCjUrl } from "../lib/booking/cj";
import { BrandMark } from "./BrandMark";
import { ASSISTANT_INSTALL_URL, assistantRequest, assistantTrip, canUseExtension, onAssistantStatus, supportsOpenAll } from "../lib/booking/assistant";

const SESSION_KEY = (tripKey) => `globtrek:assistant-session:${tripKey}`;

// The booking page's assistant block. Installed: one button opens every booking.
// Not installed (desktop Chrome): what it does and Add to Chrome. Other devices:
// one line. The checklist below always works on its own.
export function BookingAssistant({ entries, trip, tripKey, onStatuses }) {
  const [state, setState] = useState("checking");
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState("");
  const payload = assistantTrip({ entries, ...trip });
  const itemCount = payload?.items.length ?? 0;

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
      setVersion(typeof pong.version === "string" ? pong.version : "");
      const existing = readSession();
      if (existing) {
        const status = await assistantRequest("GET_STATUS", { sessionId: existing });
        if (!cancelled && status?.ok) { setSession(status.status); onStatuses?.(status.status); }
      }
    })();
    return () => { cancelled = true; unsubscribe(); };
  }, [tripKey]); // eslint-disable-line react-hooks/exhaustive-deps


  async function start({ openAll = false } = {}) {
    if (state !== "present") return;
    if (!payload) return;
    if (session) {
      // Bring back the assistant tab for this trip rather than starting a second checklist.
      const reopened = await assistantRequest("OPEN_SESSION", { sessionId: session.sessionId });
      if (reopened?.ok) return;
    }
    setBusy(true);
    setError("");
    // openAll opens every booking tab straight away; older versions open the assistant tab and let the traveler choose.
    const response = await assistantRequest("START_SESSION", { trip: payload, ...(openAll && supportsOpenAll(version) ? { openAll: true } : {}) }, { timeoutMs: 8000 });
    setBusy(false);
    if (!response?.ok) { setError("The assistant couldn't start. Open each booking below instead."); return; }
    try { window.sessionStorage.setItem(SESSION_KEY(tripKey), response.sessionId); } catch {}
    setSession(response.status);
    onStatuses?.(response.status);
    track("assistant_session_started", { items: payload.items.length, openAll });
  }

  if (!payload || state === "checking") return payload ? <div className="mt-6 h-[22rem] bg-white" aria-hidden="true" /> : null;
  if (state === "unsupported") return <p className="mt-5 text-sm leading-6">On a computer with Chrome, the free <Link href="/booking-assistant" className="underline underline-offset-4">GlobTrek Booking Assistant</Link> opens all of these at once.</p>;
  const done = session ? session.items.filter((item) => item.status === "user_complete").length : 0;
  const attention = session ? session.items.filter((item) => item.status === "needs_attention" || item.status === "failed_safely").length : 0;
  const installed = state === "present";
  const all = itemCount === 1 ? "your booking" : `all ${itemCount} bookings`;

  return <section aria-labelledby="assistant-heading" className="mt-6 grid overflow-hidden bg-white lg:grid-cols-[1fr_1.05fr]">
    <div className="flex flex-col p-7 sm:p-10">
      <p className="text-sm">GlobTrek Booking Assistant · free for Chrome</p>
      <h2 id="assistant-heading" className="mt-5 font-serif text-[clamp(2rem,3.4vw,2.9rem)] leading-[1] tracking-tight-3">
        {session ? `${done} of ${session.items.length} booked.` : installed ? `Open ${all} in one click.` : "Book the whole trip from one tab."}
      </h2>
      {session ? <p className="tabular mt-4 text-base leading-7" aria-live="polite">Your bookings are open in Chrome.{attention ? ` ${attention} need${attention === 1 ? "s" : ""} you.` : ""} The assistant tab keeps your details one click away.</p>
        : <ul className="mt-6 space-y-3 text-base leading-6">
          {[itemCount === 1 ? "Opens your booking with your dates and travelers" : `Opens ${all} at once, with your dates and travelers`, "Your details ready to fill or copy on each site", "Stops before payment. You review and pay yourself"].map((line) => <li key={line} className="flex gap-3"><span aria-hidden="true" className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-black text-[11px] text-white">✓</span>{line}</li>)}
        </ul>}
      {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 lg:mt-auto lg:pt-8">
        {installed ? <button type="button" onClick={() => start({ openAll: true })} disabled={busy} className="inline-flex min-h-14 items-center gap-3 bg-black px-8 text-micro font-medium uppercase tracking-label text-white disabled:opacity-40">
          {busy ? "Opening…" : session ? "Go to the assistant" : itemCount === 1 ? "Open my booking" : `Open all ${itemCount} bookings`} <span aria-hidden="true">→</span>
        </button> : <a href={ASSISTANT_INSTALL_URL} onClick={() => track("assistant_install_clicked", { from: "book" })} className="inline-flex min-h-14 items-center gap-3 bg-black px-8 text-micro font-medium uppercase tracking-label text-white">Add to Chrome, free <span aria-hidden="true">↗</span></a>}
        <Link href="/booking-assistant" className="text-sm underline underline-offset-4">How it works</Link>
      </div>
      {installed ? null : <p className="mt-4 text-xs">No account. Your details stay on your computer. <Link href="/booking-assistant/privacy" className="underline underline-offset-2">Privacy</Link></p>}
    </div>
    <TabsPreview items={payload.items} city={payload.destination.city.toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (letter) => letter.toUpperCase())} statuses={session?.items} />
  </section>;
}

function partnerName(url) {
  if (isCjUrl(url)) return "Booking.com";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.endsWith("booking.com")) return "Booking.com";
    if (host.endsWith("google.com")) return "Google Maps";
    if (host.endsWith("getyourguide.com")) return "GetYourGuide";
    if (host.endsWith("wegotrip.com")) return "WeGoTrip";
    if (host.includes("opentable")) return "OpenTable";
    return host;
  } catch { return "Partner"; }
}

const KIND = { hotel: "Stay", flight: "Flight", experience: "Activity", restaurant: "Dinner" };

// A drawing of the browser after one click: the assistant tab plus one tab per
// booking, using this trip's real bookings. Decorative; the checklist below is
// the real list.
function TabsPreview({ items, city, statuses }) {
  const shown = items.slice(0, 4);
  const status = (id) => statuses?.find((entry) => entry.id === id)?.status;
  return <div aria-hidden="true" className="relative hidden bg-canvas p-8 lg:flex lg:items-center lg:justify-center">
    <div className="w-full max-w-[30rem] overflow-hidden rounded-xl bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)] ring-1 ring-black/10">
      <div className="flex items-end gap-1 bg-[#ececea] px-3 pt-3">
        <span className="mb-2.5 mr-2 flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></span>
        <span className="flex items-center rounded-t-lg bg-white px-3 py-2"><BrandMark className="!h-3.5 !w-6" /></span>
        {shown.map((item) => <span key={item.id} className="min-w-0 flex-1 truncate rounded-t-lg bg-[#dcdcd9] px-2.5 py-2 text-center text-[11px]">{partnerName(item.url)}</span>)}
      </div>
      <div className="p-6">
        <p className="font-serif text-2xl leading-none tracking-tight-2">{city}</p>
        <ul className="mt-5 divide-y divide-black/10 border-y border-black/10">
          {shown.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-3">
            <span className="min-w-0"><span className="block text-[10px] uppercase tracking-label">{KIND[item.type] || "Booking"}</span><span className="block truncate text-sm font-medium">{item.name}</span></span>
            <span className="shrink-0 text-[11px]">{status(item.id) === "user_complete" ? "✓ Booked" : "● Opened"}</span>
          </li>)}
        </ul>
        {items.length > shown.length ? <p className="mt-3 text-[11px]">+{items.length - shown.length} more</p> : null}
        <p className="mt-5 inline-flex rounded-full bg-black px-3 py-1.5 text-[11px] text-white">Stops before payment</p>
      </div>
    </div>
  </div>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { ASSISTANT_INSTALL_URL, assistantRequest, canUseExtension, subscribeAssistantTrip } from "../lib/booking/assistant";

const INSTALL_DISMISSED = "globtrek:assistant-prompt:install";
const TRIP_DISMISSED = (tripKey) => `globtrek:assistant-prompt:${tripKey}`;

function remembered(storage, key) {
  try { return window[storage].getItem(key) === "1"; } catch { return false; }
}

function remember(storage, key) {
  try { window[storage].setItem(key, "1"); } catch {}
}

// The small corner card on trip pages, desktop Chrome only. With the assistant
// installed it asks once whether to book the trip from one tab; without it, it
// says the assistant exists. Never on other pages: an install pitch everywhere
// reads as an ad. Either card can be dismissed.
export function AssistantPrompt() {
  const pathname = usePathname();
  const [installed, setInstalled] = useState(null);
  const [trip, setTrip] = useState(null);
  const [dismissed, setDismissed] = useState("");
  const [opened, setOpened] = useState(0);

  useEffect(() => subscribeAssistantTrip(setTrip), []);

  useEffect(() => {
    let cancelled = false;
    if (!canUseExtension(window.navigator)) return undefined;
    // Let the page settle first; the corner card is never the first thing to appear.
    const timer = setTimeout(async () => {
      const pong = await assistantRequest("PING", {}, { timeoutMs: 900 });
      if (!cancelled) setInstalled(Boolean(pong?.ok));
    }, 1200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const mode = installed === null || pathname?.startsWith("/booking-assistant") ? null
    : installed ? (trip?.state === "present" && !trip.session && trip.items ? "accept" : opened ? "opened" : null)
    : trip?.items && !remembered("localStorage", INSTALL_DISMISSED) ? "install" : null;
  const tripKey = trip?.tripKey || "";

  useEffect(() => {
    if (!opened) return undefined;
    const timer = setTimeout(() => setOpened(0), 9000);
    return () => clearTimeout(timer);
  }, [opened]);

  if (!mode || dismissed === `${mode}:${tripKey}` || (mode === "accept" && remembered("sessionStorage", TRIP_DISMISSED(tripKey)))) return null;

  function dismiss() {
    if (mode === "install") remember("localStorage", INSTALL_DISMISSED);
    if (mode === "accept") remember("sessionStorage", TRIP_DISMISSED(tripKey));
    track("assistant_prompt_dismissed", { mode });
    setDismissed(`${mode}:${tripKey}`);
    setOpened(0);
  }

  async function accept() {
    const count = trip.items;
    track("assistant_prompt_accepted", { items: count });
    await trip.start({ openAll: true });
    setOpened(count);
  }

  return <aside aria-label="GlobTrek Booking Assistant" className="fixed bottom-24 right-6 z-50 hidden w-[22rem] border border-black/10 bg-surface p-5 text-ink shadow-overlay sm:block">
    <div className="flex items-start justify-between gap-4">
      <p className="text-micro uppercase tracking-label text-black/55">{mode === "install" ? "New · Booking assistant" : "Booking assistant"}</p>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="-mr-2 -mt-2 grid h-8 w-8 place-items-center text-lg leading-none text-black/55 hover:text-ink">×</button>
    </div>
    {mode === "install" ? <>
      <p className="mt-2 font-serif text-xl leading-tight tracking-tight-2">Book your whole trip from one tab.</p>
      <p className="mt-2 text-sm leading-6 text-black/70">A free Chrome extension. It opens every booking and fills your details where the partner allows. You review and pay yourself.</p>
      <div className="mt-4 flex items-center gap-4">
        <a href={ASSISTANT_INSTALL_URL} onClick={() => track("assistant_install_clicked", { from: "prompt" })} className="inline-flex min-h-10 items-center bg-black px-5 text-micro font-medium uppercase tracking-label text-white">Add to Chrome</a>
        <Link href="/booking-assistant" className="text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">How it works</Link>
      </div>
    </> : mode === "accept" ? <>
      <p className="mt-2 font-serif text-xl leading-tight tracking-tight-2">Book this trip from one tab?</p>
      <p className="mt-2 text-sm leading-6 text-black/70">Opens {trip.items === 1 ? "your booking" : `all ${trip.items} bookings`}, fills your details where the partner allows, and stops before you pay.</p>
      <div className="mt-4 flex items-center gap-4">
        <button type="button" onClick={accept} disabled={trip.busy} className="inline-flex min-h-10 items-center bg-black px-5 text-micro font-medium uppercase tracking-label text-white disabled:opacity-40">{trip.busy ? "Opening…" : "Accept"}</button>
        <button type="button" onClick={dismiss} className="text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">Not now</button>
      </div>
    </> : <p role="status" className="mt-2 text-sm leading-6">Opened {opened === 1 ? "your booking" : `${opened} bookings`}. The GlobTrek Assistant tab has your checklist and copy buttons.</p>}
  </aside>;
}

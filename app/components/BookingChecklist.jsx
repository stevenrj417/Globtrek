"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { isCjUrl } from "../lib/booking/cj";
import { checklistItems } from "../lib/booking/checklist";
import { ASSISTANT_STATUS_LABELS, assistantEntries } from "../lib/booking/assistant";
import { BookingAssistant } from "./BookingAssistant";

export { checklistItems };

const LABELS = { hotel: "Stay", flight: "Flight", experience: "Activity", restaurant: "Dinner reservation" };

function partner(url) {
  if (isCjUrl(url)) return "Booking.com";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "partner site"; }
}

function storageKey(tripKey) {
  return `globtrek:booked:${tripKey}`;
}

// The booking center: one row per booking, each opened by the traveler on the
// partner's site in a new tab, with a "booked" check the traveler controls.
// Nothing opens on its own and nothing is submitted for the traveler.
// datesSet: false while the trip has flexible dates. Partner pages then open
// without dates (to check current prices), and the combined "open everything"
// assistant stays hidden until exact dates are chosen.
export function BookingChecklist({ entries, tripKey, details = null, id = "booking-center", heading = "Your booking checklist", trip = null, datesSet = true, datesLabel = null }) {
  const items = checklistItems(entries);
  const [done, setDone] = useState({});
  // Status from the Booking Assistant extension, keyed by its item id (statuses only — never traveler details).
  const [assistant, setAssistant] = useState({});
  const assistantIds = new Map(assistantEntries(entries).map(({ entry, id: itemId }) => [entry.exactUrl, itemId]));

  useEffect(() => {
    const timer = setTimeout(() => {
      // Merge, so a box ticked before this runs is kept.
      let stored = {};
      try { stored = JSON.parse(window.localStorage.getItem(storageKey(tripKey)) || "{}"); } catch {}
      setDone((current) => ({ ...stored, ...current }));
    });
    return () => clearTimeout(timer);
  }, [tripKey]);

  function toggle(itemId) {
    setDone((current) => {
      const next = { ...current, [itemId]: !current[itemId] };
      try { window.localStorage.setItem(storageKey(tripKey), JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const count = items.filter((item) => done[item.id]).length;
  return <section id={id} className="scroll-mt-24" aria-labelledby={`${id}-heading`}>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 id={`${id}-heading`} className="font-serif text-[clamp(1.8rem,3vw,2.5rem)] leading-[.95] tracking-tight-2">{heading}</h2>
      {items.length ? <p className="tabular text-sm text-black/60" aria-live="polite">{count} of {items.length} booked</p> : null}
    </div>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">GlobTrek doesn&apos;t book anything for you. Open each option on the provider&apos;s site; this page stays open so you can come back and check it off. Prices and availability are confirmed on each provider&apos;s site. You pay the travel provider directly.</p>
    {datesSet && datesLabel ? <p className="tabular mt-3 text-sm font-medium">For {datesLabel}</p> : null}
    {!datesSet ? <p className="mt-3 max-w-2xl border-l-2 border-warning pl-3 text-sm leading-6">Your dates are flexible, so these links open without dates to check current prices. Choose exact dates in the flight section to open booking options with your dates filled in.</p> : null}
    {trip && datesSet ? <BookingAssistant entries={entries} trip={trip} tripKey={tripKey} onStatuses={(status) => setAssistant(Object.fromEntries(status.items.map((entry) => [entry.id, entry])))} /> : null}
    {details}
    {items.length ? <ol className="mt-5 divide-y divide-black/12 border-y border-black/12">
      {items.map((item) => {
        const checked = Boolean(done[item.id]);
        const checkboxId = `${id}-${item.type}-${String(item.id).replace(/[^a-z0-9_-]/gi, "")}`;
        const live = assistant[assistantIds.get(item.exactUrl)];
        return <li key={`${item.type}:${item.id}`} className="grid gap-3 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5">
          <input id={checkboxId} type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="h-5 w-5 accent-black" />
          <label htmlFor={checkboxId} className="cursor-pointer">
            <span className="block text-micro uppercase tracking-label text-black/60">{LABELS[item.type]}{checked ? " · booked" : ""}</span>
            <span className={`mt-0.5 block text-base font-medium ${checked ? "text-black/45 line-through" : ""}`}>{item.name}</span>
            <span className="block text-xs text-black/55">on {partner(item.exactUrl)}{item.type === "flight" && item.departureDate ? ` · ${item.departureDate} → ${item.returnDate || "one way"}` : ""}</span>
            {live ? <span className="mt-1 block text-xs font-medium" aria-live="polite">Assistant: {ASSISTANT_STATUS_LABELS[live.status] || "Opened"}{live.note ? <span className="font-normal text-black/55"> · {live.note}</span> : null}</span> : null}
          </label>
          <a href={item.exactUrl} target="_blank" rel="noopener sponsored" onClick={() => track("booking_item_opened", { type: item.type })} className="inline-flex min-h-11 items-center justify-center border border-black/25 px-4 text-sm hover:border-black">{datesSet ? "Open booking options" : "Check current prices"} <span className="ml-1">on {partner(item.exactUrl)}</span> <span aria-hidden="true" className="ml-1">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
        </li>;
      })}
    </ol> : <p className="mt-5 border border-black/15 bg-surface p-4 text-sm">Choose a stay or flight first; they&apos;ll appear here with links to each provider.</p>}
  </section>;
}

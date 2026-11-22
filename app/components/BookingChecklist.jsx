"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { isCjUrl, withSid } from "../lib/booking/cj";
import { itemStatus, useConfirmations, useTripRef } from "../lib/booking/useTripStatus";
import { checklistItems } from "../lib/booking/checklist";

export { checklistItems };

// One step per kind of booking, in the order that works best: the flight sets the
// days, the stay matches the flight, then timed activities, then dinners.
const STEPS = {
  flight: { title: "Book your flight", why: "Do this first. Fares change fastest, and your arrival and departure times shape everything else." },
  hotel: { title: "Book your stay", why: "Match check-in and check-out to your flight days. Read the cancellation policy before you pay." },
  experience: { title: "Book your activities", why: "Pick times that fit around when you land and leave." },
  restaurant: { title: "Reserve your dinners", why: "Last, once your days are set." },
};
const ACTIONS = { hotel: "Book stay", flight: "Check flights", experience: "Book activity", restaurant: "Reserve table" };

// "Sat, Apr 10" for a date, "Sat, Apr 10, 7:30 PM" for a date and time (local to the trip).
function dayLabel(value) {
  const [date, time] = String(value || "").split("T");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  if (!/^\d{2}:\d{2}$/.test(time || "")) return day;
  const [hour, minute] = time.split(":").map(Number);
  return `${day}, ${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

function whenLabel(item) {
  if (item.type === "flight" && item.departureDate) return `${dayLabel(item.departureDate)} → ${item.returnDate ? dayLabel(item.returnDate) : "one way"}`;
  return dayLabel(item.reservationTime || item.scheduledAt);
}

function partner(url) {
  if (isCjUrl(url)) return "Booking.com";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "partner site"; }
}

// What Booking.com can report back through CJ for each kind of item.
const KIND = { flight: "flight", hotel: "stay", experience: "activity" };
export const checklistKind = (item) => (isCjUrl(item.exactUrl) ? KIND[item.type] || null : null);

export function storageKey(tripKey) {
  return `globtrek:booked:${tripKey}`;
}

// The booking page: numbered steps, each with its bookings. The traveler opens each
// one on the partner's site in a new tab and ticks it off. Nothing opens on its own
// and nothing is submitted for the traveler.
export function BookingChecklist({ entries, tripKey, details = null, id = "booking-steps", heading = "Book it in this order", thanksHref = null }) {
  const items = checklistItems(entries);
  const [done, setDone] = useState({});
  const ref = useTripRef(tripKey);
  const { confirmed } = useConfirmations(ref);
  const statusOf = (item, state = done) => itemStatus({ kind: checklistKind(item), checked: Boolean(state[item.id]), confirmed });
  const isDone = (item, state = done) => statusOf(item, state) !== "open";

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
    const next = { ...done, [itemId]: !done[itemId] };
    try { window.localStorage.setItem(storageKey(tripKey), JSON.stringify(next)); } catch {}
    setDone(next);
    if (thanksHref && next[itemId] && items.every((item) => isDone(item, next))) {
      track("booking_all_booked");
      setTimeout(() => window.location.assign(thanksHref), 700);
    }
  }

  const steps = Object.keys(STEPS).map((type) => ({ type, items: items.filter((item) => item.type === type) })).filter((step) => step.items.length);
  const count = items.filter((item) => isDone(item)).length;
  const confirmedCount = items.filter((item) => statusOf(item) === "confirmed").length;
  const next = steps.find((step) => step.items.some((item) => !isDone(item)))?.type;

  return <section id={id} className="scroll-mt-24" aria-labelledby={`${id}-heading`}>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 id={`${id}-heading`} className="font-serif text-[clamp(1.8rem,3vw,2.5rem)] leading-[.95] tracking-tight-2">{heading}</h2>
      {items.length ? <p className="tabular text-sm text-ink" aria-live="polite">{count} of {items.length} booked{confirmedCount ? ` · ${confirmedCount} confirmed by Booking.com` : ""}</p> : null}
    </div>
    {details}
    {steps.length ? <ol className="mt-8 space-y-4">
      {steps.map((step, index) => {
        const stepDone = step.items.every((item) => isDone(item));
        const current = step.type === next;
        return <li key={step.type} className={`border bg-white p-6 sm:p-8 ${current ? "border-black" : "border-black/15"}`}>
          <div className="grid grid-cols-[auto_1fr] gap-x-5">
            <span aria-hidden="true" className={`flex h-10 w-10 items-center justify-center text-sm font-semibold tabular ${stepDone ? "bg-black text-white" : current ? "border-2 border-black" : "border border-black/30"}`}>{stepDone ? "✓" : index + 1}</span>
            <div>
              <p className="text-micro uppercase tracking-label">Step {index + 1}{stepDone ? " · done" : current ? " · start here" : ""}</p>
              <h3 className="mt-1 font-serif text-[1.6rem] leading-tight tracking-tight-2">{STEPS[step.type].title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink">{STEPS[step.type].why}</p>
            </div>
          </div>
          <ul className="mt-6 divide-y divide-black/12 border-y border-black/12 sm:ml-[3.75rem]">
            {step.items.map((item) => {
              const status = statusOf(item);
              const checked = status !== "open";
              const checkboxId = `${id}-${item.type}-${String(item.id).replace(/[^a-z0-9_-]/gi, "")}`;
              return <li key={`${item.type}:${item.id}`} className="grid grid-cols-[1fr] gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-5">
                <div>
                  <p className={`text-base font-medium ${checked ? "line-through" : ""}`}>{item.name}</p>
                  <p className="text-sm text-ink">on {partner(item.exactUrl)}{whenLabel(item) ? ` · ${whenLabel(item)}` : ""}</p>
                  {status === "confirmed" ? <span className="mt-2 inline-flex items-center gap-2 bg-black px-2.5 py-1.5 text-micro uppercase tracking-label text-white">✓ Confirmed by Booking.com</span> : <label htmlFor={checkboxId} className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm">
                    <input id={checkboxId} type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="h-5 w-5 accent-black" />
                    I&apos;ve booked this
                  </label>}
                </div>
                <a href={withSid(item.exactUrl, ref)} target="_blank" rel="noopener sponsored" onClick={() => track("booking_item_opened", { type: item.type })} className={`inline-flex min-h-11 items-center justify-center px-5 text-sm ${current && !checked ? "bg-black text-white hover:bg-black/85" : "border border-black/25 hover:border-black"}`}>{ACTIONS[item.type] || "Open"} <span aria-hidden="true" className="ml-1">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
              </li>;
            })}
          </ul>
        </li>;
      })}
    </ol> : <p className="mt-5 border border-black/15 bg-surface p-4 text-sm">Pick a stay or flight to start.</p>}
    {steps.length && count === items.length ? <div role="status" className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-2 border-black pl-4">
      <p className="text-base font-medium">Everything&apos;s booked. Keep each partner&apos;s confirmation email: they hold your reservations.</p>
      {thanksHref ? <a href={thanksHref} className="inline-flex min-h-12 items-center bg-black px-6 text-micro font-medium uppercase tracking-label text-white hover:bg-black/85">See your trip summary →</a> : null}
    </div> : steps.length && thanksHref ? <p className="mt-6 text-sm">Booked it all? <a href={thanksHref} className="underline decoration-black/25 underline-offset-4 hover:decoration-black">See your trip summary</a>. We mark a booking confirmed only once Booking.com reports it to us, which can take a few hours.</p> : null}
  </section>;
}

"use client";

import { useEffect, useState } from "react";
import { itemStatus, useConfirmations, useTripRef } from "../lib/booking/useTripStatus";
import { withSid } from "../lib/booking/cj";
import { TripExtras } from "./TripExtras";

const BADGE = {
  confirmed: ["Confirmed by Booking.com", "bg-black text-white"],
  marked: ["You marked this booked", "border border-black"],
  open: ["Not booked yet", "border border-black/30"],
};

// The "thank you" page: everything on the trip with an honest status for each.
// "Confirmed" only when Booking.com has reported the booking (through CJ); a tick
// from the traveler is shown as theirs, never as a confirmation.
// items: [{ id, kind, name, detail, href, cta }]
export function TripThanks({ destinationName, items, doneKey, refKey, tripRef = null, extras, backHref }) {
  const [done, setDone] = useState({});
  const ref = useTripRef(refKey, tripRef);
  const { confirmed } = useConfirmations(ref);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { setDone(JSON.parse(window.localStorage.getItem(doneKey) || "{}")); } catch {}
    });
    return () => clearTimeout(timer);
  }, [doneKey]);

  const rows = items.map((item) => ({ ...item, status: itemStatus({ kind: item.kind, checked: Boolean(done[item.id]), confirmed }) }));
  const open = rows.filter((row) => row.status === "open");
  const confirmedCount = rows.filter((row) => row.status === "confirmed").length;
  const markedCount = rows.filter((row) => row.status === "marked").length;

  return <>
    <section className="mx-auto max-w-[1080px] px-5 pt-12 sm:px-8 sm:pt-16">
      <p className="text-micro uppercase tracking-editorial">{open.length ? "Almost there" : "You're all set"}</p>
      <h1 className="mt-3 max-w-3xl font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[.92] tracking-tight-3">Thank you for booking with GlobTrek</h1>
      <p className="mt-5 max-w-2xl text-base leading-7">{open.length
        ? `${open.length} thing${open.length === 1 ? " is" : "s are"} still to book for ${destinationName}. Everything else is below, with the status we can see.`
        : `Your trip to ${destinationName} is in place. Keep each partner's confirmation email: that is your reservation, not this page.`}</p>
      <p className="mt-3 max-w-2xl text-sm leading-6" aria-live="polite">
        {confirmedCount ? `${confirmedCount} confirmed by Booking.com. ` : ""}
        {markedCount ? `${markedCount} marked booked by you. ` : ""}
        Booking.com confirmations can take a few hours to reach us, and we only see bookings made through these links.
      </p>

      <ol className="mt-10 divide-y divide-black/12 border-y border-black">
        {rows.map((row, index) => {
          const [label, style] = BADGE[row.status];
          return <li key={row.id} className="grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center sm:gap-5">
            <span className="tabular text-sm" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-lg font-medium leading-snug">{row.name}</p>
              {row.detail ? <p className="mt-1 text-sm">{row.detail}</p> : null}
              <span className={`mt-2 inline-block px-2.5 py-1 text-micro uppercase tracking-label ${style}`}>{label}</span>
            </div>
            {row.status === "open" && row.href ? <a href={withSid(row.href, ref)} target="_blank" rel={row.sponsored === false ? "noopener" : "noopener sponsored"} className="inline-flex min-h-11 items-center justify-center gap-2 bg-black px-5 text-micro font-medium uppercase tracking-label text-white hover:bg-black/85">{row.cta || "Book now"} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : null}
          </li>;
        })}
      </ol>
      <p className="mt-6 text-sm"><a href={backHref} className="underline decoration-black/25 underline-offset-4 hover:decoration-black">← Back to your booking steps</a></p>
    </section>
    {extras?.length ? <section className="mx-auto mt-16 max-w-[1080px] px-5 sm:px-8"><TripExtras sections={extras} title="Before you go" intro="A few things travelers often forget. Picked for your trip and budget; each opens on the partner's site." /></section> : null}
  </>;
}

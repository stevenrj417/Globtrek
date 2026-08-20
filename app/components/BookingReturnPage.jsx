"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONTENT = {
  success: { eyebrow: "Booking complete", index: "01 / Confirmed", title: <>Your flight is<br />ready for takeoff.</>, body: "Your booking was completed with the flight provider. Keep your confirmation email close—it is the source of truth for your reservation and travel details.", primary: "Return to your trip", note: "Booking details will appear here when a verified reference is available to GlobTrek." },
  failed: { eyebrow: "Booking not completed", index: "02 / Try again", title: <>That flight is<br />still waiting.</>, body: "The booking was not completed. Your GlobTrek trip is still here, so you can review the route and try again when you’re ready.", primary: "Retry flight booking", note: "We have not assumed that your card was charged. Check with the flight provider if you saw a charge or received a confirmation." },
  abandoned: { eyebrow: "Checkout paused", index: "03 / Saved for later", title: <>Nothing booked.<br />Nothing lost.</>, body: "You left checkout before completing the booking. Your trip remains available in this browser, ready whenever you want to continue.", primary: "Return to your trip", note: "Fares and availability can change. Confirm the live details with the flight provider when you continue." },
};

function readTripContext() {
  try {
    const raw = window.sessionStorage.getItem("globtrekCurrentTrip");
    if (!raw) return null;
    const value = JSON.parse(raw);
    const city = value?.trip?.city || value?.savedTrip?.destination?.city;
    return { city: typeof city === "string" ? city : "", href: "/trip/current" };
  } catch { return null; }
}

export function BookingReturnPage({ state }) {
  const content = CONTENT[state];
  const [tripContext, setTripContext] = useState(null);
  useEffect(() => { const timer = window.setTimeout(() => setTripContext(readTripContext()), 0); return () => window.clearTimeout(timer); }, []);
  const tripHref = tripContext?.href || "/results";
  const primaryHref = state === "failed" ? "/results#flight-search-heading" : tripHref;

  return <main className="booking-return min-h-svh overflow-hidden bg-[#f3f0eb] text-[#171714]">
    <header className="booking-return-reveal mx-auto flex min-h-20 max-w-[1600px] items-center justify-between border-b border-black/15 px-5 sm:px-10 lg:px-14"><Link href="/" className="text-[13px] font-semibold uppercase tracking-[0.32em]">Globtrēk</Link><p className="text-[8px] uppercase tracking-[0.24em] text-black/42">Flight return · {content.index}</p></header>
    <section className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1600px] lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,.55fr)]">
      <div className="flex flex-col justify-between px-5 pb-10 pt-14 sm:px-10 sm:pb-14 sm:pt-20 lg:px-14 lg:py-16">
        <div className="booking-return-reveal booking-return-delay-1"><div className="flex items-center gap-4"><span className="h-px w-12 bg-black/35" aria-hidden="true" /><p className="text-[9px] font-medium uppercase tracking-[0.28em] text-black/48">{content.eyebrow}</p></div><h1 className="mt-10 max-w-5xl font-serif text-[clamp(3.5rem,9.2vw,9.5rem)] font-normal leading-[0.79] tracking-[-0.065em]">{content.title}</h1></div>
        <div className="booking-return-reveal booking-return-delay-2 mt-16 grid gap-8 border-t border-black/15 pt-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:mt-24"><p className="max-w-xl text-sm font-light leading-7 text-black/58 sm:text-base">{content.body}</p><div className="flex flex-col gap-3 sm:min-w-56"><Link href={primaryHref} className="grid min-h-14 place-items-center bg-[#171714] px-7 text-[9px] font-medium uppercase tracking-[0.2em] text-white transition duration-300 hover:bg-black hover:tracking-[0.23em]">{content.primary} <span className="ml-2" aria-hidden="true">→</span></Link>{state === "failed" ? <Link href={tripHref} className="grid min-h-12 place-items-center border border-black/20 px-7 text-[9px] uppercase tracking-[0.2em] transition hover:border-black">Back to trip</Link> : null}</div></div>
      </div>
      <aside className="booking-return-reveal booking-return-delay-3 flex flex-col justify-between border-t border-black/15 bg-[#e6e0d8] p-5 sm:p-10 lg:border-l lg:border-t-0 lg:p-12"><div><p className="text-[8px] uppercase tracking-[0.24em] text-black/42">Trip continuity</p><p className="mt-5 font-serif text-3xl leading-[1.05] tracking-[-0.04em]">{tripContext?.city ? `${tripContext.city} is right where you left it.` : "Your itinerary, right where you left it."}</p></div><div className="mt-20 border-t border-black/15 pt-6"><div className="flex items-center justify-between gap-6 text-[8px] uppercase tracking-[0.2em] text-black/42"><span>Booking reference</span><span aria-label="Not yet available">—</span></div><p className="mt-5 text-xs font-light leading-5 text-black/52">{content.note}</p></div></aside>
    </section>
  </main>;
}

"use client";

import { useEffect, useState } from "react";

// The slim bar that follows the trip page: hidden over the opening photo and
// while the booking checklist is on screen, otherwise one line with the trip,
// its estimate and the next step.
export function TripDock({ city, summary, total, picks, emailButton, onBook }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-trip-hero]");
    const booking = document.querySelector("#booking-center");
    const state = { pastHero: false, atBooking: false };
    const update = () => setVisible(state.pastHero && !state.atBooking);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) state.pastHero = !entry.isIntersecting;
        if (entry.target === booking) state.atBooking = entry.isIntersecting;
      }
      update();
    }, { rootMargin: "0px 0px -15% 0px" });
    if (hero) observer.observe(hero); else state.pastHero = true;
    if (booking) observer.observe(booking);
    update();
    return () => observer.disconnect();
  }, []);

  return <aside aria-label="Your trip" className={`fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-3xl transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,0,0,1)] motion-reduce:transition-none sm:inset-x-6 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"}`} inert={!visible}>
    <div className="flex items-center gap-3 rounded-full border border-black/10 bg-surface/95 py-2 pl-5 pr-2 text-ink shadow-overlay backdrop-blur-xl">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{city} <span className="font-normal text-black/50">· {summary}</span></p>
        <p className="tabular truncate text-micro text-black/55"><span className="font-medium text-ink">{total}</span> estimated{picks ? ` · ${picks}` : ""}</p>
      </div>
      <div className="hidden sm:block">{emailButton}</div>
      <button type="button" onClick={onBook} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-black px-5 text-micro font-medium uppercase tracking-label text-white">Check prices <span aria-hidden="true">→</span></button>
    </div>
  </aside>;
}

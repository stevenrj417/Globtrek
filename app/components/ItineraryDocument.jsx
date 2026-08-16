"use client";

import { useState } from "react";

function ArrowUpRight() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.4"><path d="M7 17 17 7M8 7h9v9" /></svg>;
}

function Chevron() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current transition-transform duration-300 group-open:rotate-180" strokeWidth="1.4"><path d="m6 9 6 6 6-6" /></svg>;
}

function dayNumber(day, index) {
  const match = String(day?.day || "").match(/\d+/);
  return String(match?.[0] || index + 1).padStart(2, "0");
}

function daySequence(day) {
  if (Array.isArray(day?.sequence) && day.sequence.length) return day.sequence.join(" → ");
  return [day?.morning, day?.afternoon, day?.evening].filter(Boolean).map((part) => String(part).split(/[,.]/)[0].trim()).join(" → ");
}

export function ItineraryDocument({ trip, quiz, onRefine, refining, venueUrl }) {
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const plan = trip.plan;
  if (!plan) return null;
  const days = plan.days || [];
  const places = [
    ...(plan.picks?.restaurants || []).map((place) => ({ ...place, type: "Eat" })),
    ...(plan.picks?.experiences || []).map((place) => ({ ...place, type: "See" })),
  ];
  const visiblePlaces = showAllPlaces ? places : places.slice(0, 4);
  const attributes = [
    ["Days", days.length ? `${days.length} days` : quiz?.answers?.duration],
    ["Pace", quiz?.answers?.escape],
    ["Trip style", trip.style],
    ["Budget", quiz?.answers?.memory],
  ].filter(([, value]) => value);

  return <section className="mt-16 border-y border-black/15 bg-[#f8f6f2] py-14 sm:py-20">
    <div className="mx-auto max-w-[1180px]">
      <header className="border-b border-black/15 pb-12 sm:pb-16">
        <p className="text-[9px] uppercase tracking-[0.28em] text-black/42">Your trip, organized</p>
        <h2 className="mt-5 max-w-4xl font-serif text-[clamp(3rem,7vw,7rem)] leading-[.86] tracking-[-0.055em]">{days.length || 3} days in {trip.city}</h2>
        <p className="mt-7 max-w-2xl text-base font-light leading-7 text-black/58 sm:text-lg">{trip.why}</p>
        <div className="mt-10 grid grid-cols-2 border-l border-t border-black/10 sm:grid-cols-4">{attributes.map(([label, value]) => <div key={label} className="border-b border-r border-black/10 px-4 py-4 sm:px-5"><p className="text-[8px] uppercase tracking-[0.2em] text-black/35">{label}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-black/65">{value}</p></div>)}</div>
      </header>

      <div className="py-4 sm:py-8">
        {days.map((day, index) => <details key={`${day.day}-${day.title}`} className="group border-b border-black/15">
          <summary className="grid cursor-pointer list-none gap-5 py-7 sm:grid-cols-[4rem_1fr_auto] sm:items-start sm:py-9 [&::-webkit-details-marker]:hidden">
            <span className="font-serif text-3xl tracking-[-0.04em] text-black/30">{dayNumber(day, index)}</span>
            <span><strong className="block font-serif text-2xl font-normal tracking-[-0.035em] sm:text-3xl">{day.title}</strong><span className="mt-2 block text-[9px] uppercase tracking-[0.18em] text-black/42">{day.location || `${trip.city} · ${day.day}`}</span><span className="mt-4 block max-w-3xl text-sm font-light leading-6 text-black/60">{daySequence(day)}</span></span>
            <span className="flex items-center gap-3 text-[8px] uppercase tracking-[0.2em] text-black/50"><span>View day</span><Chevron /></span>
          </summary>
          <div className="grid gap-6 pb-9 pl-0 sm:grid-cols-3 sm:pl-20">{[["Morning", day.morning], ["Afternoon", day.afternoon], ["Evening", day.evening]].map(([label, detail]) => <div key={label} className="border-l border-black/15 pl-4"><p className="text-[8px] uppercase tracking-[0.2em] text-black/35">{label}</p><p className="mt-3 text-sm font-light leading-6 text-black/62">{detail}</p></div>)}</div>
        </details>)}
      </div>

      <section className="border-b border-black/15 py-12"><div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] uppercase tracking-[0.25em] text-black/40">Make it more you</p><h3 className="mt-3 font-serif text-3xl tracking-[-0.035em]">Adjust the rhythm.</h3></div><div className="flex flex-wrap gap-x-6 gap-y-4">{["More affordable", "More local", "More relaxing", "More adventurous"].map((label) => <button disabled={refining} type="button" key={label} onClick={() => onRefine(label.toLowerCase())} className="border-b border-black/25 pb-1 text-[8px] uppercase tracking-[0.18em] text-black/58 transition hover:border-black hover:text-black disabled:opacity-35">{refining ? "Refining…" : label}</button>)}<a href="/discover" className="border-b border-black/25 pb-1 text-[8px] uppercase tracking-[0.18em] text-black/58 transition hover:border-black hover:text-black">Different destination</a></div></div></section>

      {places.length ? <section className="py-12"><div className="flex items-end justify-between"><div><p className="text-[9px] uppercase tracking-[0.25em] text-black/40">Places along the way</p><h3 className="mt-3 font-serif text-3xl tracking-[-0.035em]">Worth knowing by name.</h3></div>{places.length > 4 ? <button type="button" onClick={() => setShowAllPlaces((value) => !value)} className="text-[8px] uppercase tracking-[0.18em] text-black/55">{showAllPlaces ? "Show less" : "See all places"}</button> : null}</div><div className="mt-8 grid border-l border-t border-black/10 sm:grid-cols-2">{visiblePlaces.map((place) => <a key={`${place.type}-${place.name}`} href={venueUrl(place.name, trip)} target="_blank" rel="noopener" className="group flex min-h-28 items-end justify-between gap-6 border-b border-r border-black/10 p-5 transition hover:bg-white/70"><span><span className="text-[8px] uppercase tracking-[0.2em] text-black/35">{place.type}</span><strong className="mt-2 block font-serif text-xl font-normal">{place.name}</strong><span className="mt-2 block text-[11px] leading-4 text-black/45">{place.why}</span></span><ArrowUpRight /></a>)}</div></section> : null}
    </div>
  </section>;
}

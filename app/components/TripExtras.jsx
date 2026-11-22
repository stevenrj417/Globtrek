"use client";


import { track } from "@vercel/analytics";

// "Don't forget" extras, grouped: rides and cars, special experiences, more to do,
// food, essentials. Sections and items come from app/lib/trip/extras.js, already
// chosen for the trip's budget. Items the traveler asked for in the quiz come first.
export function TripExtras({ sections, title = "Don't forget", intro = "Things people often leave until the last minute. Each one opens on the partner's site; you book and pay there.", id = "extras" }) {
  if (!sections?.length) return null;
  return <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
    <h2 id={`${id}-heading`} className="font-serif text-[clamp(2rem,3.4vw,2.8rem)] leading-[.95] tracking-tight-2">{title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6">{intro}</p>
    <div className="mt-8 space-y-10">
      {sections.map((section) => <div key={section.id}>
        <h3 className="border-b border-black pb-2 text-micro uppercase tracking-label">{section.title}</h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item) => <li key={item.id} className="flex flex-col border border-black/15 bg-white p-5">
            <p className="text-micro uppercase tracking-label">{item.partner}{item.wanted ? " · you asked for this" : ""}</p>
            <p className="mt-2 text-lg font-medium leading-snug">{item.title}</p>
            <p className="mt-2 flex-1 text-sm leading-6">{item.why}</p>
            <a href={item.href} target="_blank" rel={item.sponsored ? "noopener sponsored" : "noopener"} onClick={() => track("trip_extra_opened", { id: item.id })} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 border border-black/25 px-5 text-micro font-medium uppercase tracking-label transition-colors hover:border-black">{item.cta} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          </li>)}
        </ul>
      </div>)}
    </div>
  </section>;
}

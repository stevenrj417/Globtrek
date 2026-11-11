"use client";

import Image from "next/image";
import { track } from "../../lib/analytics";

// Bookable tours and tickets (WeGoTrip) ranked for the traveler. Prices are the
// provider's listed per-person price in its own currency.
export function BookableTours({ tours, destination, interest }) {
  if (!tours.length) return null;
  const matching = tours.filter((tour) => tour.matchesInterest).length;
  return <section id="tours" className="scroll-mt-24 border-t border-black/15 px-6 py-12 sm:px-12" aria-labelledby="tours-heading">
    <div className="mx-auto max-w-[1180px]">
      <p className="text-micro uppercase tracking-editorial">Book ahead</p>
      <h2 id="tours-heading" className="mt-4 font-serif text-[clamp(2rem,3vw,2.75rem)] leading-[.94] tracking-tight-2">Tours and tickets in {destination.city.toLowerCase().replace(/(^|[\s&-])\S/g, (letter) => letter.toUpperCase())}</h2>
      <p className="mt-3 max-w-2xl text-xs leading-5">{interest && matching ? `${matching} picked for your interest in ${interest.toLowerCase()}. ` : interest ? `No ${interest.toLowerCase()} tours listed here yet, so these are the best-rated options. ` : ""}Listed prices are per person from WeGoTrip; the provider confirms the final price and availability.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => <li key={tour.id} className="flex flex-col overflow-hidden border border-black/15 bg-white">
          {tour.image ? <div className="relative aspect-[3/2] bg-placeholder"><Image src={tour.image} alt="" fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="object-cover" /></div> : null}
          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <p className="text-micro uppercase tracking-label text-black/55">{[tour.category, tour.selfGuided ? "Self-guided audio" : null, tour.duration].filter(Boolean).join(" · ")}</p>
              <h3 className="mt-2 text-sm font-medium leading-5">{tour.name}</h3>
              <p className="tabular mt-2 text-xs">{tour.priceLabel} per person{tour.rating ? ` · ${tour.rating.toFixed(1)}★ (${tour.ratingsCount.toLocaleString("en-US")} ratings)` : ""}</p>
            </div>
            <a href={tour.bookingUrl} target="_blank" rel="noopener sponsored" onClick={() => track("tour_opened", { destination: destination.city, provider: tour.provider })} className="mt-4 inline-flex min-h-11 items-center justify-center border border-black px-4 text-micro uppercase tracking-label hover:bg-black hover:text-white">View on WeGoTrip <span className="ml-2" aria-hidden="true">↗</span></a>
          </div>
        </li>)}
      </ul>
      <p className="mt-4 text-micro text-black/55">Photos: WeGoTrip.</p>
    </div>
  </section>;
}

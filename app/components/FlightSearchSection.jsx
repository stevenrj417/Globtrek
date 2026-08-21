"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { bookingFlightUrl } from "../data/destinations";

function shortDate(value) {
  if (!value) return "Flexible";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function FlightSearchSection({ destination, trip = {}, onSearched }) {
  const [selected, setSelected] = useState(false);
  const origin = String(trip?.originAirport || "").trim().toUpperCase();
  const travelers = Math.max(1, Number.parseInt(trip?.guestCount, 10) || 2);
  const cabinClass = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"].includes(trip?.cabinClass) ? trip.cabinClass : "ECONOMY";
  const cabinLabel = cabinClass.toLowerCase().replace("_", " ").replace(/^./, (letter) => letter.toUpperCase());
  const searchUrl = bookingFlightUrl(destination, { ...trip, cabinClass });

  function searchFlights() {
    setSelected(true);
    onSearched?.();
    track("flight_search_selected", { destination: destination.city, cabin: cabinClass.toLowerCase(), context_complete: Boolean(origin && trip?.tripStart && trip?.tripEnd) });
  }

  return <section id="flights" className="scroll-mt-28 bg-[#e9e4dc] px-6 py-20 sm:px-12 sm:py-28" aria-labelledby="flight-search-heading">
    <div className="mx-auto max-w-[1240px] lg:grid lg:grid-cols-[.72fr_1.28fr] lg:gap-24">
      <div><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/45">02 · Flight</p><h2 id="flight-search-heading" className="mt-5 font-serif text-[clamp(2.8rem,5vw,5.5rem)] leading-[.92] tracking-[-0.045em]">Get there.</h2></div>
      <div className="mt-12 lg:mt-0">
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
          <div><p className="text-xs text-black/45">Route</p><p className="mt-2 text-base">{origin || "Choose origin"} <span aria-hidden="true">→</span> {destination.airport}</p></div>
          <div><p className="text-xs text-black/45">Dates</p><p className="mt-2 text-base">{shortDate(trip?.tripStart)} — {shortDate(trip?.tripEnd)}</p></div>
          <div><p className="text-xs text-black/45">Travelers</p><p className="mt-2 text-base">{travelers}</p></div>
          <div><p className="text-xs text-black/45">Cabin</p><p className="mt-2 text-base">{cabinLabel}</p></div>
        </div>
        <p className="mt-10 max-w-xl text-sm leading-6 text-black/55">Current fares and availability open with our flight partner. GlobTrek does not display a fare until it has been checked.</p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <a href={searchUrl} target="_blank" rel="noopener sponsored" onClick={searchFlights} className="inline-flex min-h-14 items-center justify-center bg-[#171714] px-8 text-[11px] font-medium text-white transition hover:bg-black focus-visible:outline-white">{selected ? "Open flights again" : "Search current flights"}<span className="ml-3" aria-hidden="true">↗</span></a>
          <a href="/discover" className="inline-flex min-h-12 items-center justify-center px-5 text-xs text-black/55 underline decoration-black/25 hover:text-black">Change trip details</a>
        </div>
      </div>
    </div>
  </section>;
}

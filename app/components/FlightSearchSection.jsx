"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { bookingFlightUrl } from "../data/destinations";

const CABINS = [["ECONOMY", "Economy"], ["PREMIUM_ECONOMY", "Premium economy"], ["BUSINESS", "Business"], ["FIRST", "First"]];

export function FlightSearchSection({ destination, trip = {} }) {
  const [origin, setOrigin] = useState(String(trip?.originAirport || "").trim().toUpperCase());
  const [depart, setDepart] = useState(trip?.isFlexible ? "" : trip?.tripStart || "");
  const [returnDate, setReturnDate] = useState(trip?.isFlexible ? "" : trip?.tripEnd || "");
  const [adults, setAdults] = useState(String(Math.max(1, Number.parseInt(trip?.guestCount, 10) || 2)));
  const [cabinClass, setCabinClass] = useState("ECONOMY");
  const [selected, setSelected] = useState(false);

  const searchUrl = bookingFlightUrl(destination, { ...trip, originAirport: origin, isFlexible: !depart || !returnDate, tripStart: depart, tripEnd: returnDate, guestCount: adults, cabinClass });
  const searchReady = /^[A-Z]{3}$/.test(origin) && Boolean(depart) && Boolean(returnDate) && Number.parseInt(adults, 10) > 0;

  function selectSearch() {
    if (!searchReady) return;
    setSelected(true);
    track("flight_search_selected", { destination: destination.city, cabin: cabinClass.toLowerCase() });
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  }

  function change(setter) {
    return (value) => {
      setter(value);
      setSelected(false);
    };
  }

  return <section className="mt-20" aria-labelledby="flight-search-heading">
    <h2 id="flight-search-heading" className="border-b border-black pb-6 font-serif text-[clamp(2.2rem,4vw,3.8rem)] tracking-[-0.04em]">Flights</h2>
    <div className="border-x border-b border-black bg-[#f8f6f2] p-5 sm:p-7">
      <div className="grid border-l border-t border-black sm:grid-cols-2 lg:grid-cols-[.8fr_.8fr_1fr_1fr_.6fr]">
        <label className="border-b border-r border-black p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black">From</span><input required aria-label="Origin airport" value={origin} maxLength={3} placeholder="PDX" onChange={(event) => change(setOrigin)(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} className="mt-2 block w-full bg-transparent font-serif text-xl uppercase text-black outline-none" /></label>
        <div className="border-b border-r border-black p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black">To</span><strong className="mt-2 block font-serif text-xl font-normal text-black">{destination.airport}</strong></div>
        <label className="border-b border-r border-black p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black">Depart</span><input type="date" value={depart} onChange={(event) => change(setDepart)(event.target.value)} className="mt-2 block w-full bg-transparent text-sm text-black outline-none" /></label>
        <label className="border-b border-r border-black p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black">Return</span><input type="date" min={depart || undefined} value={returnDate} onChange={(event) => change(setReturnDate)(event.target.value)} className="mt-2 block w-full bg-transparent text-sm text-black outline-none" /></label>
        <label className="border-b border-r border-black p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black">Adults</span><input type="number" min="1" max="30" value={adults} onChange={(event) => change(setAdults)(event.target.value)} className="mt-2 block w-full bg-transparent text-sm text-black outline-none" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {CABINS.map(([value, label]) => <button key={value} type="button" onClick={() => change(setCabinClass)(value)} className={`min-h-11 border px-4 text-[9px] uppercase tracking-[0.14em] transition ${cabinClass === value ? "border-black bg-black text-white" : "border-black hover:border-black"}`}>{label}</button>)}
      </div>
      <div className="mt-5 flex justify-end border-t border-black pt-5">
        <button disabled={!searchReady} type="button" onClick={selectSearch} className={`min-h-14 min-w-48 border px-6 text-[9px] uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-35 ${selected ? "border-black bg-black text-white" : "border-black hover:bg-black hover:text-white"}`}>{selected ? "Open flights again ↗" : "Select & search flights ↗"}</button>
      </div>
    </div>
  </section>;
}

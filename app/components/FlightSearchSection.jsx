"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { bookingFlightUrl } from "../data/destinations";

const CABINS = [["ECONOMY", "Economy"], ["PREMIUM_ECONOMY", "Premium economy"], ["BUSINESS", "Business"], ["FIRST", "First"]];
const DEPARTURE_WINDOWS = [["ANYTIME", "Any time"], ["MORNING", "Morning"], ["AFTERNOON", "Afternoon"], ["EVENING", "Evening"]];

export function FlightSearchSection({ destination, trip = {} }) {
  const [origin, setOrigin] = useState(String(trip?.originAirport || "").trim().toUpperCase());
  const [depart, setDepart] = useState(trip?.isFlexible ? "" : trip?.tripStart || "");
  const [returnDate, setReturnDate] = useState(trip?.isFlexible ? "" : trip?.tripEnd || "");
  const [adults, setAdults] = useState(String(Math.max(1, Number.parseInt(trip?.guestCount, 10) || 2)));
  const [cabinClass, setCabinClass] = useState("ECONOMY");
  const [departureWindow, setDepartureWindow] = useState("ANYTIME");
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
    <div className="flex flex-col gap-4 border-b border-black/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Your flight</p><h2 id="flight-search-heading" className="mt-3 font-serif text-[clamp(2.2rem,4vw,3.8rem)] tracking-[-0.04em]">Flights</h2></div>
      <p className="max-w-sm text-sm font-light leading-6 text-black/50">Choose the route here. Booking.com shows the current departures and fares.</p>
    </div>
    <div className="border-x border-b border-black/15 bg-[#f8f6f2] p-5 sm:p-7">
      <div className="grid border-l border-t border-black/15 sm:grid-cols-2 lg:grid-cols-[.8fr_.8fr_1fr_1fr_.6fr]">
        <label className="border-b border-r border-black/15 p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black/40">From</span><input required aria-label="Origin airport" value={origin} maxLength={3} placeholder="PDX" onChange={(event) => change(setOrigin)(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} className="mt-2 block w-full bg-transparent font-serif text-xl uppercase outline-none" /></label>
        <div className="border-b border-r border-black/15 p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black/40">To</span><strong className="mt-2 block font-serif text-xl font-normal">{destination.airport}</strong></div>
        <label className="border-b border-r border-black/15 p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black/40">Depart</span><input type="date" value={depart} onChange={(event) => change(setDepart)(event.target.value)} className="mt-2 block w-full bg-transparent text-sm outline-none" /></label>
        <label className="border-b border-r border-black/15 p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black/40">Return</span><input type="date" min={depart || undefined} value={returnDate} onChange={(event) => change(setReturnDate)(event.target.value)} className="mt-2 block w-full bg-transparent text-sm outline-none" /></label>
        <label className="border-b border-r border-black/15 p-4"><span className="text-[8px] uppercase tracking-[0.18em] text-black/40">Adults</span><input type="number" min="1" max="30" value={adults} onChange={(event) => change(setAdults)(event.target.value)} className="mt-2 block w-full bg-transparent text-sm outline-none" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {CABINS.map(([value, label]) => <button key={value} type="button" onClick={() => change(setCabinClass)(value)} className={`min-h-11 border px-4 text-[9px] uppercase tracking-[0.14em] transition ${cabinClass === value ? "border-black bg-black text-white" : "border-black/15 hover:border-black"}`}>{label}</button>)}
      </div>
      <div className="mt-5 border-t border-black/10 pt-5">
        <p className="mb-3 text-[8px] uppercase tracking-[0.18em] text-black/40">Preferred departure</p>
        <div className="flex flex-wrap gap-2">
          {DEPARTURE_WINDOWS.map(([value, label]) => <button key={value} type="button" onClick={() => change(setDepartureWindow)(value)} className={`min-h-11 border px-4 text-[9px] uppercase tracking-[0.14em] transition ${departureWindow === value ? "border-black bg-black text-white" : "border-black/15 hover:border-black"}`}>{label}</button>)}
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-black/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] uppercase tracking-[0.14em] text-black/45">{searchReady ? `${origin} → ${destination.airport} · ${depart} — ${returnDate}` : "Add your airport and dates"}</p>
        <button disabled={!searchReady} type="button" onClick={selectSearch} className={`min-h-14 min-w-48 border px-6 text-[9px] uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-35 ${selected ? "border-black bg-black text-white" : "border-black hover:bg-black hover:text-white"}`}>{selected ? "Open flights again ↗" : "Select & search flights ↗"}</button>
      </div>
    </div>
    <p className="mt-3 text-[10px] leading-5 text-black/40">Your preferred departure window stays with your GlobTrek selection. Booking.com does not accept that filter in its affiliate link, so choose the exact live departure and fare there.</p>
  </section>;
}

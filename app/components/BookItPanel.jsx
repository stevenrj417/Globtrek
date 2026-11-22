"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { addDays, flightBookingUrl, localToday, stayBookingUrl } from "../lib/booking/bookIt";

const field = "mt-2 min-h-12 w-full border border-black/20 bg-white px-3 text-base outline-none focus:border-black";

// Dates and travelers, then two ways forward: book just this on the partner's
// site, or build a whole trip around it on GlobTrek.
// kind: "stay" | "flight". stay: { bookingUrl }. flight: { from, to }. planHref: base /plan link.
export function BookItPanel({ kind, stay, flight, planHref, planLabel, partner = "Booking.com" }) {
  const [today, setToday] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [oneWay, setOneWay] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setToday(localToday())); return () => clearTimeout(timer); }, []);

  const datesOk = !start || ((oneWay && kind === "flight") || (end && end > start));
  const href = kind === "stay" ? stayBookingUrl(stay.bookingUrl, { start, end, adults, rooms }) : flightBookingUrl({ ...flight, start, end, adults, oneWay });
  const plan = new URL(planHref, "https://www.glob-trek.com");
  if (start && end && end > start) { plan.searchParams.set("start", start); plan.searchParams.set("end", end); }
  plan.searchParams.set("adults", String(adults));
  const planLink = `${plan.pathname}${plan.search}`;

  return <div className="border border-black bg-white p-5 sm:p-7">
    {kind === "flight" ? <div className="mb-5 flex gap-2" role="group" aria-label="Trip type">
      {[[false, "Round trip"], [true, "One way"]].map(([value, label]) => <button key={label} type="button" aria-pressed={oneWay === value} onClick={() => setOneWay(value)} className={`min-h-10 border px-4 text-micro font-medium uppercase tracking-label ${oneWay === value ? "border-black bg-black text-white" : "border-black/20"}`}>{label}</button>)}
    </div> : null}
    <div className="grid grid-cols-2 gap-3">
      <label className="block text-micro font-medium uppercase tracking-label">{kind === "stay" ? "Check in" : "Depart"}
        <input type="date" value={start} min={today || undefined} onChange={(event) => { const value = event.target.value; setStart(value); if (value && (!end || end <= value)) setEnd(addDays(value, kind === "stay" ? 3 : 7)); }} className={field} />
      </label>
      {kind === "flight" && oneWay ? <span /> : <label className="block text-micro font-medium uppercase tracking-label">{kind === "stay" ? "Check out" : "Return"}
        <input type="date" value={end} min={start ? addDays(start, 1) : today || undefined} onChange={(event) => setEnd(event.target.value)} className={field} />
      </label>}
      <label className="block text-micro font-medium uppercase tracking-label">{kind === "stay" ? "Guests" : "Travelers"}
        <select value={adults} onChange={(event) => setAdults(Number(event.target.value))} className={field}>{Array.from({ length: 9 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value} {value === 1 ? "adult" : "adults"}</option>)}</select>
      </label>
      {kind === "stay" ? <label className="block text-micro font-medium uppercase tracking-label">Rooms
        <select value={rooms} onChange={(event) => setRooms(Number(event.target.value))} className={field}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value} {value === 1 ? "room" : "rooms"}</option>)}</select>
      </label> : null}
    </div>
    {!datesOk ? <p className="mt-3 text-sm text-warning" role="alert">Pick a {kind === "stay" ? "check-out" : "return"} date after the first date.</p> : null}
    <div className="mt-6 grid gap-2">
      <a href={datesOk ? href : undefined} aria-disabled={!datesOk} target="_blank" rel="noopener sponsored" onClick={() => track(kind === "stay" ? "hotel_book_only" : "flight_book_only")} className={`inline-flex min-h-14 items-center justify-center gap-2 bg-black px-6 text-micro font-medium uppercase tracking-label text-white hover:bg-black/85 ${datesOk ? "" : "pointer-events-none opacity-50"}`}>{kind === "stay" ? "Book just this stay" : "Book just this flight"} <span aria-hidden="true">↗</span><span className="sr-only"> (opens {partner} in a new tab)</span></a>
      <a href={planLink} onClick={() => track(kind === "stay" ? "hotel_plan_trip" : "flight_plan_trip")} className="inline-flex min-h-14 items-center justify-center gap-2 border border-black px-6 text-micro font-medium uppercase tracking-label hover:bg-black hover:text-white">{planLabel} <span aria-hidden="true">→</span></a>
    </div>
    <p className="mt-4 text-xs leading-5">{kind === "stay" ? "Opens this hotel on Booking.com with your dates; you see live prices and pay there." : "Opens Booking.com flights with your route and dates; you see live fares and pay there."} {"Planning a whole trip adds places to eat, things to do and the rest, booked in order from one page."}</p>
  </div>;
}

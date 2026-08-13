"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bookingActivityUrl, bookingFlightUrl, bookingLinks, destinations, diningSearchUrl, scoreDestination } from "../data/destinations";
import { hotelsFor } from "../data/hotels";

function getMatches(quiz) {
  const answers = quiz?.answers || {};
  return [...destinations]
    .map((destination) => ({ ...destination, score: scoreDestination(destination, answers) + Math.random() * 4.5 }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function formatDate(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function bookingHotelUrl(hotel, trip = {}) {
  if (!hotel?.bookingUrl) return null;
  const target = new URL(hotel.bookingUrl);
  if (!trip?.isFlexible && trip?.tripStart && trip?.tripEnd) {
    target.searchParams.set("checkin", trip.tripStart);
    target.searchParams.set("checkout", trip.tripEnd);
  }
  const adults = Number.parseInt(trip?.guestCount, 10);
  target.searchParams.set("group_adults", String(Number.isFinite(adults) && adults > 0 ? Math.min(adults, 30) : 2));
  target.searchParams.set("no_rooms", "1");
  target.searchParams.set("group_children", "0");
  return `${bookingLinks.stays}?url=${encodeURIComponent(target.toString())}`;
}

function HotelShortlist({ destination, quiz }) {
  const hotels = useMemo(() => hotelsFor(destination), [destination]);
  const [selected, setSelected] = useState(null);
  const [customHotel, setCustomHotel] = useState("");
  const [editingCustom, setEditingCustom] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(`globtrekStay:${destination.city}`);
    const timer = window.setTimeout(() => {
      if (raw) setSelected(JSON.parse(raw));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [destination.city]);

  function choose(stay) {
    setSelected(stay);
    window.localStorage.setItem(`globtrekStay:${destination.city}`, JSON.stringify(stay));
  }

  function remove() {
    setSelected({ type: "none", name: "No hotel needed" });
    window.localStorage.setItem(`globtrekStay:${destination.city}`, JSON.stringify({ type: "none", name: "No hotel needed" }));
  }

  function addCustom(event) {
    event.preventDefault();
    const name = customHotel.trim();
    if (!name) return;
    choose({ type: "custom", name });
    setEditingCustom(false);
  }

  const selectedHotel = selected?.type !== "none" ? selected : null;

  return <section className="mt-24">
    <div className="flex flex-col gap-6 border-b border-black/15 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Your stay</p><h2 className="mt-5 font-serif text-[clamp(2.4rem,5vw,4.8rem)] tracking-[-0.04em]">Four worth traveling for</h2></div>
      <p className="max-w-md text-sm font-light leading-6 text-black/50">An editorial shortlist for {destination.city}. Booking.com confirms live rooms, prices, and final terms.</p>
    </div>

    <div className="grid gap-px bg-black/15 md:grid-cols-2 xl:grid-cols-4">
      {hotels.map((hotel, index) => {
        const isSelected = selected?.id === hotel.id;
        return <article key={hotel.id} className="group bg-[#f3f0eb]">
          <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
            <Image src={hotel.image} alt={`${hotel.name} in ${destination.city}`} fill className={`object-cover transition duration-700 group-hover:scale-[1.025] ${index === 1 ? "object-[65%_center]" : index === 2 ? "object-[35%_center]" : index === 3 ? "object-bottom" : "object-center"}`} sizes="(min-width:1280px) 25vw,(min-width:768px) 50vw,100vw" quality={88} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <p className="absolute left-5 top-5 text-[9px] uppercase tracking-[0.25em] text-white/80">0{index + 1} · {hotel.descriptor}</p>
            {isSelected && <span className="absolute right-5 top-5 bg-white px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-black">Selected</span>}
            <div className="absolute inset-x-5 bottom-5 text-white"><h3 className="font-serif text-[1.65rem] leading-[1.05]">{hotel.name}</h3><p className="mt-3 text-[9px] uppercase tracking-[0.2em] text-white/65">{destination.city}, {destination.country}</p></div>
          </div>
          <div className="grid grid-cols-2 border-b border-black/10">
            <button type="button" onClick={() => choose({ ...hotel, type: "curated" })} className={`min-h-14 border-r border-black/10 text-[10px] uppercase tracking-[0.18em] transition ${isSelected ? "bg-black text-white" : "hover:bg-black hover:text-white"}`}>{isSelected ? "In your trip" : "Select stay"}</button>
            {hotel.bookingUrl ? <a href={bookingHotelUrl(hotel, quiz)} target="_blank" rel="noopener sponsored" className="grid min-h-14 place-items-center text-[10px] uppercase tracking-[0.18em] transition hover:bg-black hover:text-white">Check live →</a> : <span className="grid min-h-14 place-items-center text-[10px] uppercase tracking-[0.18em] text-black/35">Link being verified</span>}
          </div>
        </article>;
      })}
    </div>

    <div className="border-b border-black/15 py-7">
      {editingCustom ? <form onSubmit={addCustom} className="flex flex-col gap-3 sm:flex-row"><input autoFocus value={customHotel} onChange={(event) => setCustomHotel(event.target.value)} placeholder="Hotel name" className="min-h-14 flex-1 border border-black/20 bg-transparent px-5 font-serif text-lg outline-none focus:border-black" /><button className="min-h-14 bg-black px-8 text-[10px] uppercase tracking-[0.18em] text-white">Add to trip</button><button type="button" onClick={() => setEditingCustom(false)} className="min-h-14 px-5 text-[10px] uppercase tracking-[0.18em]">Cancel</button></form> : <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-xl">{selected ? selected.name : "Choose one—or keep the trip open."}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] uppercase tracking-[0.18em]"><button onClick={() => setEditingCustom(true)}>Add another hotel</button><button onClick={remove}>I already have a stay</button>{selected && <button onClick={() => { setSelected(null); window.localStorage.removeItem(`globtrekStay:${destination.city}`); }}>Clear</button>}</div>
      </div>}
    </div>

    {selectedHotel?.bookingUrl && <a href={bookingHotelUrl(selectedHotel, quiz)} target="_blank" rel="noopener sponsored" className="mt-8 flex min-h-20 items-center justify-between bg-[#171714] px-7 text-white sm:px-10"><span><span className="block text-[9px] uppercase tracking-[0.24em] text-white/50">Selected stay</span><strong className="mt-2 block font-serif text-xl font-normal sm:text-2xl">{selectedHotel.name}</strong></span><span className="text-[10px] uppercase tracking-[0.2em]">Check rooms →</span></a>}
  </section>;
}

export default function ResultsPage() {
  const [quiz, setQuiz] = useState(null);
  const [remoteMatches, setRemoteMatches] = useState(null);
  const [chosenAirport, setChosenAirport] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("globtrekQuiz");
    const stored = raw ? JSON.parse(raw) : { answers: {} };
    const initialize = window.setTimeout(() => {
      setChosenAirport(new URLSearchParams(window.location.search).get("destination"));
      setQuiz(stored);
    }, 0);
    fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(stored) })
      .then((response) => response.json())
      .then((data) => Array.isArray(data.matches) && data.matches.length && setRemoteMatches(data.matches))
      .catch(() => {});
    const timer = window.setTimeout(() => setReady(true), 100);
    return () => {
      window.clearTimeout(initialize);
      window.clearTimeout(timer);
    };
  }, []);

  const localMatches = useMemo(() => getMatches(quiz), [quiz]);
  const matches = remoteMatches || localMatches;
  const chosenTrip = chosenAirport ? destinations.find((destination) => destination.airport === chosenAirport) : null;
  const trip = chosenTrip || matches[0];
  const alternatives = matches.filter((place) => place.airport !== trip?.airport).slice(0, 3);
  if (!trip) return null;

  const dates = quiz?.isFlexible
    ? quiz?.answers?.season || "Flexible dates"
    : [formatDate(quiz?.tripStart), formatDate(quiz?.tripEnd)].filter(Boolean).join(" — ") || "Flexible dates";
  const companions = quiz?.answers?.self || "Your trip";
  const tools = [
    ["Fly", `Flights to ${trip.airport}`, bookingFlightUrl(trip, quiz), true],
    ["Do", `Experiences in ${trip.city}`, bookingActivityUrl(trip), true],
    ["Drive", "Cars & transfers", bookingLinks.cars, true],
    ["Dine", `Restaurants in ${trip.city}`, diningSearchUrl(trip), false],
  ];

  return (
    <main className={`min-h-screen bg-[#f3f0eb] text-[#171714] transition duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-7 text-[#171714] sm:px-12 sm:py-10">
        <Link href="/" className="text-[13px] font-semibold uppercase tracking-[0.32em]">Globtrēk</Link>
        <Link href="/discover" className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.2em]"><span className="hidden sm:inline">Retake quiz</span><span className="grid h-10 w-10 place-items-center rounded-full border border-black/25 transition group-hover:bg-black group-hover:text-white">↺</span></Link>
      </header>

      <section className="relative min-h-[92svh] overflow-hidden">
        <Image src={trip.image} alt={`${trip.city}, ${trip.country}`} fill priority className="object-cover" sizes="100vw" quality={88} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f3f0eb]/55 via-transparent to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
          <div className="max-w-6xl text-white [text-shadow:0_2px_24px_rgba(0,0,0,.2)]">
            <p className="mb-7 text-[10px] font-medium uppercase tracking-[0.35em]">Your place is</p>
            <h1 className="font-serif text-[clamp(3.4rem,9vw,9.5rem)] font-normal leading-[0.82] tracking-[-0.055em]">{trip.city}</h1>
            <p className="mt-7 text-[11px] uppercase tracking-[0.32em]">{trip.country}</p>
            <p className="mt-7 text-[10px] uppercase tracking-[0.24em]">{dates} <span className="mx-3">•</span> {companions}</p>
          </div>
        </div>
        <a href="#trip" aria-label="Explore your result" className="absolute bottom-8 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border border-white/70 text-xl text-white transition hover:bg-white hover:text-black">↓</a>
      </section>

      <section id="trip" className="mx-auto max-w-[1460px] px-6 py-24 sm:px-12 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-black/50">Why this is yours</p>
          <h2 className="mt-8 font-serif text-[clamp(2.3rem,5vw,5rem)] leading-[1.02] tracking-[-0.035em]">{trip.style}</h2>
          <p className="mx-auto mt-8 max-w-2xl text-base font-light leading-8 text-black/60 sm:text-lg">{trip.why}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-4 text-[10px] uppercase tracking-[0.2em] text-black/55">
            <span>{trip.nights}</span><span>{trip.season}</span><span>{trip.price}</span>
          </div>
        </div>

        <HotelShortlist destination={trip} quiz={quiz} />

        <div className="mt-24 border-y border-black/15">
          {tools.map(([label, detail, href, sponsored]) => (
            <a key={label} href={href} target="_blank" rel={sponsored ? "noopener sponsored" : "noopener"} className="group grid min-h-20 grid-cols-[4rem_1fr_auto] items-center border-b border-black/10 last:border-b-0 sm:grid-cols-[8rem_1fr_auto]">
              <span className="text-[10px] uppercase tracking-[0.25em] text-black/45">{label}</span>
              <span className="font-serif text-xl sm:text-2xl">{detail}</span>
              <span className="text-xl transition-transform group-hover:translate-x-2">→</span>
            </a>
          ))}
        </div>
        <p className="mt-4 text-center text-[10px] leading-5 text-black/40">Booking.com links are sponsored affiliate links. Current prices, availability, and final terms are shown by the provider.</p>

        <div className="mt-28 flex items-end justify-between border-b border-black/15 pb-7">
          <h2 className="font-serif text-[clamp(2.4rem,5vw,4.8rem)] tracking-[-0.04em]">Other possibilities</h2>
          <Link href="/discover" className="hidden text-[10px] uppercase tracking-[0.22em] sm:block">Try again →</Link>
        </div>
        <div className="grid gap-10 pt-10 md:grid-cols-3">
          {alternatives.map((place) => (
            <Link key={place.name} href={`/results?destination=${encodeURIComponent(place.airport)}`} scroll onClick={() => setChosenAirport(place.airport)} className="group block" aria-label={`Plan a complete trip to ${place.city}`}>
              <div className="relative aspect-[4/3] overflow-hidden bg-black/5"><Image src={place.image} alt={place.name} fill className="object-cover transition duration-700 group-hover:scale-[1.035]" sizes="(min-width:768px) 33vw,100vw" quality={82} /></div>
              <div className="flex items-end justify-between border-b border-black/10 px-1 py-6">
                <div><h3 className="font-serif text-2xl">{place.city}</h3><p className="mt-2 text-[9px] uppercase tracking-[0.22em] text-black/45">{place.country} · {place.season}</p></div>
                <span className="text-xl transition-transform group-hover:translate-x-2">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

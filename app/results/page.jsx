"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bookingActivityUrl, bookingFlightUrl, bookingLinks, destinations, diningSearchUrl, scoreDestination } from "../data/destinations";
import { hotelsFor } from "../data/hotels";

function getMatches(quiz) {
  const answers = quiz?.answers || {};
  return [...destinations]
    .map((destination) => ({ ...destination, score: scoreDestination(destination, answers) }))
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
  const hotels = useMemo(() => hotelsFor(destination, quiz), [destination, quiz]);
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

  return <section className="mt-16">
    <div className="flex flex-col gap-6 border-b border-black/15 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Your stay</p><h2 className="mt-4 font-serif text-[clamp(2.2rem,4vw,3.8rem)] tracking-[-0.04em]">Four worth traveling for</h2></div>
      <p className="max-w-md text-sm font-light leading-6 text-black/50">An editorial shortlist for {destination.city}. Booking.com confirms live rooms, prices, and final terms.</p>
    </div>

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {hotels.map((hotel, index) => {
        const isSelected = selected?.id === hotel.id;
        return <article key={hotel.id} className="group overflow-hidden bg-white shadow-[0_12px_45px_rgba(23,23,20,0.055)]">
          <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
            <Image src={hotel.image} alt={`${hotel.name} in ${destination.city}`} fill className={`object-cover transition duration-700 group-hover:scale-[1.025] ${index === 1 ? "object-[65%_center]" : index === 2 ? "object-[35%_center]" : index === 3 ? "object-bottom" : "object-center"}`} sizes="(min-width:1280px) 25vw,(min-width:768px) 50vw,100vw" quality={88} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <p className="absolute left-5 top-5 text-[9px] uppercase tracking-[0.25em] text-white/80">0{index + 1} · {hotel.descriptor}</p>
            {isSelected && <span className="absolute right-5 top-5 bg-white px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-black">Selected</span>}
            <div className="absolute inset-x-5 bottom-5 text-white"><h3 className="font-serif text-[1.35rem] leading-[1.05]">{hotel.name}</h3><p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/65">{destination.city}, {destination.country}</p></div>
          </div>
          <div className="grid grid-cols-2 border-b border-black/10">
            <button type="button" onClick={() => choose({ ...hotel, type: "curated" })} className={`min-h-12 border-r border-black/10 text-[10px] uppercase tracking-[0.18em] transition ${isSelected ? "bg-black text-white" : "hover:bg-black hover:text-white"}`}>{isSelected ? "In your trip" : "Select stay"}</button>
            {hotel.bookingUrl ? <a href={bookingHotelUrl(hotel, quiz)} target="_blank" rel="noopener sponsored" className="grid min-h-12 place-items-center text-[10px] uppercase tracking-[0.18em] transition hover:bg-black hover:text-white">Check live →</a> : <span className="grid min-h-12 place-items-center text-[10px] uppercase tracking-[0.18em] text-black/35">Link being verified</span>}
          </div>
        </article>;
      })}
    </div>

    <div className="border-b border-black/15 py-5">
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

      <section className="relative min-h-svh overflow-hidden">
        <Image src={trip.image} alt={`${trip.city}, ${trip.country}`} fill priority className="object-cover" sizes="100vw" quality={88} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />
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

      <section id="trip" className="mx-auto max-w-[1460px] px-6 py-20 sm:px-12 sm:py-28">
        <div className="grid items-end gap-10 border-b border-black/15 pb-14 lg:grid-cols-[0.8fr_1.2fr] lg:pb-20">
          <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Why here</p><h2 className="mt-5 max-w-xl font-serif text-[clamp(2.7rem,5vw,5.8rem)] leading-[0.88] tracking-[-0.05em]">{trip.style}</h2></div>
          <div className="lg:pb-1"><p className="max-w-2xl text-[clamp(1.05rem,1.6vw,1.35rem)] font-light leading-[1.55] text-black/60">{trip.why}</p><div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[9px] uppercase tracking-[0.2em] text-black/45"><span>{quiz?.answers?.duration || trip.nights}</span><span>{trip.season}</span><span>{trip.price}</span></div></div>
        </div>

        <HotelShortlist destination={trip} quiz={quiz} />

        {trip.plan && <section className="mt-16 bg-[#171714] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">Your trip, organized</p>
              <h2 className="mt-5 max-w-xl font-serif text-[clamp(2.3rem,4vw,4rem)] leading-[0.95] tracking-[-0.04em]">{trip.plan.headline}</h2>
              {trip.plan.airport && <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-white/45">Arrive via {trip.plan.airport.code} · {trip.plan.airport.note}</p>}
              {trip.plan.arrivalWindow && <div className="mt-8 border-l border-white/20 pl-5"><p className="text-[9px] uppercase tracking-[0.2em] text-white/40">{trip.plan.arrivalWindow.title}</p><p className="mt-3 text-sm leading-6 text-white/65">{trip.plan.arrivalWindow.steps?.[0]}</p></div>}
            </div>
            <div className="border-t border-white/15">
              {trip.plan.days?.slice(0, 3).map((day) => <article key={`${day.day}-${day.title}`} className="grid gap-3 border-b border-white/15 py-5 sm:grid-cols-[4rem_1fr]">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">{day.day}</p>
                <div><h3 className="font-serif text-xl">{day.title}</h3><p className="mt-2 text-xs leading-5 text-white/55">{day.morning} · {day.afternoon} · {day.evening}</p></div>
              </article>)}
            </div>
          </div>
          {trip.plan.picks && <div className="mt-8 grid border-l border-t border-white/15 md:grid-cols-2">
            {[["Eat", trip.plan.picks.restaurants], ["Experience", trip.plan.picks.experiences]].map(([label, picks]) => <div key={label} className="border-b border-r border-white/15 p-5 sm:p-6">
              <p className="text-[9px] uppercase tracking-[0.22em] text-white/40">{label}</p>
              <div className="mt-4 space-y-4">{picks?.slice(0, 3).map((pick) => <div key={pick.name}><h3 className="font-serif text-lg">{pick.name}</h3><p className="mt-1 text-[11px] leading-4 text-white/45">{pick.why}</p></div>)}</div>
            </div>)}
          </div>}
          {trip.plan.budget?.length > 0 && <div className="mt-8 grid grid-cols-2 border-l border-t border-white/15 lg:grid-cols-4">{trip.plan.budget.slice(0, 4).map((item) => <div key={item.category} className="border-b border-r border-white/15 p-4"><p className="text-[8px] uppercase tracking-[0.18em] text-white/35">{item.category}</p><p className="mt-2 font-serif text-xl">{item.share}</p></div>)}</div>}
          <p className="mt-4 text-[9px] leading-4 text-white/30">Typical planning estimates. Confirm schedules, prices, availability, and opening times.</p>
        </section>}

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(([label, detail, href, sponsored]) => (
            <a key={label} href={href} target="_blank" rel={sponsored ? "noopener sponsored" : "noopener"} className="group flex min-h-40 flex-col justify-between bg-white p-6 shadow-[0_12px_40px_rgba(23,23,20,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(23,23,20,0.08)]">
              <span className="text-[9px] uppercase tracking-[0.25em] text-black/40">{label}</span>
              <span className="flex items-end justify-between gap-4"><span className="font-serif text-xl leading-tight">{detail}</span><span className="text-lg transition-transform group-hover:translate-x-1">↗</span></span>
            </a>
          ))}
        </div>
        <p className="mt-4 text-center text-[10px] leading-5 text-black/40">Booking.com links are sponsored affiliate links. Current prices, availability, and final terms are shown by the provider.</p>

        <div className="mt-20 flex items-end justify-between border-b border-black/15 pb-6">
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

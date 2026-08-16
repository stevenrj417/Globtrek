"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { bookingActivityUrl, bookingFlightUrl, bookingLinks, destinations, diningSearchUrl } from "../data/destinations";
import { hotelsFor } from "../data/hotels";
import { normalizeTravelerProfile } from "../lib/recommendation/travelerProfile";
import { rankDestinations } from "../lib/recommendation/destinationEngine";
import { shortlistHotels } from "../lib/recommendation/hotelEngine";
import { AccountEntry } from "../components/AccountEntry";
import { SaveTripButton } from "../components/SaveTripButton";
import { HotelPropertyPhoto } from "../components/HotelPropertyPhoto";

function getMatches(quiz) {
  return rankDestinations(destinations, normalizeTravelerProfile(quiz || {}));
}

function formatDate(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function ArrowUpRight() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.4"><path d="M7 17 17 7M8 7h9v9" /></svg>;
}

function encodeTrip(trip) {
  const bytes = new TextEncoder().encode(JSON.stringify(trip));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeTrip(value) {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function venueUrl(name, destination) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${name}, ${destination.city}, ${destination.country}`)}`;
}

function estimateTrip(quiz) {
  const ranges = { "Smart value": [0, 3000], Comfortable: [3000, 6000], Premium: [6000, 10000], Blowout: [10000, 15000] };
  const [low, high] = ranges[quiz?.answers?.memory] || [3000, 6000];
  const guests = Math.max(1, Number.parseInt(quiz?.guestCount, 10) || 2);
  const money = (value) => value === 0 ? "$0" : `$${Math.round(value / 1000)}k`;
  return `${money(low * guests)}–${money(high * guests)} total · ${guests} traveler${guests === 1 ? "" : "s"}`;
}

function hotelReason(hotel, quiz, index) {
  const labels = { memory: "budget", luxury: "main priority", hotel: "stay style", escape: "pace" };
  for (const key of ["hotel", "luxury", "memory", "escape"]) {
    if (hotel.tags?.includes(quiz?.answers?.[key])) return `Matched to your ${labels[key]}`;
  }
  return index === 0 ? "Strongest overall fit" : "A different take on your trip";
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

function HotelShortlist({ destination, quiz, budgetPlan }) {
  const profile = useMemo(() => normalizeTravelerProfile(quiz), [quiz]);
  const localHotels = useMemo(() => shortlistHotels(hotelsFor(destination, quiz, { limit: Number.MAX_SAFE_INTEGER }), profile, budgetPlan), [budgetPlan, destination, profile, quiz]);
  const [catalogHotels, setCatalogHotels] = useState(null);
  const hotels = catalogHotels?.length ? catalogHotels : localHotels;
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

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hotels/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinationId: destination.airport, quiz }),
      signal: controller.signal,
    }).then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (payload?.hotels?.length) setCatalogHotels(payload.hotels); })
      .catch((error) => { if (error.name !== "AbortError") console.warn("Hotel catalog fallback active."); });
    return () => controller.abort();
  }, [destination.airport, quiz]);

  function choose(stay) {
    setSelected(stay);
    window.localStorage.setItem(`globtrekStay:${destination.city}`, JSON.stringify(stay));
    track("hotel_selected", { destination: destination.city, hotel: stay.name });
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
      <div><p className="text-[10px] uppercase tracking-[0.3em] text-black/45">Your stay</p><h2 className="mt-4 font-serif text-[clamp(2.2rem,4vw,3.8rem)] tracking-[-0.04em]">Three worth traveling for</h2></div>
      <p className="max-w-md text-sm font-light leading-6 text-black/50">An editorial shortlist for {destination.city}. Booking.com confirms live rooms, prices, and final terms.</p>
    </div>

    <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
      {hotels.map((hotel, index) => {
        const isSelected = selected?.id === hotel.id;
        return <article key={hotel.id} className="group w-[82vw] max-w-[330px] shrink-0 snap-center overflow-hidden bg-white shadow-[0_12px_45px_rgba(23,23,20,0.055)] md:w-auto md:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
            <HotelPropertyPhoto hotel={hotel} destination={destination} index={index} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <p className="absolute left-5 top-5 text-[9px] uppercase tracking-[0.25em] text-white/80">0{index + 1} · {hotel.descriptor}</p>
            {isSelected && <span className="absolute right-5 top-5 bg-white px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-black">Selected</span>}
            <div className="absolute inset-x-5 bottom-5 text-white"><h3 className="font-serif text-[1.35rem] leading-[1.05]">{hotel.name}</h3><p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/65">{destination.city}, {destination.country}</p></div>
          </div>
          <p className="border-b border-black/10 px-5 py-3 text-[9px] uppercase tracking-[0.16em] text-black/40">{hotelReason(hotel, quiz, index)}</p>
          <div className="grid grid-cols-2 border-b border-black/10">
            <button type="button" onClick={() => choose({ ...hotel, type: "curated" })} className={`min-h-12 border-r border-black/10 text-[10px] uppercase tracking-[0.18em] transition ${isSelected ? "bg-black text-white" : "hover:bg-black hover:text-white"}`}>{isSelected ? "In your trip" : "Select stay"}</button>
            {hotel.bookingUrl ? <a href={bookingHotelUrl(hotel, quiz)} onClick={() => track("hotel_affiliate_clicked", { destination: destination.city, hotel: hotel.name })} target="_blank" rel="noopener sponsored" className="grid min-h-12 place-items-center text-[10px] uppercase tracking-[0.18em] transition hover:bg-black hover:text-white">Check live →</a> : <span className="grid min-h-12 place-items-center text-[10px] uppercase tracking-[0.18em] text-black/35">Link being verified</span>}
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
  const [planning, setPlanning] = useState(true);
  const [refining, setRefining] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("trip") ? decodeTrip(params.get("trip")) : null;
    const raw = window.localStorage.getItem("globtrekQuiz");
    const stored = shared?.quiz || (raw ? JSON.parse(raw) : { answers: {} });
    const initialize = window.setTimeout(() => {
      setChosenAirport(shared?.destination || params.get("destination"));
      setQuiz(stored);
    }, 0);
    fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...stored, destination: shared?.destination || params.get("destination") }) })
      .then((response) => response.json())
      .then((data) => Array.isArray(data.matches) && data.matches.length && setRemoteMatches(data.matches))
      .catch(() => {})
      .finally(() => setPlanning(false));
    const timer = window.setTimeout(() => setReady(true), 100);
    track("result_viewed", { shared: Boolean(shared) });
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
  if (!ready || !quiz || !trip) return <main className="min-h-screen bg-[#f3f0eb]" />;

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
  const budgetPlan = trip.budgetPlan;
  const travelerProfile = normalizeTravelerProfile(quiz);
  const money = (value) => `$${Math.round(value || 0).toLocaleString("en-US")}`;
  const estimatedTotal = budgetPlan?.targetBudget ? `${money(budgetPlan.estimatedTripLow)}–${money(budgetPlan.estimatedTripHigh)} estimated` : estimateTrip(quiz);
  const sharedPayload = encodeTrip({ quiz, destination: trip.airport });
  const savedTrip = {
    clientTripKey: `${trip.airport}:${sharedPayload.slice(0, 120)}`,
    sharePath: `/results?trip=${sharedPayload}`,
    destination: { city: trip.city, country: trip.country, airport: trip.airport, image: trip.image, style: trip.style },
    trip: quiz,
    travelerProfile,
    exactBudget: travelerProfile.exactBudget,
    includedBudgetCategories: travelerProfile.includedBudgetCategories,
    preferences: {
      quizAnswers: quiz?.answers || {},
      budget: quiz?.answers?.memory || null,
      pace: quiz?.answers?.escape || null,
      familiarity: quiz?.discoveryLevel ?? null,
    },
    itinerary: trip.plan || null,
    estimatedCosts: budgetPlan || null,
    costConfidence: budgetPlan?.confidence ?? null,
    bookingLinks: { hotel: null, flight: tools[0][2], activities: tools[1][2], car: tools[2][2], dining: tools[3][2] },
    selections: { hotel: null, flight: null, car: null, activities: [] },
  };

  async function refine(tune) {
    if (!quiz || refining) return;
    setRefining(true);
    track("trip_refined", { refinement: tune, destination: trip.city });
    try {
      const response = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...quiz, tune, destination: trip.airport }) });
      const data = await response.json();
      if (Array.isArray(data.matches) && data.matches.length) setRemoteMatches(data.matches);
    } finally {
      setRefining(false);
    }
  }

  function tripLink() {
    const payload = encodeTrip({ quiz, destination: trip.airport });
    return `${window.location.origin}/results?trip=${payload}`;
  }

  async function shareTrip() {
    const url = tripLink();
    track("trip_shared", { destination: trip.city });
    if (navigator.share) {
      try {
        await navigator.share({ title: `My GlobTrek trip to ${trip.city}`, text: `GlobTrek planned ${trip.city} for me.`, url });
        setShareStatus("Shared");
        return;
      } catch {
        setShareStatus("");
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied");
    } catch {
      window.prompt("Copy your trip link", url);
    }
  }

  function emailTrip() {
    const subject = encodeURIComponent(`My GlobTrek trip to ${trip.city}`);
    const body = encodeURIComponent(`Here is my personalized GlobTrek trip:\n\n${tripLink()}`);
    track("trip_emailed", { destination: trip.city });
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <main className={`min-h-screen bg-[#f3f0eb] text-[#171714] transition duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-7 text-white sm:px-12 sm:py-10">
        <Link href="/" className="text-[13px] font-semibold uppercase tracking-[0.32em]">Globtrēk</Link>
        <div className="flex items-center gap-5"><AccountEntry compact light /><Link href="/discover" className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.2em]"><span className="hidden sm:inline">Retake quiz</span><span className="grid h-10 w-10 place-items-center rounded-full border border-white/55 transition group-hover:bg-white group-hover:text-black">↺</span></Link></div>
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

        <div className="grid gap-px bg-black/10 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="bg-[#f3f0eb] px-5 py-5"><p className="text-[8px] uppercase tracking-[0.2em] text-black/40">Estimated trip range</p><p className="mt-2 font-serif text-xl">{estimatedTotal}</p>{budgetPlan?.targetBudget ? <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-black/40">Target {money(budgetPlan.targetBudget)} · estimates, not live prices</p> : null}</div>
          <button type="button" onClick={shareTrip} className="min-h-20 bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] transition hover:bg-white">{shareStatus || "Save / share"}</button>
          <SaveTripButton trip={savedTrip} className="min-h-20 bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] transition hover:bg-white" />
          <button type="button" onClick={emailTrip} className="min-h-20 bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] transition hover:bg-white">Email this trip</button>
        </div>

        {budgetPlan?.estimates ? <div className="grid grid-cols-2 border-l border-t border-black/10 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(budgetPlan.estimates).map(([key, item]) => {
            const included = key === "miscBuffer" || budgetPlan.includedBudgetCategories[key];
            return <div key={key} className="border-b border-r border-black/10 px-4 py-5"><p className="text-[8px] uppercase tracking-[0.18em] text-black/40">{key === "transportation" ? "Transport" : key.replace(/([A-Z])/g, " $1")}</p><p className="mt-2 font-serif text-lg">{included ? `${money(item.low)}–${money(item.high)}` : "Not included"}</p></div>;
          })}
        </div> : null}

        {planning && !trip.plan && <div className="mt-16 flex min-h-32 items-center justify-between border-y border-black/15 py-8"><div><p className="text-[9px] uppercase tracking-[0.25em] text-black/40">Building your edit</p><p className="mt-3 font-serif text-2xl">Finding the places that fit you.</p></div><span className="h-2 w-2 animate-pulse rounded-full bg-black" /></div>}

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
          <div className="mt-8 flex flex-wrap gap-2 border-t border-white/15 pt-6">
            {["More affordable", "More local", "More relaxing", "More adventurous"].map((label) => <button disabled={refining} type="button" key={label} onClick={() => refine(label.toLowerCase())} className="border border-white/20 px-4 py-3 text-[9px] uppercase tracking-[0.16em] text-white/65 transition hover:border-white/60 hover:text-white disabled:opacity-35">{refining ? "Refining…" : label}</button>)}
            <Link href="/discover" className="border border-white/20 px-4 py-3 text-[9px] uppercase tracking-[0.16em] text-white/65 transition hover:border-white/60 hover:text-white">Different destination</Link>
          </div>
          {trip.plan.picks && <div className="mt-8 grid border-l border-t border-white/15 md:grid-cols-2">
            {[["Eat", trip.plan.picks.restaurants], ["Experience", trip.plan.picks.experiences]].map(([label, picks]) => <div key={label} className="border-b border-r border-white/15 p-5 sm:p-6">
              <p className="text-[9px] uppercase tracking-[0.22em] text-white/40">{label}</p>
              <div className="mt-4 space-y-4">{picks?.slice(0, 3).map((pick) => <a href={venueUrl(pick.name, trip)} target="_blank" rel="noopener" onClick={() => track("recommendation_clicked", { type: label, destination: trip.city })} className="group block" key={pick.name}><h3 className="flex items-center gap-2 font-serif text-lg group-hover:underline">{pick.name}<span className="h-4 w-4 text-white/35"><ArrowUpRight /></span></h3><p className="mt-1 text-[11px] leading-4 text-white/45">{pick.why}</p></a>)}</div>
            </div>)}
          </div>}
          {trip.plan.budget?.length > 0 && <div className="mt-8 grid grid-cols-2 border-l border-t border-white/15 lg:grid-cols-4">{trip.plan.budget.slice(0, 4).map((item) => <div key={item.category} className="border-b border-r border-white/15 p-4"><p className="text-[8px] uppercase tracking-[0.18em] text-white/35">{item.category}</p><p className="mt-2 font-serif text-xl">{item.share}</p></div>)}</div>}
          <p className="mt-4 text-[9px] leading-4 text-white/30">Typical planning estimates. Confirm schedules, prices, availability, and opening times.</p>
        </section>}

        <a href="#book" onClick={() => track("booking_checklist_started", { destination: trip.city })} className="mt-5 flex min-h-16 items-center justify-between border border-black px-6 text-[10px] uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"><span>Start booking this trip</span><span>↓</span></a>

        <HotelShortlist destination={trip} quiz={quiz} budgetPlan={budgetPlan} />

        <div id="book" className="mt-20 scroll-mt-6">
          <div className="mb-8 flex items-end justify-between border-b border-black/15 pb-6"><div><p className="text-[9px] uppercase tracking-[0.24em] text-black/40">Booking checklist</p><h2 className="mt-3 font-serif text-[clamp(2.2rem,4vw,4rem)] leading-none">One trip. Four decisions.</h2></div><p className="hidden max-w-xs text-right text-xs leading-5 text-black/45 sm:block">Open each provider with your destination and traveler details already carried through.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {tools.map(([label, detail, href, sponsored], index) => (
            <a key={label} href={href} onClick={() => track(`${label.toLowerCase()}_clicked`, { destination: trip.city })} target="_blank" rel={sponsored ? "noopener sponsored" : "noopener"} className="group flex min-h-36 flex-col justify-between bg-white p-5 shadow-[0_12px_40px_rgba(23,23,20,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(23,23,20,0.08)] sm:min-h-40 sm:p-6">
              <span className="flex items-center justify-between text-[9px] uppercase tracking-[0.25em] text-black/40"><span>{label}</span><span>0{index + 1}</span></span>
              <span className="flex items-end justify-between gap-4"><span className="font-serif text-[1.15rem] leading-tight sm:text-xl">{detail}</span><span className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"><ArrowUpRight /></span></span>
            </a>
          ))}
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] leading-5 text-black/40">Booking.com links are sponsored affiliate links. Current prices, availability, and final terms are shown by the provider.</p>

        <div className="mt-20 flex items-end justify-between border-b border-black/15 pb-6">
          <h2 className="font-serif text-[clamp(2.4rem,5vw,4.8rem)] tracking-[-0.04em]">Other possibilities</h2>
          <Link href="/discover" className="hidden text-[10px] uppercase tracking-[0.22em] sm:block">Try again →</Link>
        </div>
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 pt-8 md:mx-0 md:grid md:grid-cols-3 md:gap-10 md:overflow-visible md:px-0 md:pb-0 md:pt-10">
          {alternatives.map((place) => (
            <Link key={place.name} href={`/results?destination=${encodeURIComponent(place.airport)}`} scroll onClick={() => setChosenAirport(place.airport)} className="group block w-[82vw] max-w-[330px] shrink-0 snap-center md:w-auto md:max-w-none" aria-label={`Plan a complete trip to ${place.city}`}>
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

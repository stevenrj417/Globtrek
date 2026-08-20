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
import { ItineraryDocument } from "../components/ItineraryDocument";
import { EmailTripButton } from "../components/EmailTripButton";
import { SaveItemButton } from "../components/SaveItemButton";
import { FlightSearchSection } from "../components/FlightSearchSection";

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

function ChevronDown() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current transition-transform duration-300 group-open:rotate-180" strokeWidth="1.4"><path d="m6 9 6 6 6-6" /></svg>;
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

function veganDiningUrl(destination) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`vegan restaurants in ${destination.city}, ${destination.country}`)}`;
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
  const rooms = Number.parseInt(trip?.roomCount, 10);
  target.searchParams.set("no_rooms", String(Number.isFinite(rooms) && rooms > 0 ? Math.min(rooms, 30) : 1));
  target.searchParams.set("group_children", "0");
  return `${hotel.cjTrackingBaseUrl || bookingLinks.stays}?url=${encodeURIComponent(target.toString())}`;
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
      if (raw) {
        const restored = JSON.parse(raw);
        setSelected(restored);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [destination.city]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hotels/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinationId: destination.id || destination.airport, quiz }),
      signal: controller.signal,
    }).then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (payload?.hotels?.length) setCatalogHotels(payload.hotels); })
      .catch((error) => { if (error.name !== "AbortError") console.warn("Hotel catalog fallback active."); });
    return () => controller.abort();
  }, [destination.id, destination.airport, quiz]);

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

  return <section id="hotel-selection" className="mt-16 scroll-mt-6">
    <h2 className="border-b border-black pb-6 font-serif text-[clamp(2.2rem,4vw,3.8rem)] tracking-[-0.04em]">Hotels in {destination.city}</h2>

    <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
      {hotels.map((hotel, index) => {
        const isSelected = selected?.id === hotel.id;
        const hotelUrl = bookingHotelUrl(hotel, quiz);
        return <article key={hotel.id} className={`group w-[82vw] max-w-[330px] shrink-0 snap-center overflow-hidden bg-white shadow-[0_12px_45px_rgba(23,23,20,0.055)] transition md:w-auto md:max-w-none ${isSelected ? "ring-1 ring-black" : ""}`}>
          {hotelUrl ? <a href={hotelUrl} target="_blank" rel="noopener sponsored" onClick={() => { choose({ ...hotel, type: "curated" }); track("hotel_affiliate_clicked", { destination: destination.city, hotel: hotel.name }); }} className="relative block aspect-[4/5] w-full overflow-hidden bg-black/5 text-left" aria-label={`Select ${hotel.name} and check live rooms`}>
            <HotelPropertyPhoto hotel={hotel} destination={destination} index={index} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition group-hover:from-black/70" />
            <p className="absolute left-5 top-5 text-[9px] uppercase tracking-[0.25em] text-white/80">0{index + 1} · {hotel.descriptor}</p>
            {isSelected && <span className="absolute right-5 top-5 rounded-full bg-white/95 px-3 py-2 text-[8px] uppercase tracking-[0.18em] text-black">Selected ✓</span>}
            <div className="absolute inset-x-5 bottom-5 text-white"><h3 className="font-serif text-[1.35rem] leading-[1.05]">{hotel.name}</h3><div className="mt-3 flex items-center justify-between gap-3"><p className="text-[9px] uppercase tracking-[0.2em] text-white/65">{destination.city}, {destination.country}</p><span className="text-[8px] uppercase tracking-[0.16em] text-white/80">{isSelected ? "Selected · open again ↗" : "Select & check rooms ↗"}</span></div></div>
          </a> : <div className="relative block aspect-[4/5] w-full overflow-hidden bg-black/5 text-left" aria-label={`${hotel.name} booking link is being verified`}>
            <HotelPropertyPhoto hotel={hotel} destination={destination} index={index} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <p className="absolute left-5 top-5 text-[9px] uppercase tracking-[0.25em] text-white/80">0{index + 1} · {hotel.descriptor}</p>
            <div className="absolute inset-x-5 bottom-5 text-white"><h3 className="font-serif text-[1.35rem] leading-[1.05]">{hotel.name}</h3><div className="mt-3 flex items-center justify-between gap-3"><p className="text-[9px] uppercase tracking-[0.2em] text-white/65">{destination.city}, {destination.country}</p><span className="text-[8px] uppercase tracking-[0.16em] text-white/60">Link being verified</span></div></div>
          </div>}
          <p className="border-b border-black px-5 py-3 text-[9px] uppercase tracking-[0.16em] text-black">{hotelReason(hotel, quiz, index)}</p>
          <SaveItemButton item={{ type: "hotel", key: hotel.id, title: hotel.name, subtitle: `${destination.city}, ${destination.country}`, imageUrl: hotel.imageUrl || null, data: { destinationAirport: destination.airport, bookingUrl: hotel.bookingUrl || null } }} className="min-h-11 w-full border-b border-black text-[9px] uppercase tracking-[0.18em] text-black hover:text-black" />
        </article>;
      })}
    </div>

    <div className="border-b border-black py-5">
      {editingCustom ? <form onSubmit={addCustom} className="flex flex-col gap-3 sm:flex-row"><input autoFocus value={customHotel} onChange={(event) => setCustomHotel(event.target.value)} placeholder="Hotel name" className="min-h-14 flex-1 border border-black bg-transparent px-5 font-serif text-lg outline-none focus:border-black" /><button className="min-h-14 bg-black px-8 text-[10px] uppercase tracking-[0.18em] text-white">Add to trip</button><button type="button" onClick={() => setEditingCustom(false)} className="min-h-14 px-5 text-[10px] uppercase tracking-[0.18em]">Cancel</button></form> : <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {selected && <p className="font-serif text-xl text-black">{selected.name}</p>}
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] uppercase tracking-[0.18em]"><button onClick={() => setEditingCustom(true)}>Add another hotel</button><button onClick={remove}>I already have a stay</button>{selected && <button onClick={() => { setSelected(null); window.localStorage.removeItem(`globtrekStay:${destination.city}`); }}>Clear</button>}</div>
      </div>}
    </div>
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
  const chosenTrip = chosenAirport ? matches.find((destination) => (destination.id || destination.airport) === chosenAirport) || destinations.find((destination) => (destination.id || destination.airport) === chosenAirport) : null;
  const trip = chosenTrip || matches[0];
  const destinationKey = trip?.id || trip?.airport;
  useEffect(() => {
    if (!destinationKey || !trip) return undefined;
    const controller = new AbortController();
    fetch("/api/recent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "destination", key: destinationKey, title: trip.city, subtitle: trip.country, imageUrl: trip.image, data: { id: destinationKey, airport: trip.airport } }), signal: controller.signal }).catch(() => {});
    fetch("/api/recent-searches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: destinationKey, title: `${trip.city}, ${trip.country}`, searchData: quiz }), signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [destinationKey, trip, quiz]);
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
  const sharedPayload = encodeTrip({ quiz, destination: destinationKey });
  const savedTrip = {
    clientTripKey: `${trip.id || trip.airport}:${sharedPayload.slice(0, 120)}`,
    sharePath: `/results?trip=${sharedPayload}`,
    destination: { id: destinationKey, city: trip.city, country: trip.country, airport: trip.airport, image: trip.image, style: trip.style },
    trip: quiz,
    travelerProfile,
    exactBudget: travelerProfile.exactBudget,
    includedBudgetCategories: travelerProfile.includedBudgetCategories,
    preferences: {
      quizAnswers: quiz?.answers || {},
      budget: quiz?.answers?.memory || null,
      pace: quiz?.answers?.escape || null,
      familiarity: quiz?.answers?.discovery ?? null,
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
      const response = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...quiz, tune, destination: destinationKey }) });
      const data = await response.json();
      if (Array.isArray(data.matches) && data.matches.length) setRemoteMatches(data.matches);
    } finally {
      setRefining(false);
    }
  }

  function tripLink() {
    const payload = encodeTrip({ quiz, destination: destinationKey });
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

  function viewFullTrip() {
    window.sessionStorage.setItem("globtrekCurrentTrip", JSON.stringify({ trip, quiz, savedTrip }));
    window.location.assign("/trip/current");
  }

  return (
    <main className={`min-h-screen bg-[#f3f0eb] text-[#171714] transition duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-7 text-white sm:px-12 sm:py-10">
        <Link href="/" className="text-[13px] font-semibold uppercase tracking-[0.32em]">Globtrēk</Link>
        <div className="flex items-center gap-5"><AccountEntry compact light /><Link href="/discover" className="border-b border-white/55 pb-1 text-[9px] uppercase tracking-[0.2em] transition hover:border-white">Start over</Link></div>
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
        <div className="grid items-end gap-10 border-b border-black pb-14 lg:grid-cols-[0.8fr_1.2fr] lg:pb-20">
          <div><p className="text-[10px] uppercase tracking-[0.3em] text-black">Why here</p><h2 className="mt-5 max-w-xl font-serif text-[clamp(2.7rem,5vw,5.8rem)] leading-[0.88] tracking-[-0.05em]">{trip.style}</h2></div>
          <div className="lg:pb-1"><p className="max-w-2xl text-[clamp(1.05rem,1.6vw,1.35rem)] font-light leading-[1.55] text-black">{trip.why}</p><div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[9px] uppercase tracking-[0.2em] text-black"><span>{quiz?.answers?.duration || trip.nights}</span><span>{trip.season}</span><span>{trip.price}</span></div></div>
        </div>

        <div className="grid gap-px bg-black sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="bg-[#f3f0eb] px-5 py-5"><p className="text-[8px] uppercase tracking-[0.2em] text-black">Estimated trip range</p><p className="mt-2 font-serif text-xl">{estimatedTotal}</p>{budgetPlan?.targetBudget ? <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-black">Target {money(budgetPlan.targetBudget)}</p> : null}</div>
          <button type="button" onClick={shareTrip} className="min-h-20 bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] transition hover:bg-white">{shareStatus || "Save / share"}</button>
          <SaveTripButton trip={savedTrip} className="min-h-20 bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] transition hover:bg-white" />
          <EmailTripButton trip={savedTrip} viewUrl={tripLink()} className="min-h-20 bg-[#f3f0eb] px-7 text-[9px] uppercase tracking-[0.2em] transition hover:bg-white" />
        </div>
        <div className="flex items-center justify-between border-b border-black py-4"><Link href={`/alternatives?trip=${sharedPayload}`} className="text-[8px] uppercase tracking-[0.18em] text-black underline decoration-black underline-offset-4 transition hover:text-black">Doesn’t fit? See other destinations</Link><SaveItemButton item={{ type: "destination", key: destinationKey, title: trip.city, subtitle: trip.country, imageUrl: trip.image, data: { id: destinationKey, airport: trip.airport, style: trip.style } }} className="text-[9px] uppercase tracking-[0.2em] text-black hover:text-black" /></div>

        {budgetPlan?.estimates ? <details className="group border-b border-black">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-[9px] uppercase tracking-[0.2em] text-black transition hover:bg-white/60 [&::-webkit-details-marker]:hidden"><span>View cost breakdown</span><ChevronDown /></summary>
          <div className="grid grid-cols-2 border-l border-t border-black sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(budgetPlan.estimates).map(([key, item]) => {
              const included = key === "miscBuffer" || budgetPlan.includedBudgetCategories[key];
              return <div key={key} className="border-b border-r border-black px-4 py-5"><p className="text-[8px] uppercase tracking-[0.18em] text-black">{key === "transportation" ? "Transport" : key.replace(/([A-Z])/g, " $1")}</p><p className="mt-2 font-serif text-lg">{included ? `${money(item.low)}–${money(item.high)}` : "Not included"}</p></div>;
            })}
          </div>
        </details> : null}
        {budgetPlan?.targetBudget && !budgetPlan.withinHardBudget ? <div role="status" className="border-b border-black bg-[#eee8df] px-5 py-5 text-sm font-light leading-6 text-black"><strong className="mr-2 font-medium text-black">Closest honest estimate.</strong>This destination’s included-category high estimate exceeds your {money(budgetPlan.targetBudget)} target. Globtrek has not marked it as budget-safe; use “Doesn’t fit?” to compare lower-cost destinations or exclude a category from this budget.</div> : null}

        {planning && !trip.plan && <div className="mt-16 grid min-h-72 place-items-center border-y border-black py-12 text-center"><div><span className="mx-auto grid h-14 w-14 animate-spin place-items-center rounded-full border border-black border-t-black text-[8px] font-semibold uppercase tracking-[0.12em]">GT</span><p className="mt-7 font-serif text-3xl tracking-[-0.035em]">Custom itinerary loading…</p><p className="mt-3 text-xs font-light text-black">Building your trip around the way you travel.</p></div></div>}

        <ItineraryDocument trip={trip} quiz={quiz} onRefine={refine} refining={refining} venueUrl={venueUrl} previewDays={3} onViewFull={viewFullTrip} />

        {trip.plan && <section className="mt-16 border-y border-black bg-[#f8f6f2] px-6 py-12 text-[#171714] sm:px-10 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-black">Your trip, organized</p>
              <h2 className="mt-5 max-w-xl font-serif text-[clamp(2.3rem,4vw,4rem)] leading-[0.95] tracking-[-0.04em]">{trip.plan.headline}</h2>
              {trip.plan.airport && <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-black">Arrive via {trip.plan.airport.code} · {trip.plan.airport.note}</p>}
              {trip.plan.arrivalWindow && <div className="mt-8 border-l border-black pl-5"><p className="text-[9px] uppercase tracking-[0.2em] text-black">{trip.plan.arrivalWindow.title}</p><p className="mt-3 text-sm leading-6 text-black">{trip.plan.arrivalWindow.steps?.[0]}</p></div>}
            </div>
            <div className="border-t border-black">
              {trip.plan.days?.slice(0, 3).map((day) => <article key={`${day.day}-${day.title}`} className="grid gap-3 border-b border-black py-6 sm:grid-cols-[4rem_1fr]">
                <p className="text-[9px] uppercase tracking-[0.2em] text-black">{day.day}</p>
                <div><h3 className="font-serif text-2xl">{day.title}</h3><div className="mt-4 grid gap-3 text-xs leading-5 text-black"><p><span className="mr-3 text-[8px] uppercase tracking-[0.16em] text-black">Morning</span>{day.morning}</p><p><span className="mr-3 text-[8px] uppercase tracking-[0.16em] text-black">Afternoon</span>{day.afternoon}</p><p><span className="mr-3 text-[8px] uppercase tracking-[0.16em] text-black">Evening</span>{day.evening}</p></div></div>
              </article>)}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 border-t border-black pt-6">
            {["More affordable", "More local", "More relaxing", "More adventurous"].map((label) => <button disabled={refining} type="button" key={label} onClick={() => refine(label.toLowerCase())} className="border border-black px-4 py-3 text-[9px] uppercase tracking-[0.16em] text-black transition hover:border-black hover:text-black disabled:opacity-35">{refining ? "Refining…" : label}</button>)}
            <Link href="/discover" className="border border-black px-4 py-3 text-[9px] uppercase tracking-[0.16em] text-black transition hover:border-black hover:text-black">Different destination</Link>
          </div>
          {trip.plan.picks && <div className="mt-8 grid border-l border-t border-black md:grid-cols-2">
            {[["Eat", trip.plan.picks.restaurants], ["Experience", trip.plan.picks.experiences]].map(([label, picks]) => <div key={label} className="border-b border-r border-black p-5 sm:p-6">
              <p className="text-[9px] uppercase tracking-[0.22em] text-black">{label}</p>
              {label === "Eat" && <a href={veganDiningUrl(trip)} target="_blank" rel="noopener" onClick={() => track("vegan_restaurants_clicked", { destination: trip.city })} className="mt-4 flex min-h-11 items-center justify-between border border-black px-4 text-[9px] uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white"><span>Vegan options</span><span aria-hidden="true">↗</span></a>}
              <div className="mt-4 space-y-4">{picks?.slice(0, 3).map((pick) => <a href={venueUrl(pick.name, trip)} target="_blank" rel="noopener" onClick={() => track("recommendation_clicked", { type: label, destination: trip.city })} className="group block" key={pick.name}><h3 className="flex items-center gap-2 font-serif text-lg group-hover:underline">{pick.name}<span className="h-4 w-4 text-black"><ArrowUpRight /></span></h3><p className="mt-1 text-[11px] leading-4 text-black">{pick.why}</p></a>)}</div>
            </div>)}
          </div>}
        </section>}

        <a href="#hotel-selection" onClick={() => track("booking_checklist_started", { destination: trip.city })} className="mt-5 flex min-h-20 items-center justify-between border border-black px-6 text-[10px] uppercase tracking-[0.2em] transition hover:bg-black hover:text-white sm:px-10"><span><span className="mr-4 text-black">Your trip is ready.</span> Choose hotel and flight</span><span>↓</span></a>

        <HotelShortlist destination={trip} quiz={quiz} budgetPlan={budgetPlan} />

        <FlightSearchSection key={`flight-search-${destinationKey}`} destination={trip} trip={quiz} />
      </section>
    </main>
  );
}

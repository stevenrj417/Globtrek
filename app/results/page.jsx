"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { bookingLinks, destinations } from "../data/destinations";
import { normalizeTravelerProfile } from "../lib/recommendation/travelerProfile";
import { rankDestinations } from "../lib/recommendation/destinationEngine";
import { AccountEntry } from "../components/AccountEntry";
import { SaveTripButton } from "../components/SaveTripButton";
import { HotelExperience } from "../components/HotelExperience";
import { ItineraryDocument } from "../components/ItineraryDocument";
import { EmailTripButton } from "../components/EmailTripButton";
import { SaveItemButton } from "../components/SaveItemButton";
import { FlightSearchSection } from "../components/FlightSearchSection";

function getMatches(quiz) { return rankDestinations(destinations, normalizeTravelerProfile(quiz || {})); }
function formatDate(value, year = true) { if (!value) return null; return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function money(value) { return `$${Math.round(value || 0).toLocaleString("en-US")}`; }
function encodeTrip(trip) { const bytes = new TextEncoder().encode(JSON.stringify(trip)); let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function decodeTrip(value) { try { const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/")); return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))); } catch { return null; } }

export default function ResultsPage() {
  const [quiz, setQuiz] = useState(null);
  const [remoteMatches, setRemoteMatches] = useState(null);
  const [chosenAirport, setChosenAirport] = useState(null);
  const [ready, setReady] = useState(false);
  const [planning, setPlanning] = useState(true);
  const [shareStatus, setShareStatus] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [flightSearched, setFlightSearched] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [refining, setRefining] = useState(false);

  useEffect(() => { const params = new URLSearchParams(window.location.search); const shared = params.get("trip") ? decodeTrip(params.get("trip")) : null; const raw = window.localStorage.getItem("globtrekQuiz"); const stored = shared?.quiz || (raw ? JSON.parse(raw) : { answers: {} }); const initialize = window.setTimeout(() => { setChosenAirport(shared?.destination || params.get("destination")); setQuiz(stored); }, 0); fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...stored, destination: shared?.destination || params.get("destination") }) }).then((response) => response.json()).then((data) => Array.isArray(data.matches) && data.matches.length && setRemoteMatches(data.matches)).catch(() => {}).finally(() => setPlanning(false)); const timer = window.setTimeout(() => setReady(true), 100); track("result_viewed", { shared: Boolean(shared) }); return () => { window.clearTimeout(initialize); window.clearTimeout(timer); }; }, []);
  const localMatches = useMemo(() => getMatches(quiz), [quiz]);
  const matches = remoteMatches || localMatches;
  const trip = (chosenAirport ? matches.find((destination) => (destination.id || destination.airport) === chosenAirport) : null) || matches[0];
  const destinationKey = trip?.id || trip?.airport;
  useEffect(() => { if (!destinationKey || !trip) return; const controller = new AbortController(); fetch("/api/recent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "destination", key: destinationKey, title: trip.city, subtitle: trip.country, imageUrl: trip.image, data: { id: destinationKey, airport: trip.airport } }), signal: controller.signal }).catch(() => {}); return () => controller.abort(); }, [destinationKey, trip]);
  useEffect(() => {
    if (!trip?.plan || !quiz) return;
    const profile = normalizeTravelerProfile(quiz);
    const savedTrip = {
      clientTripKey: `${destinationKey}:current`,
      sharePath: "/results",
      destination: { id: destinationKey, city: trip.city, country: trip.country, airport: trip.airport, image: trip.image },
      trip: quiz,
      travelerProfile: profile,
      preferences: { pace: profile.pace, budget: profile.exactBudget, familiarity: profile.unknownness, travelAreaPreference: profile.travelAreaPreference, originCountryCode: profile.originCountryCode, quizAnswers: profile.otherExistingQuizPreferences },
      exactBudget: profile.exactBudget,
      includedBudgetCategories: profile.includedBudgetCategories,
      itinerary: trip.plan,
      estimatedCosts: trip.budgetPlan || null,
      selections: { hotel: selectedHotel, flight: null, activities: [] },
      bookingLinks: { hotel: selectedHotel?.bookingUrl || null, flight: bookingLinks.flights },
    };
    window.sessionStorage.setItem("globtrekCurrentTrip", JSON.stringify({ trip, quiz, savedTrip }));
  }, [destinationKey, quiz, selectedHotel, trip]);
  if (!ready || !quiz) return <main className="min-h-screen bg-[#f3f0eb]" />;
  if (!trip) return <main className="grid min-h-screen place-items-center bg-[#f3f0eb] px-6 text-center text-[#171714]"><div><p className="text-[10px] uppercase tracking-[0.2em] text-black/40">No eligible destination</p><h1 className="mt-5 font-serif text-5xl tracking-[-0.04em]">Try a wider travel area.</h1><Link href="/discover" className="mt-8 inline-flex min-h-12 items-center border-b border-black text-sm">Return to the quiz</Link></div></main>;

  const profile = normalizeTravelerProfile(quiz);
  const budgetPlan = trip.budgetPlan;
  const dates = quiz?.isFlexible ? (quiz?.answers?.season || "Flexible dates") : [formatDate(quiz?.tripStart), formatDate(quiz?.tripEnd)].filter(Boolean).join(" — ") || "Flexible dates";
  const heroDates = quiz?.isFlexible ? "Flexible dates" : [formatDate(quiz?.tripStart, false), formatDate(quiz?.tripEnd, false)].filter(Boolean).join(" — ");
  const midpoint = budgetPlan ? Math.round(((budgetPlan.estimatedTripLow || 0) + (budgetPlan.estimatedTripHigh || 0)) / 2 / 50) * 50 : null;
  const total = midpoint ? `${money(midpoint)} estimated` : "Estimate pending";
  const sharedPayload = encodeTrip({ quiz, destination: destinationKey });
  const flightUrl = `${bookingLinks.flights}`;
  const savedTrip = { clientTripKey: `${trip.id || trip.airport}:${sharedPayload.slice(0, 120)}`, sharePath: `/results?trip=${sharedPayload}`, destination: { id: destinationKey, city: trip.city, country: trip.country, airport: trip.airport, image: trip.image }, trip: quiz, travelerProfile: profile, preferences: { pace: profile.pace, budget: profile.exactBudget, familiarity: profile.unknownness, travelAreaPreference: profile.travelAreaPreference, originCountryCode: profile.originCountryCode, quizAnswers: profile.otherExistingQuizPreferences }, exactBudget: profile.exactBudget, includedBudgetCategories: profile.includedBudgetCategories, itinerary: trip.plan || null, estimatedCosts: budgetPlan || null, costConfidence: budgetPlan?.confidence ?? null, bookingLinks: { hotel: selectedHotel?.bookingUrl || null, flight: flightUrl }, selections: { hotel: selectedHotel, flight: null, activities: [] } };
  function tripLink() { return `${window.location.origin}/results?trip=${encodeTrip({ quiz, destination: destinationKey })}`; }
  async function shareTrip() { const url = tripLink(); track("trip_shared", { destination: trip.city }); if (navigator.share) { try { await navigator.share({ title: `My GlobTrek trip to ${trip.city}`, url }); setShareStatus("Shared"); return; } catch {} } try { await navigator.clipboard.writeText(url); setShareStatus("Link copied"); } catch { window.prompt("Copy your trip link", url); } }
  async function refineTrip(label) { if (refining) return; setRefining(true); track("trip_refined", { refinement: label, destination: trip.city }); try { const response = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...quiz, tune: label.toLowerCase(), destination: destinationKey }) }); const data = await response.json(); if (Array.isArray(data.matches) && data.matches.length) setRemoteMatches(data.matches); setAdjustOpen(false); } finally { setRefining(false); } }
  const nextHref = selectedHotel ? "#flights" : "#hotel-selection";
  const nextLabel = selectedHotel ? (flightSearched ? "Review itinerary" : "Search flights") : "Choose hotel";

  return <main className="results-editorial min-h-screen bg-[#f4f1eb] text-[#171714]">
    <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-7 text-white sm:px-12 sm:py-10"><Link href="/" className="text-[13px] font-semibold uppercase tracking-[0.28em]">Globtrēk</Link><div className="flex items-center gap-5"><AccountEntry compact light /><Link href="/discover" className="text-xs text-white/80 hover:text-white">Start over</Link></div></header>
    <section className="relative min-h-svh overflow-hidden"><Image src={trip.image} alt={`${trip.city}, ${trip.country}`} fill priority className="object-cover" sizes="100vw" quality={88} /><div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/60" /><div className="absolute inset-x-0 bottom-[15vh] px-5 text-center text-white sm:px-12"><h1 className="mx-auto max-w-[95vw] font-serif text-[clamp(4rem,11vw,11rem)] font-normal leading-[.78] tracking-[-0.065em] [text-shadow:0_2px_30px_rgba(0,0,0,.22)]">{trip.city}</h1><p className="mt-8 text-[11px] font-medium tracking-[0.08em]">{profile.tripLength} days · {trip.country} · {profile.travelers} {profile.travelers === 1 ? "traveler" : "travelers"}</p>{heroDates ? <p className="mt-3 text-sm text-white/78">{heroDates}</p> : null}</div><a href="#trip-summary" aria-label="View trip" className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[9px] tracking-[.12em] text-white/80"><span>YOUR TRIP</span><span aria-hidden="true">↓</span></a></section>

    <section id="trip-summary" className="border-b border-black/10 px-6 py-10 sm:px-12 sm:py-12"><div className="mx-auto max-w-[1400px]"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4"><div><dt className="text-xs text-black/42">Dates</dt><dd className="mt-2 text-sm">{dates}</dd></div><div><dt className="text-xs text-black/42">Duration</dt><dd className="mt-2 text-sm">{profile.tripLength} days</dd></div><div><dt className="text-xs text-black/42">Travelers</dt><dd className="mt-2 text-sm">{profile.travelers}</dd></div><div><dt className="text-xs text-black/42">Trip estimate</dt><dd className="mt-2 text-sm font-medium">{total}</dd></div></dl><a href="#hotel-selection" className="flex min-h-14 min-w-56 items-center justify-between bg-[#171714] px-6 text-xs text-white"><span>Choose your stay</span><span aria-hidden="true">↓</span></a></div><div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-black/45"><button type="button" onClick={() => setAdjustOpen(true)}>Adjust</button><button type="button" onClick={shareTrip}>{shareStatus || "Share"}</button><SaveTripButton trip={savedTrip} className="text-xs" /><EmailTripButton trip={savedTrip} viewUrl={tripLink()} className="text-xs" /><SaveItemButton item={{ type: "destination", key: destinationKey, title: trip.city, subtitle: trip.country, imageUrl: trip.image, data: { id: destinationKey, airport: trip.airport } }} className="text-xs" /></div></div></section>

    <HotelExperience key={destinationKey} destination={trip} quiz={quiz} budgetPlan={budgetPlan} onSelected={setSelectedHotel} />
    <FlightSearchSection destination={trip} trip={quiz} onSearched={() => setFlightSearched(true)} />
    {planning && !trip.plan ? <section className="px-6 py-24 text-center"><p className="font-serif text-3xl">Building the day-by-day plan…</p></section> : null}
    <ItineraryDocument trip={trip} quiz={quiz} previewDays={3} fullTripHref="/trip/current" />

    {budgetPlan?.estimates ? <section className="px-6 py-20 sm:px-12 sm:py-28" aria-labelledby="budget-heading"><div className="mx-auto max-w-[1240px]"><div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/40">Trip estimate</p><h2 id="budget-heading" className="mt-5 font-serif text-[clamp(3rem,5vw,5rem)] leading-[.92] tracking-[-0.045em]">{total}</h2><p className="mt-6 max-w-sm text-sm leading-6 text-black/55">Planning estimate, not a live quote. Hotel rooms and flights are confirmed with providers before booking.</p>{budgetPlan.targetBudget && !budgetPlan.withinHardBudget ? <p role="status" className="mt-6 text-sm leading-6"><strong>Closest honest estimate.</strong> The current high estimate is above your {money(budgetPlan.targetBudget)} target.</p> : null}</div><dl>{Object.entries(budgetPlan.estimates).map(([key, item]) => { const included = key === "miscBuffer" || budgetPlan.includedBudgetCategories[key]; const label = key === "miscBuffer" ? "Buffer" : key === "transportation" ? "Local transport" : key.charAt(0).toUpperCase() + key.slice(1); return <div key={key} className="flex items-center justify-between border-t border-black/15 py-5 text-sm"><dt>{label}</dt><dd className="text-black/58">{included ? `${money(item.low)}–${money(item.high)} estimated` : "Not included"}</dd></div>; })}</dl></div></div></section> : null}

    <footer className="bg-[#171714] px-6 py-20 text-white sm:px-12"><div className="mx-auto flex max-w-[1240px] flex-col gap-10 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs text-white/45">{trip.city} · {profile.tripLength} days</p><p className="mt-3 font-serif text-4xl">{flightSearched ? "Your plan is ready to review." : selectedHotel ? "Next, your flight." : "Start with your stay."}</p></div><a href={nextHref} className="inline-flex min-h-14 items-center justify-center bg-white px-8 text-sm font-medium text-black">{nextLabel}<span className="ml-4" aria-hidden="true">→</span></a></div></footer>

    <aside className="trip-dock fixed inset-x-2 bottom-2 z-40 overflow-hidden border border-white/10 bg-[#151513]/95 text-white shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl sm:inset-x-6 sm:bottom-5" aria-label="Booking progress">
      <div className="h-px bg-white/12"><div className="h-px bg-[#b99a5f] transition-[width] duration-700" style={{ width: flightSearched ? "100%" : selectedHotel ? "66%" : "33%" }} /></div>
      <div className="flex items-center gap-3 p-2.5 sm:gap-8 sm:px-5 sm:py-3">
        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-8"><div><p className="truncate font-serif text-base leading-none sm:text-xl">{trip.city}</p><p className="mt-1.5 truncate text-[9px] text-white/42">{heroDates || "Flexible dates"} · {profile.travelers} travelers</p></div><ol className="mt-2 hidden gap-7 text-[10px] sm:flex"><li className={selectedHotel ? "text-white" : "text-white/95"}>HOTEL {selectedHotel ? "✓" : "○"}</li><li className={flightSearched ? "text-white" : selectedHotel ? "text-white/95" : "text-white/35"}>FLIGHT {flightSearched ? "✓" : "○"}</li><li className={flightSearched ? "text-white/95" : "text-white/35"}>PLANS ○</li></ol></div>
        <a href={flightSearched ? "#itinerary" : nextHref} aria-label={flightSearched ? "View itinerary" : nextLabel} className="group flex h-12 shrink-0 items-center gap-4 bg-[#f4f0e8] px-4 text-[10px] font-medium text-black transition hover:bg-white sm:px-6"><span>{flightSearched ? "Continue" : nextLabel}</span><span aria-hidden="true">→</span></a>
      </div>
    </aside>

    {adjustOpen ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="adjust-heading" onMouseDown={(event) => { if (event.currentTarget === event.target) setAdjustOpen(false); }}><div className="w-full max-w-2xl bg-[#f4f1eb] p-7 sm:p-12"><div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-[0.16em] text-black/40">Adjust trip</p><h2 id="adjust-heading" className="mt-3 font-serif text-4xl">Change the plan.</h2></div><button type="button" onClick={() => setAdjustOpen(false)} aria-label="Close adjust trip" className="grid h-11 w-11 place-items-center rounded-full border border-black/20">×</button></div><div className="mt-10 grid gap-3 sm:grid-cols-2">{["More affordable", "More local", "More relaxing", "More adventurous"].map((label) => <button key={label} type="button" disabled={refining} onClick={() => refineTrip(label)} className="min-h-14 border border-black/15 px-5 text-left text-sm hover:border-black disabled:opacity-40">{refining ? "Updating trip…" : label}</button>)}</div><Link href={`/alternatives?trip=${sharedPayload}`} className="mt-8 inline-block border-b border-black pb-1 text-sm">Choose a different destination</Link></div></div> : null}
  </main>;
}

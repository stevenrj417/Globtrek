"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { bookingFlightUrl, bookingPropertyUrl, destinations } from "../data/destinations";
import { normalizeTravelerProfile } from "../lib/recommendation/travelerProfile";
import { rankDestinations } from "../lib/recommendation/destinationEngine";
import { AccountEntry } from "../components/AccountEntry";
import { SaveTripButton } from "../components/SaveTripButton";
import { HotelExperience } from "../components/HotelExperience";
import { EmailTripButton } from "../components/EmailTripButton";
import { ProposalItinerary, CuratedTripChoices } from "../components/TripProposalSections";

function getMatches(quiz) { return rankDestinations(destinations, normalizeTravelerProfile(quiz || {})); }
function formatDate(value, year = true) { if (!value) return null; return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function money(value) { return `$${Math.round(value || 0).toLocaleString("en-US")}`; }
function encodeTrip(trip) { const bytes = new TextEncoder().encode(JSON.stringify(trip)); let binary = ""; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function decodeTrip(value) { try { const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/")); return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))); } catch { return null; } }
function selectedKey(item) { return item?.id || item?.name || null; }
function verifiedBookingUrl(item) { try { const url = new URL(item?.bookingUrl); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }

function FlightPlan({ trip, profile, dates, estimate }) {
  const origin = profile.originDetails?.displayName || profile.originDetails?.airportName || profile.origin || "Departure origin";
  return <section className="border-y border-black/12 px-6 py-16 sm:px-12 sm:py-20" aria-labelledby="flight-plan-heading"><div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-[10px] uppercase tracking-[.2em] text-black/40">Your flight plan</p><h2 id="flight-plan-heading" className="mt-4 font-serif text-[clamp(2.8rem,5vw,5rem)] leading-[.9] tracking-[-.05em]">{profile.origin || origin} <span className="text-black/28">→</span> {trip.airport}</h2></div><dl className="grid grid-cols-2 gap-x-8 gap-y-7 self-end text-sm sm:grid-cols-4"><div><dt className="text-black/42">Departure</dt><dd className="mt-2">{origin}</dd></div><div><dt className="text-black/42">Arrival</dt><dd className="mt-2">{trip.city} · {trip.airport}</dd></div><div><dt className="text-black/42">Dates</dt><dd className="mt-2">{dates}</dd></div><div><dt className="text-black/42">Travelers</dt><dd className="mt-2">{profile.travelers}</dd></div>{estimate ? <div className="col-span-2 sm:col-span-4"><dt className="text-black/42">Planning range</dt><dd className="mt-2">{money(estimate.low)}–{money(estimate.high)} estimated · live itinerary not connected</dd></div> : null}</dl></div></section>;
}

function CostSection({ budgetPlan, total }) {
  if (!budgetPlan?.estimates) return null;
  const labels = { hotel: "Stay", flights: "Flights", food: "Dining", activities: "Experiences", transportation: "Transportation", miscBuffer: "Buffer" };
  return <section id="cost" className="scroll-mt-24 px-6 py-24 sm:px-12 sm:py-32" aria-labelledby="cost-heading"><div className="mx-auto max-w-[1240px]"><div className="grid gap-16 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-[10px] uppercase tracking-[.2em] text-black/40">Your estimated trip</p><h2 id="cost-heading" className="mt-5 font-serif text-[clamp(3.7rem,7vw,7rem)] leading-[.84] tracking-[-.055em]">{total}</h2><p className="mt-7 max-w-sm text-sm leading-7 text-black/52">A planning estimate, not a live quote. Final prices and availability are confirmed with each provider.</p>{budgetPlan.targetBudget && !budgetPlan.withinHardBudget ? <p className="mt-7 max-w-sm text-sm leading-7"><strong>Closest available match.</strong> The high estimate is above the {money(budgetPlan.targetBudget)} target.</p> : null}</div><dl className="grid gap-px bg-black/12 sm:grid-cols-2">{Object.entries(budgetPlan.estimates).map(([key, item]) => { const included = key === "miscBuffer" || budgetPlan.includedBudgetCategories[key]; return <div key={key} className="bg-[#f4f1eb] p-7 sm:p-9"><dt className="text-[10px] uppercase tracking-[.17em] text-black/40">{labels[key] || key}</dt><dd className="mt-5 font-serif text-2xl">{included ? `${money(item.low)}–${money(item.high)}` : "Not included"}</dd>{included ? <p className="mt-2 text-xs text-black/42">Estimated</p> : null}</div>; })}</dl></div></div></section>;
}

export default function ResultsPage() {
  const [quiz, setQuiz] = useState(null);
  const [remoteMatches, setRemoteMatches] = useState(null);
  const [chosenDestination, setChosenDestination] = useState(null);
  const [ready, setReady] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [shareStatus, setShareStatus] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [finalActionsVisible, setFinalActionsVisible] = useState(false);
  const finalActionsRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("trip") ? decodeTrip(params.get("trip")) : null;
    const raw = window.localStorage.getItem("globtrekQuiz");
    let stored = shared?.quiz || { answers: {} };
    try { if (!shared?.quiz && raw) stored = JSON.parse(raw); } catch {}
    const initialize = window.setTimeout(() => { setChosenDestination(shared?.destination || params.get("destination")); setQuiz(stored); }, 0);
    fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...stored, destination: shared?.destination || params.get("destination") }) }).then((response) => response.json()).then((data) => { if (Array.isArray(data.matches) && data.matches.length) setRemoteMatches(data.matches); }).catch(() => {});
    const timer = window.setTimeout(() => setReady(true), 100);
    track("result_viewed", { shared: Boolean(shared) });
    return () => { window.clearTimeout(initialize); window.clearTimeout(timer); };
  }, []);
  const localMatches = useMemo(() => getMatches(quiz), [quiz]);
  const matches = remoteMatches || localMatches;
  const trip = (chosenDestination ? matches.find((destination) => (destination.id || destination.airport) === chosenDestination) || localMatches.find((destination) => (destination.id || destination.airport) === chosenDestination) : null) || matches[0];
  const destinationKey = trip?.id || trip?.airport;
  useEffect(() => { if (!destinationKey || !trip) return; const controller = new AbortController(); fetch("/api/recent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "destination", key: destinationKey, title: trip.city, subtitle: trip.country, imageUrl: trip.image, data: { id: destinationKey, airport: trip.airport } }), signal: controller.signal }).catch(() => {}); return () => controller.abort(); }, [destinationKey, trip]);
  useEffect(() => { if (!ready || !finalActionsRef.current) return; const observer = new IntersectionObserver(([entry]) => setFinalActionsVisible(entry.isIntersecting), { threshold: 0.15 }); observer.observe(finalActionsRef.current); return () => observer.disconnect(); }, [ready]);
  useEffect(() => {
    if (!trip?.plan || !quiz) return;
    const profile = normalizeTravelerProfile(quiz);
    const hotelUrl = bookingPropertyUrl(selectedHotel, quiz);
    const saved = { clientTripKey: `${destinationKey}:current`, sharePath: "/results", destination: { id: destinationKey, city: trip.city, country: trip.country, airport: trip.airport, image: trip.image }, trip: quiz, travelerProfile: profile, exactBudget: profile.exactBudget, includedBudgetCategories: profile.includedBudgetCategories, itinerary: trip.plan, estimatedCosts: trip.budgetPlan || null, bookingLinks: { hotel: hotelUrl, flight: bookingFlightUrl(trip, quiz), restaurants: selectedRestaurants.map((item) => ({ name: item.name, url: verifiedBookingUrl(item) })).filter((item) => item.url), activities: selectedActivities.map((item) => ({ name: item.name, url: verifiedBookingUrl(item) })).filter((item) => item.url) }, selections: { hotel: selectedHotel, flight: { origin: profile.origin, destination: trip.airport }, restaurants: selectedRestaurants, activities: selectedActivities } };
    window.sessionStorage.setItem("globtrekCurrentTrip", JSON.stringify({ trip, quiz, savedTrip: saved }));
  }, [destinationKey, quiz, selectedActivities, selectedHotel, selectedRestaurants, trip]);

  if (!ready || !quiz) return <main className="min-h-screen bg-[#f4f1eb]" />;
  if (!trip) return <main className="grid min-h-screen place-items-center bg-[#f4f1eb] px-6 text-center text-[#171714]"><div><p className="text-[10px] uppercase tracking-[.2em] text-black/40">No eligible destination</p><h1 className="mt-5 font-serif text-5xl tracking-[-.04em]">Try a wider travel area.</h1><Link href="/discover" className="mt-8 inline-flex min-h-12 items-center border-b border-black text-sm">Return to the quiz</Link></div></main>;

  const profile = normalizeTravelerProfile(quiz);
  const budgetPlan = trip.budgetPlan;
  const dates = quiz.isFlexible ? (quiz.answers?.season || "Flexible dates") : [formatDate(quiz.tripStart), formatDate(quiz.tripEnd)].filter(Boolean).join(" — ") || "Flexible dates";
  const heroDates = quiz.isFlexible ? "Flexible dates" : [formatDate(quiz.tripStart, false), formatDate(quiz.tripEnd, false)].filter(Boolean).join(" — ");
  const midpoint = budgetPlan ? Math.round(((budgetPlan.estimatedTripLow || 0) + (budgetPlan.estimatedTripHigh || 0)) / 2 / 50) * 50 : null;
  const total = midpoint ? `${money(midpoint)} estimated` : "Estimate pending";
  const sharedPayload = encodeTrip({ quiz, destination: destinationKey });
  const selectedHotelUrl = bookingPropertyUrl(selectedHotel, quiz);
  const flightUrl = bookingFlightUrl(trip, quiz);
  const providerLinks = { hotel: selectedHotelUrl, flight: flightUrl, restaurants: selectedRestaurants.map((item) => ({ name: item.name, url: verifiedBookingUrl(item) })).filter((item) => item.url), activities: selectedActivities.map((item) => ({ name: item.name, url: verifiedBookingUrl(item) })).filter((item) => item.url) };
  const savedTrip = { clientTripKey: `${destinationKey}:${sharedPayload.slice(0, 120)}`, sharePath: `/results?trip=${sharedPayload}`, destination: { id: destinationKey, city: trip.city, country: trip.country, airport: trip.airport, image: trip.image }, trip: quiz, travelerProfile: profile, preferences: { pace: profile.pace, budget: profile.exactBudget, travelAreaPreference: profile.travelAreaPreference, originCountryCode: profile.originCountryCode, quizAnswers: profile.otherExistingQuizPreferences }, exactBudget: profile.exactBudget, includedBudgetCategories: profile.includedBudgetCategories, itinerary: trip.plan || null, estimatedCosts: budgetPlan || null, costConfidence: budgetPlan?.confidence ?? null, bookingLinks: providerLinks, selections: { hotel: selectedHotel, flight: { origin: profile.origin, destination: trip.airport }, restaurants: selectedRestaurants, activities: selectedActivities } };
  function tripLink() { return `${window.location.origin}/results?trip=${sharedPayload}`; }
  async function shareTrip() { const url = tripLink(); track("trip_shared", { destination: trip.city }); if (navigator.share) { try { await navigator.share({ title: `${profile.tripLength} days in ${trip.city}`, url }); setShareStatus("Shared"); return; } catch {} } try { await navigator.clipboard.writeText(url); setShareStatus("Link copied"); } catch { window.prompt("Copy your trip link", url); } }
  function bookNow() { const urls = [selectedHotelUrl, flightUrl, ...providerLinks.restaurants.map((item) => item.url), ...providerLinks.activities.map((item) => item.url)].filter(Boolean).filter((url, index, all) => all.indexOf(url) === index); if (!urls.length) { setBookingStatus("Select an item with a verified booking link first."); return; } urls.forEach((url) => { const opened = window.open(url, "_blank", "noopener,noreferrer"); if (opened) opened.opener = null; }); setBookingStatus(`${urls.length} selected ${urls.length === 1 ? "booking" : "bookings"} opened.`); track("trip_booking_started", { destination: trip.city, providers: urls.length }); }

  return <main className="results-editorial min-h-screen bg-[#f4f1eb] pb-24 text-[#171714]">
    <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-7 text-white sm:px-12 sm:py-10"><Link href="/" className="text-[13px] font-semibold uppercase tracking-[.28em]">Globtrēk</Link><div className="flex items-center gap-5"><AccountEntry compact light /><Link href="/discover" className="text-xs text-white/80 hover:text-white">Start over</Link></div></header>
    <section className="relative min-h-svh overflow-hidden"><Image src={trip.image} alt={`${trip.city}, ${trip.country}`} fill priority className="object-cover" sizes="100vw" quality={88} /><div className="absolute inset-0 bg-gradient-to-b from-black/36 via-black/8 to-black/68" /><div className="absolute inset-x-0 bottom-[12vh] px-6 text-center text-white sm:px-12"><p className="text-[10px] uppercase tracking-[.2em] text-white/72">Your GlobTrek trip</p><h1 className="mx-auto mt-5 max-w-[96vw] font-serif text-[clamp(4rem,10vw,10rem)] font-normal leading-[.8] tracking-[-.065em] [text-shadow:0_2px_30px_rgba(0,0,0,.22)]">{profile.tripLength} days in {trip.city}</h1><p className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-white/82">{[profile.pace, trip.style].filter(Boolean).join(" · ")}</p><p className="mt-3 text-xs text-white/70">{profile.travelers} {profile.travelers === 1 ? "traveler" : "travelers"} · {total}</p></div><a href="#overview" aria-label="View trip overview" className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[10px] tracking-[.16em] text-white/75">VIEW TRIP ↓</a></section>
    <section id="overview" className="scroll-mt-20 px-6 py-16 sm:px-12 sm:py-20"><div className="mx-auto max-w-[1240px]"><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:items-end"><div><p className="text-[10px] uppercase tracking-[.2em] text-black/40">Trip overview</p><h2 className="mt-4 font-serif text-[clamp(3rem,6vw,6rem)] leading-[.88] tracking-[-.05em]">{trip.city},<br />{trip.country}.</h2></div><dl className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4"><div><dt className="text-xs text-black/42">Dates</dt><dd className="mt-2 text-sm">{dates}</dd></div><div><dt className="text-xs text-black/42">Duration</dt><dd className="mt-2 text-sm">{profile.tripLength} days</dd></div><div><dt className="text-xs text-black/42">Travelers</dt><dd className="mt-2 text-sm">{profile.travelers}</dd></div><div><dt className="text-xs text-black/42">Travel style</dt><dd className="mt-2 text-sm">{profile.pace || "Balanced days"}</dd></div><div className="col-span-2 sm:col-span-4"><dt className="text-xs text-black/42">Estimated total</dt><dd className="mt-2 font-serif text-3xl">{total}</dd></div></dl></div><div className="mt-12 flex flex-wrap gap-6 border-t border-black/12 pt-6 text-xs text-black/48"><button type="button" onClick={shareTrip}>{shareStatus || "Share trip"}</button><SaveTripButton trip={savedTrip} className="text-xs" /></div></div></section>
    <FlightPlan trip={trip} profile={profile} dates={dates} estimate={budgetPlan?.estimates?.flights} />
    <ProposalItinerary trip={trip} />
    <HotelExperience key={destinationKey} destination={trip} quiz={quiz} budgetPlan={budgetPlan} onSelected={setSelectedHotel} proposalMode selectedHotelId={selectedKey(selectedHotel)} />
    <CuratedTripChoices destination={trip} quiz={quiz} restaurants={selectedRestaurants} activities={selectedActivities} onRestaurantsChange={setSelectedRestaurants} onActivitiesChange={setSelectedActivities} />
    <CostSection budgetPlan={budgetPlan} total={total} />
    <section ref={finalActionsRef} className="bg-[#171714] px-6 py-24 text-white sm:px-12"><div className="mx-auto grid max-w-[1240px] gap-10 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-[10px] uppercase tracking-[.2em] text-white/40">Your trip</p><h2 className="mt-4 font-serif text-[clamp(3rem,6vw,6rem)] leading-[.88] tracking-[-.05em]">Ready when you are.</h2><p className="mt-6 text-sm text-white/50">Only your selected items with verified provider links are opened.</p></div><div className="flex flex-col gap-4 sm:items-end"><EmailTripButton trip={savedTrip} viewUrl={tripLink()} className="min-h-12 border-b border-white/35 text-sm" /><button type="button" onClick={bookNow} className="min-h-14 min-w-56 border border-black bg-white px-7 text-xs font-medium tracking-[.12em] text-black">BOOK NOW →</button><p role="status" className="min-h-5 text-xs text-white/45">{bookingStatus}</p></div></div></section>
    <aside inert={finalActionsVisible ? true : undefined} className={`fixed inset-x-2 bottom-2 z-40 border border-white/10 bg-[#151513]/96 text-white shadow-[0_24px_80px_rgba(0,0,0,.28)] backdrop-blur-xl transition duration-300 sm:inset-x-6 sm:bottom-5 ${finalActionsVisible ? "pointer-events-none translate-y-4 opacity-0" : "translate-y-0 opacity-100"}`} aria-hidden={finalActionsVisible} aria-label="Trip action"><div className="h-px bg-[#b99a5f]" /><div className="flex items-center gap-4 px-4 py-3 sm:px-6"><div className="min-w-0 flex-1 sm:grid sm:grid-cols-4 sm:items-center sm:gap-8"><div><p className="truncate font-serif text-lg">{trip.city}</p><p className="mt-1 truncate text-[9px] text-white/42">{heroDates || "Flexible dates"} · {profile.travelers} travelers</p></div><p className="hidden truncate text-[10px] text-white/52 sm:block">{selectedHotel?.name || "Stay not selected"}</p><p className="hidden text-[10px] text-white/52 sm:block">{selectedRestaurants.length} dining · {selectedActivities.length} experiences</p><p className="hidden text-right font-serif text-lg sm:block">{total}</p></div><EmailTripButton trip={savedTrip} viewUrl={tripLink()} className="hidden text-[10px] text-white/70 md:block" /><button type="button" onClick={bookNow} className="h-12 shrink-0 border border-black bg-white px-5 text-[10px] font-medium tracking-[.12em] text-black sm:px-7">BOOK NOW →</button></div></aside>
  </main>;
}

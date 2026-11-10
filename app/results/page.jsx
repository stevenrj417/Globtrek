"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "../lib/analytics";
import { bookingFlightUrl, bookingPropertyUrl, destinations } from "../data/destinations";
import { normalizeTravelerProfile } from "../lib/recommendation/travelerProfile";
import { planDestination, rankDestinations } from "../lib/recommendation/destinationEngine";
import { buildBudgetPlan } from "../lib/recommendation/budgetEngine";
import { AccountEntry } from "../components/AccountEntry";
import { SaveTripButton } from "../components/SaveTripButton";
import { StayChoices, stayLinkContext } from "../components/StayChoices";
import { BookingChecklist } from "../components/BookingChecklist";
import { TripDock } from "../components/TripDock";
import { EmailTripButton } from "../components/EmailTripButton";
import { ProposalItinerary, CuratedTripChoices } from "../components/TripProposalSections";
import { bookingManifestEntries, buildBookingManifest } from "../lib/booking/manifest";
import { takePrefetchedMatches } from "../lib/matchPrefetch";
import { whyThisFits } from "../lib/recommendation/whyThisFits";
import { BookingLogo } from "../components/PartnerLogo";
import { NoMatchPanel } from "../components/NoMatchPanel";
import { pickTrip, resolveResultsState, encodeSharedTrip } from "../lib/results/resolveResults";
import { nightsBetween, nightsLabel, nightsRange, tripSchedule } from "../lib/trip/schedule";
import { TripDatePicker } from "../components/TripDatePicker";
import { stayBudgetOption, PRICE_KIND_LABEL } from "../lib/pricing/stayPrice";

function getMatches(quiz) { return rankDestinations(destinations, normalizeTravelerProfile(quiz || {})); }
function formatDate(value, year = true) { if (!value) return null; return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function money(value) { return `$${Math.round(value || 0).toLocaleString("en-US")}`; }
function airportCode(value) { return String(value || "").replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase(); }

function FlightPlan({ trip, profile, estimate, preferences, range, onUpdate }) {
  const origin = profile.originDetails?.displayName || profile.originDetails?.airportName || profile.origin || "Departure origin";
  const [draft, setDraft] = useState(preferences);
  const [picking, setPicking] = useState(false);
  const draftNights = nightsBetween(draft.departureDate, draft.returnDate);
  const datesValid = (!draft.departureDate && !draft.returnDate) || Boolean(draftNights && draftNights >= range.min && draftNights <= range.max);
  const valid = draft.departureAirport.length === 3 && draft.arrivalAirport.length === 3 && datesValid && draft.adults > 0;
  function change(key, value) { setDraft((current) => ({ ...current, [key]: value })); }
  function adjust(key, amount) { setDraft((current) => ({ ...current, [key]: Math.max(key === "adults" ? 1 : 0, Math.min(20, current[key] + amount)) })); }
  function submit(event) { event.preventDefault(); if (valid) { onUpdate(draft); setPicking(false); } }
  return <section className="border-t border-black/15 px-6 py-8 sm:px-12 sm:py-10" aria-labelledby="flight-plan-heading"><div className="mx-auto max-w-[1180px]"><div className="grid gap-7 lg:grid-cols-[.62fr_1.38fr] lg:gap-10"><div><p className="text-micro uppercase tracking-editorial">02 &nbsp;&nbsp; Your flight</p><h2 id="flight-plan-heading" className="mt-4 font-serif text-[clamp(2rem,3vw,2.75rem)] leading-[.94] tracking-tight-2">{preferences.departureAirport || profile.origin || origin} <span>→</span> {preferences.arrivalAirport}</h2>{estimate ? <p className="mt-4 text-xs leading-5">{money(estimate.average)} round trip per person · {estimate.basis || "monthly economy average"}</p> : null}</div><form onSubmit={submit} className="grid gap-x-5 gap-y-4 rounded-sm border border-black/15 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"><label className="text-micro uppercase tracking-label">Departure<input aria-label="Departure airport" value={draft.departureAirport} onChange={(event) => change("departureAirport", airportCode(event.target.value))} placeholder="PDX" maxLength={3} required className="mt-1 min-h-9 w-full border-b border-black/20 bg-transparent text-sm uppercase outline-none focus:border-black" /></label><label className="text-micro uppercase tracking-label">Arrival<input aria-label="Arrival airport" value={draft.arrivalAirport} onChange={(event) => change("arrivalAirport", airportCode(event.target.value))} placeholder={trip.airport} maxLength={3} required className="mt-1 min-h-9 w-full border-b border-black/20 bg-transparent text-sm uppercase outline-none focus:border-black" /></label><div className="sm:col-span-2 lg:col-span-4"><button type="button" aria-expanded={picking} aria-controls="flight-dates" onClick={() => setPicking((open) => !open)} className="flex min-h-12 w-full items-center justify-between gap-4 border-b border-black/20 text-left"><span><span className="block text-micro uppercase tracking-label">Dates</span><span className="tabular mt-1 block text-sm">{draft.departureDate && draft.returnDate ? `${formatDate(draft.departureDate, false)} → ${formatDate(draft.returnDate)} · ${nightsLabel(nightsBetween(draft.departureDate, draft.returnDate) || range.min)}` : `Flexible · pick ${range.min === range.max ? nightsLabel(range.min) : `${range.min}–${range.max} nights`}`}</span></span><span className="text-micro uppercase tracking-label text-black/55">{picking ? "Done" : "Change"} <span aria-hidden="true">{picking ? "↑" : "↓"}</span></span></button>{picking ? <div id="flight-dates" className="pt-5"><TripDatePicker start={draft.departureDate} end={draft.returnDate} minNights={range.min} maxNights={range.max} label="Flight dates" onChange={(start, end) => setDraft((current) => ({ ...current, departureDate: start, returnDate: end }))} /></div> : null}</div><fieldset className="sm:col-span-2"><legend className="text-micro uppercase tracking-label">Preferred departure</legend><div className="mt-2 grid grid-cols-3 gap-1">{["Morning", "Afternoon", "Night"].map((timing) => { const value = timing === "Night" ? "evening" : timing.toLowerCase(); return <button key={timing} type="button" aria-pressed={draft.timing === value} onClick={() => change("timing", value)} className={`min-h-9 border px-2 text-micro ${draft.timing === value ? "border-black bg-black text-white" : "border-black/15"}`}>{timing}</button>; })}</div></fieldset><div className="grid grid-cols-2 gap-3 sm:col-span-2">{[["Adults", "adults"], ["Children", "children"]].map(([label, key]) => <div key={key} className="flex min-h-10 items-center justify-between border-y border-black/15"><span className="text-micro">{label}</span><span className="flex items-center gap-2"><button type="button" onClick={() => adjust(key, -1)} aria-label={`Remove ${label.toLowerCase()}`} className="h-8 w-8 text-base">−</button><strong className="min-w-4 text-center text-xs font-medium">{draft[key]}</strong><button type="button" onClick={() => adjust(key, 1)} aria-label={`Add ${label.toLowerCase()}`} className="h-8 w-8 text-base">+</button></span></div>)}</div><div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-4"><button disabled={!valid} className="min-h-10 bg-black px-5 text-micro uppercase tracking-label text-white disabled:cursor-not-allowed disabled:opacity-35">Update flight options</button><p role="status" className="text-micro">{preferences.updated ? "Flight preferences updated." : "Planning preferences, not a live search."}</p></div></form></div></div></section>;
}

const SPEND_LABELS = { cheapest: "Rock bottom", value: "Cheap but sane", comfortable: "A little comfort" };
const LABELS = { hotel: "Stay", flights: "Flights", food: "Dining", activities: "Experiences", transportation: "Transportation", miscBuffer: "Buffer" };

// Where the lodging line's price comes from, in the same words everywhere.
function lodgingSource(lodging) {
  if (!lodging) return null;
  if (lodging.priceKind === "city_estimate") return "GlobTrek's city estimate for a simple room, taxes included";
  if (lodging.priceKind === "live") return "live price";
  if (lodging.priceKind === "observed") return `price seen on Booking.com, checked ${formatDate(lodging.observedAt)}`;
  return lodging.observedAt ? `GlobTrek estimate from the Booking.com price checked ${formatDate(lodging.observedAt)}, adjusted for your travel month` : "GlobTrek estimate";
}

function lodgingLine(lodging) {
  if (!lodging?.total) return null;
  const what = `${lodging.unit === "bed" ? "dorm bed" : "room"}${lodging.units === 1 ? "" : "s"}`;
  return `${lodging.name ? `${lodging.name}: ` : ""}${money(lodging.perUnit)} × ${lodging.units} ${what} × ${lodging.nights} night${lodging.nights === 1 ? "" : "s"} · ${lodgingSource(lodging)}`;
}

function CostSection({ budgetPlan, trip, nights, travelers, missingPriceStay }) {
  if (!budgetPlan?.estimates) return null;
  const grand = budgetPlan.budgetCheckTotal;
  const cheapest = budgetPlan.spendStyle === "cheapest";
  const notes = {
    hotel: missingPriceStay ? `${missingPriceStay} has no price GlobTrek can trust yet, so this line uses ${lodgingLine(budgetPlan.lodging)}. Check the current price on Booking.com.` : lodgingLine(budgetPlan.lodging),
    food: cheapest ? "Fast food, street food and groceries" : null,
    activities: cheapest ? "Free things only (see the list below)" : null,
    transportation: budgetPlan.airportTransfers > 0 ? `Includes ${money(budgetPlan.airportTransfers)} in round-trip airport transfers` : null,
    miscBuffer: "Small reserve for things that cost more than planned",
  };
  const farAirport = Number(trip?.airportToCenterMiles) >= 15 ? trip.airportToCenterMiles : null;
  return <section id="cost" className="scroll-mt-24 border-t border-black/15 px-6 py-10 sm:px-12 sm:py-12" aria-labelledby="cost-heading"><div className="mx-auto max-w-[1180px]"><div className="overflow-hidden border border-black/15 bg-white lg:grid lg:grid-cols-[.72fr_1.28fr]"><div className="flex flex-col justify-between border-b border-black/15 p-6 sm:p-8 lg:border-b-0 lg:border-r"><div><p className="text-micro uppercase tracking-editorial">Your estimated trip</p><h2 id="cost-heading" className="mt-4 font-serif text-[clamp(2.35rem,4vw,3.85rem)] leading-[.92] tracking-tight-3">{money(grand)} <span className="font-sans text-base">estimated</span></h2><p className="tabular mt-4 text-sm font-medium">{money(grand / nights)} per night of the trip{travelers > 1 ? ` · ${money(grand / travelers)} per person` : ""} · {nights} night{nights === 1 ? "" : "s"} · {travelers} traveler{travelers === 1 ? "" : "s"}{budgetPlan.spendStyle ? ` · ${SPEND_LABELS[budgetPlan.spendStyle] || "Best value"}` : ""}</p>{farAirport ? <p className="mt-3 max-w-sm border-l-2 border-warning pl-3 text-xs leading-5"><strong>Heads up:</strong> the airport is about {farAirport} miles from the city center. Allow time and the transfer cost.</p> : null}<p className="mt-4 max-w-sm text-xs leading-5">{cheapest ? "Rock-bottom plan: the cheapest round-trip fare we found for your month, a well-reviewed hostel bed, fast food and street food, transit, and free things to do." : "Good-value planning estimate for your travel month: economy flights, a simple room, normal meals, local transport and everyday activities."} These are GlobTrek estimates, not live prices; each partner shows the current price before you book.</p>{budgetPlan.targetBudget && !budgetPlan.withinHardBudget ? <p className="mt-4 max-w-sm text-xs leading-5"><strong>No honest fit at this budget.</strong> The estimate is above the {money(budgetPlan.targetBudget)} target.</p> : null}</div><a href="#booking-center" className="mt-8 flex min-h-12 w-full items-center justify-between bg-black px-6 text-micro font-medium uppercase tracking-label text-white">Go to booking checklist <span aria-hidden="true">↓</span></a></div><dl className="divide-y divide-black/12">{Object.entries(budgetPlan.estimates).map(([key, item]) => { const included = key === "miscBuffer" || budgetPlan.includedBudgetCategories[key]; return <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-6 px-6 py-4 sm:px-8"><dt className="text-micro font-medium">{LABELS[key] || key}<span className="mt-1 block font-normal">{included ? key === "flights" ? (["us_dot_average_fare_paid", "google_flights_snapshot"].includes(item.source) ? `${item.basis} · ${money(item.perTraveler)} × ${travelers} traveler${travelers === 1 ? "" : "s"}` : `${cheapest ? "Cheapest" : "Typical"} round-trip fare estimate · ${money(item.perTraveler)} × ${travelers} traveler${travelers === 1 ? "" : "s"}`) : notes[key] || "GlobTrek planning estimate" : "Not in your budget"}</span></dt><dd className="tabular font-serif text-lg">{included ? money(item.average) : "—"}</dd></div>; })}<div className="grid grid-cols-[1fr_auto] items-center gap-6 bg-surface px-6 py-4 sm:px-8"><dt className="text-micro font-medium uppercase tracking-label">Estimated total</dt><dd className="tabular font-serif text-lg">{money(grand)}</dd></div></dl></div>{trip?.freeHighlights?.length ? <div className="mt-6 border border-black/15 bg-surface p-5 sm:p-6"><p className="text-micro uppercase tracking-editorial">Free things to do in {trip.city ? trip.city.toLowerCase().replace(/(^|[\s&-])\S/g, (letter) => letter.toUpperCase()) : "town"}</p><ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">{trip.freeHighlights.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}</div></section>;
}

// Everything the page shows, derived once from the quiz, the trip on screen and
// the traveler's choices, so dates, nights, prices and links agree everywhere.
function buildView({ quiz, trip, flightPreferences, selectedHotel, selectedRestaurants, selectedActivities }) {
  const profile = normalizeTravelerProfile(quiz);
  const quizSchedule = tripSchedule(quiz);
  const nightsAllowed = nightsRange(quiz.answers?.duration, quizSchedule.flexible ? null : quizSchedule.nights);
  const destinationKey = trip.id || trip.airport;
  const defaults = { departureAirport: airportCode(profile.originDetails?.airportCode || quiz.originAirport || profile.origin), arrivalAirport: airportCode(trip.airport), departureDate: quizSchedule.start || "", returnDate: quizSchedule.end || "", adults: Math.max(1, Number(profile.travelers) || 1), children: 0, cabin: "ECONOMY", timing: "morning", updated: false };
  const prefs = flightPreferences || defaults;
  const travelers = prefs.adults + prefs.children;
  const noStay = selectedHotel?.type === "none";
  const context = { ...quiz, originAirport: prefs.departureAirport, originDetails: prefs.departureAirport === quiz?.originDetails?.airportCode ? quiz.originDetails : null, tripStart: prefs.departureDate, tripEnd: prefs.returnDate, isFlexible: !(prefs.departureDate && prefs.returnDate), guestCount: String(travelers), adults: prefs.adults, children: prefs.children, cabinClass: prefs.cabin || "ECONOMY", flightTimingPreference: prefs.timing, ...(noStay ? { includedBudgetCategories: { ...profile.includedBudgetCategories, hotel: false } } : {}) };
  const schedule = tripSchedule(context);
  const activeProfile = normalizeTravelerProfile(context);
  const flightDestination = { ...trip, airport: prefs.arrivalAirport || trip.airport };
  const stay = selectedHotel && !noStay ? selectedHotel : null;
  // A stay's price only counts when it was priced for these same nights.
  const stayOption = stay?.price?.nights === schedule.nights ? stayBudgetOption(stay, stay.price) : null;
  const budgetPlan = buildBudgetPlan(activeProfile, flightDestination, { stay: stayOption });
  const flightUrl = bookingFlightUrl(flightDestination, context);
  const flightSelection = { selected: Boolean(prefs.departureAirport && prefs.arrivalAirport), origin: prefs.departureAirport, destination: prefs.arrivalAirport, departureDate: schedule.start, returnDate: schedule.end, adults: prefs.adults, children: prefs.children, cabin: prefs.cabin || "ECONOMY", timing: prefs.timing, preferredDeparture: prefs.timing, selectedItinerary: prefs.selectedItinerary || null };
  const stayForManifest = stay ? { ...stay, photoUrl: stay.image || stay.photos?.[0] || null, priceEstimate: stayOption ? `${money(budgetPlan.lodging.total)} ${PRICE_KIND_LABEL[stay.price.kind].toLowerCase()} for ${schedule.nights} nights` : "Price not available; check Booking.com" } : null;
  const sharedPayload = encodeSharedTrip({ quiz: context, destination: destinationKey, stay: stay?.id || null });
  const bookingManifest = buildBookingManifest({ tripId: `${destinationKey}:${sharedPayload.slice(0, 120)}`, destination: { id: destinationKey, city: trip.city, country: trip.country, airport: trip.airport, image: trip.image }, dates: { start: schedule.start, end: schedule.end }, travelers: { adults: prefs.adults, children: prefs.children, total: travelers }, hotels: stayForManifest ? [stayForManifest] : [], hotelExactUrls: [stay ? bookingPropertyUrl(stay, stayLinkContext(context, stay)) : null], restaurants: selectedRestaurants, experiences: selectedActivities, flight: flightSelection, flightDeepLink: flightUrl });
  const providerLinks = { hotel: bookingManifest.hotelBookings[0]?.exactUrl || null, flight: bookingManifest.flightBooking?.deepLink || null, restaurants: bookingManifest.restaurantBookings.map((item) => ({ name: item.name, url: item.exactUrl })), activities: bookingManifest.experienceBookings.map((item) => ({ name: item.name, url: item.exactUrl })) };
  const savedTrip = { clientTripKey: bookingManifest.tripId, sharePath: `/results?trip=${sharedPayload}`, destination: bookingManifest.destination, trip: context, schedule, travelerProfile: activeProfile, preferences: { pace: activeProfile.pace, budget: activeProfile.exactBudget, travelAreaPreference: activeProfile.travelAreaPreference, originCountryCode: activeProfile.originCountryCode, flightTimingPreference: prefs.timing, quizAnswers: activeProfile.otherExistingQuizPreferences }, exactBudget: activeProfile.exactBudget, includedBudgetCategories: activeProfile.includedBudgetCategories, itinerary: trip.plan || null, estimatedCosts: budgetPlan, costConfidence: budgetPlan.confidence ?? null, bookingManifest, bookingLinks: providerLinks, selections: { hotel: stayForManifest, flight: flightSelection, restaurants: selectedRestaurants, activities: selectedActivities } };
  return { profile, prefs, nightsAllowed, travelers, context, schedule, activeProfile, budgetPlan, stay, stayMissingPrice: stay?.price?.kind === "unavailable", sharedPayload, bookingManifest, savedTrip, destinationKey };
}

export default function ResultsPage() {
  const [resolved, setResolved] = useState(null);
  const [remoteMatches, setRemoteMatches] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [shareStatus, setShareStatus] = useState("");
  const [flightPreferences, setFlightPreferences] = useState(null);
  const [proposalCatalog, setProposalCatalog] = useState({ restaurants: [], activities: [] });

  useEffect(() => {
    let savedQuiz = null;
    let savedStay = null;
    try { savedQuiz = window.localStorage.getItem("globtrekQuiz"); savedStay = window.localStorage.getItem("globtrekStay"); } catch {}
    const state = resolveResultsState({ search: window.location.search, savedQuiz, savedStay });
    const initialize = window.setTimeout(() => setResolved(state), 0);
    const prefetched = state.source === "shared" ? null : takePrefetchedMatches(state.quiz, state.destinationId);
    if (prefetched) window.setTimeout(() => setRemoteMatches(prefetched), 0);
    else fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...state.quiz, destination: state.destinationId }) }).then((response) => response.json()).then((data) => { if (Array.isArray(data.matches) && data.matches.length) setRemoteMatches(data.matches); }).catch(() => {});
    track("result_viewed", { source: state.source });
    return () => window.clearTimeout(initialize);
  }, []);

  const quiz = resolved?.quiz || null;
  const localMatches = useMemo(() => (quiz ? getMatches(quiz) : []), [quiz]);
  const trip = useMemo(() => {
    if (!quiz) return null;
    const profile = normalizeTravelerProfile(quiz);
    const fromRemote = pickTrip({ destinationId: resolved.destinationId, matches: remoteMatches || [], catalog: [], plan: () => null });
    return fromRemote || pickTrip({ destinationId: resolved.destinationId, matches: localMatches, catalog: destinations, plan: (destination) => planDestination(destination, profile) });
  }, [quiz, resolved, remoteMatches, localMatches]);
  const destinationKey = trip?.id || trip?.airport;
  const view = useMemo(() => (quiz && trip ? buildView({ quiz, trip, flightPreferences, selectedHotel, selectedRestaurants, selectedActivities }) : null), [quiz, trip, flightPreferences, selectedHotel, selectedRestaurants, selectedActivities]);

  useEffect(() => { if (!destinationKey || !trip) return; const controller = new AbortController(); fetch("/api/recent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "destination", key: destinationKey, title: trip.city, subtitle: trip.country, imageUrl: trip.image, data: { id: destinationKey, airport: trip.airport } }), signal: controller.signal }).catch(() => {}); return () => controller.abort(); }, [destinationKey, trip]);
  useEffect(() => { if (view) { try { window.sessionStorage.setItem("globtrekCurrentTrip", JSON.stringify({ trip, quiz, savedTrip: view.savedTrip })); } catch {} } }, [view, trip, quiz]);

  const chooseStay = useCallback((stay, { automatic } = {}) => {
    setSelectedHotel((current) => (current?.id === stay?.id && current?.price?.total === stay?.price?.total && current?.price?.nights === stay?.price?.nights ? current : stay));
    if (!automatic && stay) { try { window.localStorage.setItem("globtrekStay", JSON.stringify({ destinationId: destinationKey, id: stay.id })); } catch {} }
  }, [destinationKey]);

  if (!resolved) return <main className="min-h-screen bg-canvas" />;
  if (!trip || !view) return <NoMatchPanel quiz={quiz} />;

  const { profile, prefs, travelers, context, schedule, budgetPlan, savedTrip, bookingManifest, sharedPayload } = view;
  const grand = budgetPlan.budgetCheckTotal;
  const why = whyThisFits({ answers: quiz.answers || {}, exactBudget: profile.exactBudget, budgetPlan, trip });
  const includedSummary = budgetPlan.includedBudgetCategories.flights === false ? "before flights" : "flights included";
  const preferredStayId = selectedHotel?.id || resolved.stayId;
  function tripLink() { return `${window.location.origin}/results?trip=${sharedPayload}`; }
  async function shareTrip() { const url = tripLink(); track("trip_shared", { destination: trip.city }); if (navigator.share) { try { await navigator.share({ title: `${schedule.nights} nights in ${trip.city}`, url }); setShareStatus("Shared"); return; } catch {} } try { await navigator.clipboard.writeText(url); setShareStatus("Link copied"); } catch { window.prompt("Copy your trip link", url); } }
  function updateFlightPreferences(next) { setFlightPreferences({ ...next, updated: true }); track("flight_preferences_updated", { destination: trip.city, timing: next.timing, travelers: next.adults + next.children }); }
  function goToBooking() { document.querySelector("#booking-center")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); track("booking_center_viewed", { destination: trip.city }); }

  return <main className="results-editorial min-h-screen bg-canvas pb-28 text-ink">
    <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-7 text-white sm:px-12 sm:py-10"><Link href="/" className="text-sm font-semibold uppercase tracking-editorial">GlobTrek</Link><div className="flex items-center gap-5"><AccountEntry compact light /><Link href="/discover" className="text-xs text-white/80 hover:text-white">Start over</Link></div></header>
    <section data-trip-hero className="relative min-h-[92svh] overflow-hidden"><Image src={trip.image} alt={`${trip.city}, ${trip.country}`} fill priority className="object-cover" sizes="100vw" quality={88} /><div className="absolute inset-0 bg-gradient-to-b from-black/48 via-black/22 to-black/66" /><div className="absolute inset-x-0 top-1/2 mx-auto w-full max-w-[1240px] -translate-y-1/2 px-6 text-center text-white sm:px-12"><h1 className="mx-auto max-w-[92vw] font-serif text-[clamp(3rem,6.1vw,6rem)] font-normal uppercase leading-[.88] tracking-tight-3 [text-shadow:0_2px_28px_rgba(0,0,0,.25)]">{trip.city}</h1><p className="mt-5 text-micro uppercase tracking-editorial">{schedule.label} in {trip.country} &nbsp;·&nbsp; {schedule.datesLabel} &nbsp;·&nbsp; {travelers} {travelers === 1 ? "traveler" : "travelers"}</p>{why ? <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/92 sm:text-lg">{why}</p> : null}<p className="tabular mt-4 text-xs text-white/85">{money(grand)} estimated · range {money(budgetPlan.estimatedTripLow)}–{money(budgetPlan.estimatedTripHigh)} · {travelers} {travelers === 1 ? "traveler" : "travelers"} · {schedule.label} · {includedSummary} · <a href="#cost" className="underline decoration-white/40 underline-offset-4 hover:decoration-white">What&apos;s included</a></p></div><a href="#overview" aria-label="Scroll to trip planner" className="absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 items-center gap-3 text-micro uppercase tracking-label text-white"><span className="grid h-8 w-8 place-items-center rounded-full border border-white" aria-hidden="true">↓</span> Scroll</a></section>
    <section id="overview" className="scroll-mt-20 border-b border-black/10 bg-surface px-6 py-6 sm:px-12"><div className="mx-auto flex max-w-[1240px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><dl className="grid flex-1 grid-cols-3 divide-x divide-black/10"><div className="pr-5"><dd className="font-serif text-2xl">{schedule.nights}</dd><dt className="mt-1 text-micro uppercase tracking-label text-black/48">Nights</dt></div><div className="px-5"><dd className="font-serif text-2xl">{travelers}</dd><dt className="mt-1 text-micro uppercase tracking-label text-black/48">Travelers</dt></div><div className="pl-5"><dd className="font-serif text-2xl">{money(grand)}</dd><dt className="mt-1 text-micro uppercase tracking-label text-black/48">Estimated total</dt></div></dl><div className="flex flex-wrap items-center gap-5"><a href="#hotel-selection" className="inline-flex min-h-11 items-center bg-black px-6 text-micro uppercase tracking-label text-white">Continue planning &nbsp;<span aria-hidden="true">→</span></a><button type="button" onClick={shareTrip} className="min-h-11 text-micro text-black/60">{shareStatus || "Share"}</button><SaveTripButton trip={savedTrip} className="text-micro" /></div></div></section>
    <StayChoices key={`stay-${destinationKey}`} destination={trip} tripContext={context} selectedStayId={preferredStayId} onSelected={chooseStay} budgetLodging={budgetPlan.lodging?.total ? { ...budgetPlan.lodging, source: lodgingSource(budgetPlan.lodging) } : null} />
    <FlightPlan key={`flight-${destinationKey}`} trip={trip} profile={profile} estimate={budgetPlan.estimates?.flights} preferences={prefs} range={view.nightsAllowed} onUpdate={updateFlightPreferences} />
    <ProposalItinerary trip={trip} images={[...(proposalCatalog.activities || []), ...(proposalCatalog.restaurants || [])]} />
    <CuratedTripChoices destination={trip} quiz={quiz} restaurants={selectedRestaurants} activities={selectedActivities} onRestaurantsChange={setSelectedRestaurants} onActivitiesChange={setSelectedActivities} onCatalogChange={setProposalCatalog} />
    <CostSection budgetPlan={budgetPlan} trip={trip} nights={schedule.nights} travelers={travelers} missingPriceStay={view.stayMissingPrice ? view.stay.name : null} />
    <section className="border-t border-black/15 px-6 py-10 sm:px-12 sm:py-12"><div className="mx-auto max-w-[1180px]"><BookingChecklist entries={bookingManifestEntries(bookingManifest)} tripKey={bookingManifest.tripId} trip={{ city: trip.city, country: trip.country, start: schedule.start, end: schedule.end, adults: prefs.adults, children: prefs.children, flight: bookingManifest.flightBooking }} /></div></section>
    <section aria-labelledby="adjust-heading" className="border-t border-black/15 px-6 py-10 sm:px-12"><div className="mx-auto max-w-[1180px]"><h2 id="adjust-heading" className="text-xl font-medium tracking-tight-1">Not quite right?</h2><p className="mt-1 text-sm text-muted">Try a different setting. Everything else starts from scratch in the quiz.</p><div className="mt-5 flex flex-wrap gap-2">{[["Coast", "Ocean"], ["Mountains", "Mountains"], ["City", "Cities"], ["History & culture", "Culture"], ["Surprise me", "Surprise Me"]].filter(([, setting]) => setting !== quiz.answers?.alive).map(([label, setting]) => <Link key={setting} href={`/discover?setting=${encodeURIComponent(setting)}`} className="inline-flex min-h-11 items-center border border-black/20 px-4 text-sm transition-colors duration-150 hover:border-ink">{label}</Link>)}<Link href="/discover" className="inline-flex min-h-11 items-center px-4 text-sm underline decoration-black/25 underline-offset-4 hover:decoration-ink">Retake quiz</Link></div></div></section>
    <TripDock city={trip.city} summary={`${schedule.datesLabel} · ${schedule.label} · ${travelers} ${travelers === 1 ? "traveler" : "travelers"}`} total={money(grand)} picks={[view.stay ? "stay chosen" : null, prefs.updated ? "flight set" : null, selectedRestaurants.length + selectedActivities.length ? `${selectedRestaurants.length + selectedActivities.length} plans` : null].filter(Boolean).join(" · ")} emailButton={<EmailTripButton trip={savedTrip} viewUrl={tripLink()} className="min-h-11 rounded-full border border-black/15 px-4 text-micro text-black" />} onBook={goToBooking} />
  </main>;
}

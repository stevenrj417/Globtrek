"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { BrandMark } from "../../components/BrandMark";
import { EmailTripButton } from "../../components/EmailTripButton";
import { ExactPlacePhoto } from "../../components/ExactPlacePhoto";
import { HotelExperience } from "../../components/HotelExperience";
import { SiteFooter } from "../../components/SiteChrome";
import { bookingFlightUrl, bookingPropertyUrl } from "../../data/destinations";
import { CruiseMap } from "./CruiseMap";
import { CruiseItinerary, CruiseMatches } from "./CruiseMatches";

function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0); }
function range(value) { return `${money(value.low)}–${money(value.high)}`; }
function verifiedLink(item) { if (!item?.bookingUrl) return null; try { const url = new URL(item.bookingUrl); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }
function isSafeImage(value) { return typeof value === "string" && (/^\//.test(value) || /^https:\/\/(images\.unsplash\.com|upload\.wikimedia\.org|[^/]+\.googleusercontent\.com)\//.test(value)); }

function SailingDivider() {
  return <div className="relative h-20 overflow-hidden border-y border-black/8 bg-[#f7f7f4]" aria-hidden="true"><div className="absolute inset-x-6 top-1/2 border-t border-black/12" /><svg viewBox="0 0 90 34" className="absolute top-[22px] h-8 w-[90px] text-[#596c70] motion-reduce:hidden"><g fill="currentColor"><path d="M12 21h62l-8 9H24z" /><path d="M30 12h30v9H30z" /><path d="M38 5h14v7H38z" /></g><animateTransform attributeName="transform" type="translate" values="-100 0;1500 0" dur="18s" repeatCount="indefinite" /></svg></div>;
}

function SelectableExperience({ item, selected, onSelect }) {
  const image = isSafeImage(item.imageUrl || item.image) ? item.imageUrl || item.image : null;
  return <button type="button" aria-pressed={selected} onClick={onSelect} className="group relative block w-full text-left"><div className="relative aspect-[5/4] overflow-hidden bg-[#d9d4cb]">{image ? <Image src={image} alt="" fill sizes="(min-width:1024px) 30vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.02]" /> : <div className="grid h-full place-items-center text-xs text-black/38">Image being verified</div>}{selected ? <span className="absolute right-4 top-4 grid h-12 w-[72px] place-items-center rounded-full bg-[#f4f0e8]/95 shadow-sm"><BrandMark className="!h-6 !w-11" /></span> : null}</div><p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-[#8a6b36]">{selected ? "Selected" : item.category || "Port experience"}</p><h3 className="mt-2 font-serif text-3xl leading-[.95] tracking-[-0.035em]">{item.name}</h3><p className="mt-3 text-sm text-black/50">{item.location || item.address || "Verified near the departure port"}</p></button>;
}

export function CruiseResults() {
  const [journeyRevealed, setJourneyRevealed] = useState(false);
  const [introMapMounted, setIntroMapMounted] = useState(true);
  const [recommendation, setRecommendation] = useState(undefined);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedCruiseId, setSelectedCruiseId] = useState(null);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [cabinClass, setCabinClass] = useState("ECONOMY");
  const [bookingStatus, setBookingStatus] = useState("");
  const stored = useSyncExternalStore(() => () => {}, () => window.localStorage.getItem("globtrekCruiseQuiz") || "", () => "");
  const answers = useMemo(() => { try { return JSON.parse(stored || "null"); } catch { return null; } }, [stored]);

  useEffect(() => { if (!stored) return undefined; const controller = new AbortController(); fetch("/api/cruises/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: stored, signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((payload) => setRecommendation(payload?.route ? payload : null)).catch((error) => { if (error.name !== "AbortError") setRecommendation(null); }); return () => controller.abort(); }, [stored]);
  const route = recommendation?.route;
  const quiz = recommendation?.quiz;
  const cruiseMatches = recommendation?.cruises || [];
  const selectedCruise = cruiseMatches.find((cruise) => cruise.id === selectedCruiseId) || cruiseMatches[0] || null;
  useEffect(() => {
    if (!route?.id) return undefined;
    const fallback = window.setTimeout(() => setJourneyRevealed(true), 6_500);
    return () => window.clearTimeout(fallback);
  }, [route?.id]);
  useEffect(() => {
    if (!journeyRevealed) return undefined;
    const handoff = window.setTimeout(() => setIntroMapMounted(false), 1_100);
    return () => window.clearTimeout(handoff);
  }, [journeyRevealed]);
  useEffect(() => {
    if (!route?.hotelDestination?.id || !quiz) return undefined;
    const controller = new AbortController();
    fetch("/api/activities/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: route.hotelDestination.id, quiz }), signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((payload) => setActivities((payload?.activities || []).filter((item) => item?.name).slice(0, 3))).catch((error) => { if (error.name !== "AbortError") setActivities([]); });
    return () => controller.abort();
  }, [route?.hotelDestination?.id, quiz]);

  if (answers === null || recommendation === null) return <section className="grid min-h-[70svh] place-items-center px-6 text-center"><div><p className="font-serif text-5xl tracking-[-0.05em]">The ocean is waiting.</p><p className="mt-4 text-sm text-black/50">Begin with the journey you want to feel.</p><Link href="/cruises/quiz" className="mt-8 inline-flex min-h-14 items-center bg-black px-7 text-xs uppercase tracking-[0.09em] text-white">Create my cruise</Link></div></section>;
  if (!route || !quiz) return <section className="grid min-h-[70svh] place-items-center"><p className="text-[10px] uppercase tracking-[0.2em] text-black/45">Drawing the ocean route…</p></section>;

  const logistics = route.logistics;
  const travelers = Number(quiz.guestCount) || 2;
  const tripContext = { ...quiz, guestCount: String(travelers), originAirport: answers.originDetails?.airportCode, tripStart: departureDate || null, tripEnd: returnDate || null, isFlexible: !(departureDate && returnDate), cabinClass, currency: "USD" };
  const flightLink = logistics.mode === "flight" && /^[A-Z]{3}$/.test(answers.originDetails?.airportCode || "") ? bookingFlightUrl(route.embarkation, tripContext) : null;
  const hotelLink = bookingPropertyUrl(selectedHotel, tripContext);
  const cruiseBookingPath = selectedCruise ? `${selectedCruise.affiliatePath}?placement=sticky_action` : null;
  const activityLinks = selectedActivities.map((item) => ({ name: item.name, url: verifiedLink(item) })).filter((item) => item.url);
  const bookingUrls = [...new Set([cruiseBookingPath, flightLink, hotelLink, ...activityLinks.map((item) => item.url)].filter(Boolean))];
  const selectedPorts = selectedCruise?.stops.filter((stop) => stop.stopType === "port") || route.ports;
  const itineraryDays = selectedCruise ? selectedCruise.stops.map((stop) => ({ location: stop.name, title: stop.stopType === "sea_day" ? "At sea" : `Port day in ${stop.name}`, morning: stop.description || (stop.stopType === "sea_day" ? "A full day aboard the ship." : `Arrive in ${stop.name}.`), afternoon: selectedActivities[(stop.day - 1) % Math.max(1, selectedActivities.length)]?.name || "Explore at your own pace.", evening: stop.stopType === "sea_day" ? "Continue the voyage." : "Return to the ship before departure." })) : route.ports.map((port, index) => ({ location: port.city, title: index ? `Port day in ${port.city}` : `Begin in ${port.city}`, morning: index ? `Arrive in ${port.city}.` : `Reach the departure port in ${port.city}.`, afternoon: selectedActivities[index % Math.max(1, selectedActivities.length)]?.name || "Explore the port at your own pace.", evening: index === 0 && selectedHotel ? `Settle in at ${selectedHotel.name}.` : "Return to the ship when the verified sailing schedule is available." }));
  const savedTrip = { clientTripKey: `cruise-${selectedCruise?.id || route.id}-${answers.createdAt || "current"}`, destination: { ...(selectedCruise?.departurePort || route.embarkation), city: selectedCruise?.name || route.title }, travelerProfile: { ...tripContext, dates: selectedCruise ? { start: selectedCruise.departureDate, end: selectedCruise.returnDate } : departureDate ? { start: departureDate, end: returnDate || null } : null, travelers, exactBudget: Number(answers.budget) }, exactBudget: Number(answers.budget), itinerary: { days: itineraryDays }, selections: { cruise: selectedCruise, hotel: selectedHotel, restaurants: [], activities: selectedActivities }, journey: { type: "cruise", title: selectedCruise?.name || route.title, duration: selectedCruise ? `${selectedCruise.durationNights} nights` : answers.duration, ports: selectedPorts.map((port) => ({ name: port.name || port.city, country: port.country })), ship: selectedCruise ? { name: selectedCruise.shipName, cruiseLine: selectedCruise.cruiseLine } : null, flight: { origin: answers.originDetails.city, destination: selectedCruise?.departurePort?.name || route.embarkation.city, departureDate: selectedCruise?.departureDate || departureDate || null, returnDate: selectedCruise?.returnDate || returnDate || null, cabinClass, providerStatus: flightLink ? "Search link available" : "Live itinerary not connected" }, cruiseProviderStatus: selectedCruise ? "Verified CruiseDirect/CJ sailing" : "Verified sailing provider not connected" }, estimatedCosts: { targetBudget: Number(answers.budget), estimatedTripLow: selectedCruise?.estimatedKnownTotal || logistics.knownSubtotal.low, estimatedTripHigh: selectedCruise?.estimatedKnownTotal || logistics.knownSubtotal.high }, bookingLinks: { cruise: cruiseBookingPath, flight: flightLink, hotel: hotelLink, activities: activityLinks } };
  function toggleActivity(item) { setSelectedActivities((current) => current.some((choice) => (choice.id || choice.name) === (item.id || item.name)) ? current.filter((choice) => (choice.id || choice.name) !== (item.id || item.name)) : [...current, item]); }
  function bookJourney() { if (!bookingUrls.length) { setBookingStatus("Verified flight, hotel, and experience links are still being prepared. A cruise provider is not yet connected."); return; } bookingUrls.forEach((url) => window.open(url, "_blank", "noopener,noreferrer")); setBookingStatus(`${bookingUrls.length} verified provider ${bookingUrls.length === 1 ? "link" : "links"} opened.${selectedCruise ? " Confirm the sailing fare and cabin with CruiseDirect." : " The cruise sailing link remains pending verified inventory."}`); }

  const mapPorts = selectedCruise?.stops.filter((stop) => stop.stopType === "port") || route.ports;
  const heroRoute = selectedCruise ? { id: selectedCruise.id, title: selectedCruise.name, ports: mapPorts, closedLoop: false } : route;
  const heroTitle = selectedCruise?.name || route.title;
  const heroImage = selectedCruise?.images?.[0] || null;

  return <>
    <section className="relative min-h-[92svh] overflow-hidden bg-[#bfcdd1]">
      {introMapMounted ? <CruiseMap route={heroRoute} onReveal={() => setJourneyRevealed(true)} /> : null}
      <div className={`pointer-events-none absolute inset-0 z-[5] bg-[#63777c] transition-opacity duration-1000 ease-out ${journeyRevealed ? "opacity-100" : "opacity-0"}`}>{heroImage ? <Image src={heroImage} alt={`${heroTitle} sailing`} fill unoptimized priority sizes="100vw" className="object-cover" /> : (selectedCruise?.departurePort || route.embarkation).placeId ? <ExactPlacePhoto placeId={(selectedCruise?.departurePort || route.embarkation).placeId} alt={`${heroTitle} coastline`} priority className="h-full w-full object-cover" /> : <Image src="/cruise-hero-v2.jpg" alt={`${heroTitle} ocean journey`} fill priority sizes="100vw" className="object-cover" />}</div>
      <div className={`pointer-events-none absolute inset-0 z-10 transition-colors duration-1000 ${journeyRevealed ? "bg-gradient-to-t from-[#17363e]/80 via-transparent to-black/5" : "bg-gradient-to-t from-[#17363e]/48 via-transparent to-black/5"}`} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-10 text-white sm:px-12 sm:pb-14 lg:px-16" aria-live="polite"><p className="text-[10px] uppercase tracking-[0.22em] text-white/70">{journeyRevealed ? "Your ocean journey" : "Charting your journey"}</p><h1 className={`mt-4 max-w-6xl font-serif text-[clamp(3.5rem,7.4vw,8rem)] leading-[.8] tracking-[-0.06em] transition duration-700 ${journeyRevealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>{heroTitle}</h1><p className={`mt-6 max-w-xl text-sm text-white/76 transition duration-700 ${journeyRevealed ? "opacity-100" : "opacity-0"}`}>{mapPorts.map((port) => port.name || port.city).join(" → ")}</p><p className={`mt-4 text-xs text-white/76 transition-opacity duration-500 ${journeyRevealed ? "opacity-0" : "opacity-100"}`}>{mapPorts.map((port) => port.name || port.city).join("  ·  ")}</p></div>
    </section>

    <CruiseMatches cruises={cruiseMatches} selectedId={selectedCruise?.id || null} onSelect={setSelectedCruiseId} />
    <CruiseItinerary cruise={selectedCruise} />

    <section className="bg-[#f4f1eb] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1.12fr_.88fr] lg:gap-20"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Your ocean journey</p><h2 className="mt-5 font-serif text-[clamp(3.2rem,6vw,6.3rem)] leading-[.87] tracking-[-0.055em]">{route.dek}</h2></div><div className="self-end border-t border-black/15 pt-6 text-sm leading-7 text-black/56"><p>{answers.experience} · {answers.mood} · {answers.duration}</p><p className="mt-4">Complete-trip budget: {money(Number(answers.budget))}</p><p className={`mt-6 text-xs ${logistics.compatibility.level === "poor" ? "text-[#8a4c37]" : "text-black/46"}`}>{logistics.compatibility.level === "excellent" ? "Known travel logistics preserve room for the cruise fare." : logistics.compatibility.level === "acceptable" ? "The lower end of access costs protects a practical cruise allowance." : "A verified sailing fare is still needed before this journey can be confirmed within budget."}</p></div></div>
      <div className="mx-auto mt-16 grid max-w-[1450px] gap-4 sm:grid-cols-2 lg:grid-cols-4">{route.ports.map((port, index) => <article key={port.id} className="group"><div className="relative aspect-[4/3] overflow-hidden bg-[#d4d0c7]">{port.placeId ? <ExactPlacePhoto placeId={port.placeId} alt={`${port.city}, ${port.country}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]" /> : port.image ? <Image src={port.image} alt={`${port.city}, ${port.country}`} fill unoptimized sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" /> : <div className="h-full w-full" />}</div><p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-[#8a6b36]">Port {String(index + 1).padStart(2, "0")}</p><h3 className="mt-2 font-serif text-3xl tracking-[-0.04em]">{port.city}</h3><p className="mt-2 text-xs text-black/45">{port.country}</p></article>)}</div>
    </section>

    <SailingDivider />

    <section className="bg-[#f7f7f4] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-20"><div className="relative aspect-[16/11] overflow-hidden bg-[#d8d3ca]"><Image src="/cruise-hero-v2.jpg" alt="Cruise voyage inspiration" fill sizes="(min-width:1024px) 55vw,100vw" className="object-cover" /><p className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 text-[8px] uppercase tracking-[0.1em] text-white">Editorial voyage image · exact ship pending</p></div><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Your ship for this adventure</p><h2 className="mt-5 font-serif text-[clamp(3.2rem,5.5vw,5.8rem)] leading-[.88] tracking-[-0.05em]">Ship selection pending.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-black/55">The route and ports are grounded. Cruise line, ship, sailing dates, and availability will appear only when matched to verified provider inventory.</p><div className="mt-8 border-y border-black/14 py-5 text-sm"><p><span className="text-black/42">Voyage style</span><span className="float-right">{answers.mood}</span></p><p className="mt-4"><span className="text-black/42">Cabin direction</span><span className="float-right max-w-[58%] text-right">{route.cabinPreference}</span></p></div></div></div></section>

    <section className="bg-[#f4f1eb] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1280px]"><div className="grid gap-10 lg:grid-cols-2 lg:gap-20"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Getting to your journey</p><h2 className="mt-5 font-serif text-[clamp(3.2rem,5.5vw,5.8rem)] leading-[.88] tracking-[-0.05em]">{logistics.mode === "drive" ? "Drive to the water." : `Fly to ${route.embarkation.city}.`}</h2><p className="mt-6 text-sm leading-7 text-black/54">From {answers.originDetails.city}{answers.originDetails.airportCode ? ` (${answers.originDetails.airportCode})` : ""} · {travelers} {travelers === 1 ? "traveler" : "travelers"}</p></div><div className="self-end border-t border-black/15 pt-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-[9px] uppercase tracking-[0.15em] text-black/42">Departure date<input type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} className="mt-2 min-h-12 w-full border-b border-black/20 bg-transparent text-sm text-black" /></label><label className="text-[9px] uppercase tracking-[0.15em] text-black/42">Return date<input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className="mt-2 min-h-12 w-full border-b border-black/20 bg-transparent text-sm text-black" /></label><label className="text-[9px] uppercase tracking-[0.15em] text-black/42 sm:col-span-2">Cabin<select value={cabinClass} onChange={(event) => setCabinClass(event.target.value)} className="mt-2 min-h-12 w-full border-b border-black/20 bg-transparent text-sm text-black"><option value="ECONOMY">Economy</option><option value="PREMIUM_ECONOMY">Premium economy</option><option value="BUSINESS">Business</option><option value="FIRST">First</option></select></label></div></div></div>
      <div className="mt-10 grid gap-px bg-black/12 sm:grid-cols-3">{[[logistics.mode === "drive" ? "Access" : "Airline and schedule", logistics.mode === "drive" ? `${logistics.access.distanceMiles} estimated miles` : "Available after live itinerary search"], ["Duration and stops", logistics.mode === "drive" ? "Ground route" : "Available after live itinerary search"], ["Estimated access cost", `${range(logistics.access)} · not live`]].map(([label, value]) => <div key={label} className="bg-[#f7f7f4] p-6"><p className="text-[9px] uppercase tracking-[0.15em] text-black/42">{label}</p><p className="mt-3 text-sm leading-6">{value}</p></div>)}</div><Link href="/cruises/quiz" className="mt-6 inline-block border-b border-black/25 pb-1 text-xs">Change departure city →</Link></div></section>

    <section className="bg-[#f7f7f4]"><div className="px-6 pt-16 text-center sm:px-10 sm:pt-20"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Your stay before departure</p><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-black/50">One night near {route.embarkation.city}, selected from verified GlobTrek hotel inventory.</p></div><HotelExperience destination={route.hotelDestination} quiz={quiz} onSelected={setSelectedHotel} proposalMode selectedHotelId={selectedHotel?.id || selectedHotel?.name || null} compact /></section>

    <section className="bg-[#f4f1eb] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1280px]"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Port experiences</p><h2 className="mt-5 font-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.9] tracking-[-0.05em]">A little more ashore.</h2>{activities.length ? <div className="mt-10 grid gap-8 md:grid-cols-3">{activities.map((item) => <SelectableExperience key={item.id || item.name} item={item} selected={selectedActivities.some((choice) => (choice.id || choice.name) === (item.id || item.name))} onSelect={() => toggleActivity(item)} />)}</div> : <p className="mt-10 text-sm text-black/48">Verified experiences near this port are still being prepared.</p>}</div></section>

    <section className="bg-[#f7f7f4] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1080px]"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Your estimated journey</p><h2 className="mt-5 font-serif text-[clamp(3rem,5.5vw,5.8rem)] leading-[.88] tracking-[-0.05em]">The complete picture.</h2><div className="mt-10 border-t border-black/14">{[[logistics.mode === "drive" ? "Drive to port" : "Flights", range(logistics.access)], ["Cruise", "Verified sailing fare required"], ["Hotel", range(logistics.preCruiseHotel)], ["Transportation", range(logistics.portTransport)], ["Experiences", selectedActivities.length ? "Confirmed by providers" : "No selections yet"], ["Known logistics", range(logistics.knownSubtotal)], ["Cruise allowance", `Up to ${money(logistics.cruiseAllowance)}`], ["Total estimate", "Pending verified sailing fare"]].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-8 border-b border-black/14 py-5 text-sm"><span className="text-black/48">{label}</span><strong className="max-w-md text-right font-medium">{value}</strong></div>)}</div><p className="mt-6 text-xs leading-6 text-black/45">Access, hotel, and transport are non-live planning estimates. GlobTrek will not state a cruise total until a verified sailing fare is available.</p></div></section>

    <section className="bg-[#f4f1eb] px-6 py-20 sm:px-10 sm:py-28"><div className="mx-auto max-w-[980px] text-center"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Your proposal</p><h2 className="mt-5 font-serif text-[clamp(3.4rem,6vw,6.3rem)] leading-[.87] tracking-[-0.055em]">Your ocean journey is ready.</h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-black/52">Book the verified parts now. The cruise sailing remains pending until exact provider inventory is connected.</p><div className="mx-auto mt-9 grid max-w-2xl gap-3 sm:grid-cols-2"><button type="button" onClick={bookJourney} className="min-h-14 bg-black px-6 text-xs uppercase tracking-[0.1em] text-white">Book your journey</button><EmailTripButton trip={savedTrip} viewUrl="/cruises/results" className="min-h-14 border border-black px-6 text-xs uppercase tracking-[0.1em]" /></div><p role="status" className="mt-4 min-h-5 text-xs text-black/48">{bookingStatus}</p><Link href="/discover" className="mt-8 inline-block border-b border-black/25 pb-1 text-xs">Explore GlobTrek Trips →</Link></div></section>
    <SiteFooter />
  </>;
}

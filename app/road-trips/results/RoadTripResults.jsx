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
import { RoadTripMap } from "./RoadTripMap";

function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value) || 0); }
function isSafeImage(value) { return typeof value === "string" && (/^\//.test(value) || /^https:\/\/(images\.unsplash\.com|upload\.wikimedia\.org|[^/]+\.googleusercontent\.com)\//.test(value)); }
function verifiedLink(item) {
  if (!item?.bookingUrl) return null;
  try { const url = new URL(item.bookingUrl); return url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}
function styleTags(stop) { return String(stop.style || "").split("/").map((tag) => tag.trim()).filter(Boolean).slice(0, 3); }

function SelectablePlace({ item, selected, onSelect, eyebrow }) {
  const image = isSafeImage(item.imageUrl || item.image) ? item.imageUrl || item.image : null;
  const subtitle = item.neighborhood || item.location || (Array.isArray(item.cuisine) ? item.cuisine.slice(0, 2).join(" · ") : item.category) || "Verified place";
  return <button type="button" aria-pressed={selected} onClick={onSelect} className="group relative block w-full text-left">
    <div className="relative aspect-[5/4] overflow-hidden bg-[#ddd7cd]">{image ? <Image src={image} alt="" fill sizes="(min-width:1024px) 30vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.02]" /> : <div className="grid h-full place-items-center px-8 text-center text-xs text-black/38">Image being verified</div>}{selected ? <span className="absolute right-4 top-4 grid h-12 w-[72px] place-items-center rounded-full bg-[#f4f0e8]/95 shadow-sm"><BrandMark className="!h-6 !w-11" /></span> : null}</div>
    <p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-[#8a6b36]">{eyebrow}</p><h3 className="mt-2 font-serif text-3xl leading-[.95] tracking-[-0.035em]">{item.name}</h3><p className="mt-3 text-sm text-black/52">{subtitle}</p>
  </button>;
}

function RouteStop({ stop, index, open, onToggle }) {
  return <article className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.72fr)] lg:items-center lg:gap-12 ${index % 2 ? "lg:[&>div:first-child]:order-2" : ""}`}>
    <button type="button" onClick={onToggle} aria-expanded={open} className="relative aspect-[16/10] overflow-hidden bg-[#d7d0c4] text-left">{stop.placeId ? <ExactPlacePhoto placeId={stop.placeId} alt={`${stop.city}, ${stop.country}`} className="h-full w-full object-cover" /> : stop.image ? <Image src={stop.image} alt={`${stop.city}, ${stop.country}`} fill unoptimized sizes="(min-width:1024px) 58vw, 100vw" className="object-cover" /> : <div className="h-full w-full" role="img" aria-label={`${stop.city} photography is being verified`} />}</button>
    <div><p className="text-[10px] uppercase tracking-[0.18em] text-[#8a6b36]">Stop {String(index + 1).padStart(2, "0")}</p><h3 className="mt-3 font-serif text-[clamp(2.8rem,5vw,5rem)] leading-[.86] tracking-[-0.05em]">{stop.city}</h3><p className="mt-4 text-sm text-black/50">{stop.country}</p><div className="mt-5 flex flex-wrap gap-2">{styleTags(stop).map((tag) => <span key={tag} className="rounded-full border border-black/12 px-3 py-1 text-[10px] text-black/55">{tag}</span>)}</div><button type="button" onClick={onToggle} className="mt-6 border-b border-black/25 pb-1 text-xs">{open ? "Close stop" : "Open stop"}</button>{open ? <p className="mt-5 max-w-md text-sm leading-7 text-black/55">A considered base on this route. Hotels, food, and experiences are drawn only from GlobTrek’s verified catalog where coverage is available.</p> : null}</div>
  </article>;
}

function buildDays(route, selectedHotel, restaurants, activities) {
  return Array.from({ length: route.days }, (_, index) => {
    const stopIndex = Math.min(route.stops.length - 1, Math.floor(index * route.stops.length / route.days));
    const stop = route.stops[stopIndex];
    const previous = index ? route.stops[Math.min(route.stops.length - 1, Math.floor((index - 1) * route.stops.length / route.days))] : null;
    const moving = previous && previous.id !== stop.id;
    const restaurant = restaurants[index % Math.max(restaurants.length, 1)];
    const activity = activities[index % Math.max(activities.length, 1)];
    const title = index === 0 ? `Begin in ${stop.city}` : moving ? `The road to ${stop.city}` : `A day in ${stop.city}`;
    return { day: index + 1, location: stop.city, title, morning: moving ? `Drive toward ${stop.city}.` : `Begin the day in ${stop.city}.`, afternoon: activity ? activity.name : "Leave time to explore at your own pace.", evening: restaurant ? `${restaurant.name}${selectedHotel ? `, then ${selectedHotel.name}` : ""}.` : selectedHotel ? `Settle in at ${selectedHotel.name}.` : "Keep the evening open.", driving: moving ? `About ${Math.round(route.distanceMiles / Math.max(1, route.days - 1))} miles, shown as a route-wide daily average.` : "Local driving only." };
  });
}

export function RoadTripResults() {
  const [recommendation, setRecommendation] = useState(undefined);
  const [restaurants, setRestaurants] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [openStop, setOpenStop] = useState(null);
  const [openDay, setOpenDay] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [vehicle, setVehicle] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const storedAnswers = useSyncExternalStore(() => () => {}, () => window.localStorage.getItem("globtrekRoadTripQuiz") || "", () => "");
  const answers = useMemo(() => { try { return JSON.parse(storedAnswers || "null"); } catch { return null; } }, [storedAnswers]);
  const route = recommendation?.route;
  const quiz = recommendation?.quiz;
  const primaryDestination = route?.stops.find((stop) => stop.id === route.hotelDestinationId) || route?.stops[0];

  useEffect(() => {
    if (!storedAnswers) return undefined;
    const controller = new AbortController();
    fetch("/api/road-trips/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: storedAnswers, signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((payload) => setRecommendation(payload?.route ? payload : null)).catch((error) => { if (error.name !== "AbortError") setRecommendation(null); });
    return () => controller.abort();
  }, [storedAnswers]);

  useEffect(() => {
    if (!primaryDestination || !route) return undefined;
    const controller = new AbortController();
    Promise.all([
      fetch("/api/restaurants/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: primaryDestination.id, limit: 6 }), signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch("/api/activities/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: primaryDestination.id, quiz }), signal: controller.signal }).then((response) => response.ok ? response.json() : null),
    ]).then(([restaurantPayload, activityPayload]) => {
      setRestaurants((restaurantPayload?.restaurants || []).filter((item) => item?.name).slice(0, 3));
      setActivities((activityPayload?.activities || []).filter((item) => item?.name).slice(0, 3));
    }).catch((error) => { if (error.name !== "AbortError") { setRestaurants([]); setActivities([]); } });
    return () => controller.abort();
  }, [primaryDestination, quiz, route]);

  function toggleSelection(item, setter) { setter((current) => current.some((choice) => (choice.id || choice.name) === (item.id || item.name)) ? current.filter((choice) => (choice.id || choice.name) !== (item.id || item.name)) : [...current, item]); }

  if (answers === null || recommendation === null) return <section className="grid min-h-[70svh] place-items-center px-6 text-center"><div><p className="font-serif text-5xl tracking-[-0.05em]">Your road is waiting.</p><p className="mt-4 text-sm text-black/50">Begin with the landscapes and pace that move you.</p><Link href="/road-trips/quiz" className="mt-8 inline-flex min-h-14 items-center bg-black px-7 text-xs uppercase tracking-[0.09em] text-white">Create my route</Link></div></section>;
  if (!route || !quiz || !primaryDestination) return <section className="grid min-h-[70svh] place-items-center"><p className="text-[10px] uppercase tracking-[0.2em] text-black/45">Drawing the road…</p></section>;

  const days = buildDays(route, selectedHotel, selectedRestaurants, selectedActivities);
  const tripContext = { ...quiz, guestCount: quiz.guestCount || 2, originAirport: answers.originDetails?.airportCode, isFlexible: true, currency: "USD" };
  const hotelLink = bookingPropertyUrl(selectedHotel, tripContext);
  const flightLink = route.estimate.access.mode === "flight_and_rental" && /^[A-Z]{3}$/.test(answers.originDetails?.airportCode || "") ? bookingFlightUrl(primaryDestination, tripContext) : null;
  const restaurantLinks = selectedRestaurants.map((item) => ({ name: item.name, url: verifiedLink(item) })).filter((item) => item.url);
  const activityLinks = selectedActivities.map((item) => ({ name: item.name, url: verifiedLink(item) })).filter((item) => item.url);
  const bookingUrls = [...new Set([flightLink, hotelLink, ...restaurantLinks.map((item) => item.url), ...activityLinks.map((item) => item.url)].filter(Boolean))];
  const savedTrip = { clientTripKey: `road-${route.id}-${answers.createdAt || "current"}`, destination: { ...primaryDestination, city: route.title }, travelerProfile: { ...tripContext, dates: null, travelers: Number(tripContext.guestCount) || 2, exactBudget: Number(answers.budget) }, exactBudget: Number(answers.budget), itinerary: { days }, selections: { hotel: selectedHotel, restaurants: selectedRestaurants, activities: selectedActivities }, estimatedCosts: { targetBudget: Number(answers.budget), estimatedTripLow: route.estimate.low, estimatedTripHigh: route.estimate.high }, bookingLinks: { flight: flightLink, hotel: hotelLink, restaurants: restaurantLinks, activities: activityLinks } };
  const remainingLow = Math.max(0, route.estimate.low - route.estimate.access.low);
  const costs = [
    ["Flights", route.estimate.access.mode === "flight_and_rental" ? route.estimate.access.low : 0],
    ["Hotels", remainingLow * .44], ["Food", remainingLow * .24], ["Activities", remainingLow * .14],
    ["Transport", route.estimate.access.mode === "drive" ? route.estimate.access.low + remainingLow * .18 : remainingLow * .18],
  ];
  function bookTrip() {
    if (!bookingUrls.length) { setBookingStatus("Verified booking links are still being prepared."); return; }
    bookingUrls.forEach((url) => window.open(url, "_blank", "noopener,noreferrer"));
    setBookingStatus(`${bookingUrls.length} verified provider ${bookingUrls.length === 1 ? "link" : "links"} opened. Confirm final prices with each provider.`);
  }

  return <>
    <section className="relative min-h-[78svh] overflow-hidden bg-[#d7d0c4]">
      {primaryDestination.placeId ? <ExactPlacePhoto placeId={primaryDestination.placeId} alt={`${route.title} landscape`} className="absolute inset-0 h-full w-full object-cover" /> : route.heroImage ? <Image src={route.heroImage} alt={`${route.title} landscape`} fill priority sizes="100vw" className="object-cover" /> : <div className="absolute inset-0 bg-[#c9c3b9]" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/5 to-black/12" />
      <div className="absolute inset-x-0 bottom-0 px-6 pb-10 text-white sm:px-12 sm:pb-14 lg:px-16"><p className="text-[10px] uppercase tracking-[0.22em] text-white/72">Your road trip</p><h1 className="mt-4 max-w-6xl font-serif text-[clamp(3.5rem,7vw,7.7rem)] leading-[.82] tracking-[-0.06em]">{route.title}</h1><p className="mt-5 max-w-xl text-sm leading-6 text-white/78">{route.dek}</p><div className="mt-7 flex flex-wrap gap-x-7 gap-y-2 text-xs text-white/80"><span>{route.distanceMiles.toLocaleString("en-US")} miles</span><span>{route.days} days</span><span>{answers.kind || answers.style || route.kinds[0]}</span><span>{money(Number(answers.budget))} budget</span></div></div>
    </section>

    <section className="bg-[#f4f1eb] px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-20"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">The route</p><h2 className="mt-5 font-serif text-[clamp(3rem,5.6vw,6rem)] leading-[.88] tracking-[-0.055em]">From {route.stops[0].city} to {route.stops.at(-1).city}.</h2></div><div className="self-end border-t border-black/15 pt-6"><div className="grid grid-cols-2 gap-6"><div><p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Planning estimate</p><p className="mt-2 font-serif text-2xl">{money(route.estimate.low)}–{money(route.estimate.high)}</p></div><div><p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Leaving from</p><p className="mt-2 font-serif text-2xl">{answers.originDetails.city}</p></div></div><p className={`mt-6 text-xs ${route.compatibility.level === "poor" ? "text-[#8a4c37]" : "text-black/48"}`}>{route.compatibility.level === "excellent" ? "Estimated to fit within your total budget." : route.compatibility.level === "acceptable" ? "Close to your budget; the lower end is the practical target." : "The closest grounded route is currently estimated above budget."} These are planning estimates, not live prices.</p></div></div>
      <div className="mx-auto mt-16 max-w-[1280px] space-y-14 sm:mt-20">{route.stops.map((stop, index) => <RouteStop key={stop.id} stop={stop} index={index} open={openStop === index} onToggle={() => setOpenStop(openStop === index ? null : index)} />)}</div>
    </section>

    <section className="bg-[#f7f7f4] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1280px]"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Day by day</p><h2 className="mt-5 font-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.9] tracking-[-0.05em]">The itinerary.</h2><div className="mt-10 border-t border-black/14">{days.map((day, index) => <article key={day.day} className="border-b border-black/14"><button type="button" onClick={() => setOpenDay(openDay === index ? null : index)} aria-expanded={openDay === index} className="grid w-full grid-cols-[54px_1fr_auto] items-center gap-4 py-6 text-left"><span className="text-[10px] text-black/38">{String(day.day).padStart(2, "0")}</span><span><span className="block text-[9px] uppercase tracking-[0.16em] text-black/38">{day.location}</span><span className="mt-1 block font-serif text-2xl">{day.title}</span></span><span aria-hidden="true">{openDay === index ? "−" : "+"}</span></button>{openDay === index ? <div className="grid gap-6 pb-7 pl-[70px] text-sm leading-6 text-black/55 sm:grid-cols-2 lg:grid-cols-4"><p><b className="block text-xs font-normal text-black">Morning</b>{day.morning}</p><p><b className="block text-xs font-normal text-black">Afternoon</b>{day.afternoon}</p><p><b className="block text-xs font-normal text-black">Evening</b>{day.evening}</p><p><b className="block text-xs font-normal text-black">Driving</b>{day.driving}</p></div> : null}</article>)}</div></div></section>

    <div id="stays" className="bg-[#f4f1eb]"><HotelExperience destination={primaryDestination} quiz={quiz} onSelected={setSelectedHotel} proposalMode selectedHotelId={selectedHotel?.id || selectedHotel?.name || null} /></div>

    <section className="bg-[#f7f7f4] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1280px]"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Food</p><h2 className="mt-5 font-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.9] tracking-[-0.05em]">Along the way.</h2>{restaurants.length ? <div className="mt-10 grid gap-8 md:grid-cols-3">{restaurants.map((item) => <SelectablePlace key={item.id || item.name} item={item} eyebrow={selectedRestaurants.some((choice) => (choice.id || choice.name) === (item.id || item.name)) ? "Selected" : "Restaurant"} selected={selectedRestaurants.some((choice) => (choice.id || choice.name) === (item.id || item.name))} onSelect={() => toggleSelection(item, setSelectedRestaurants)} />)}</div> : <p className="mt-10 text-sm text-black/48">Verified restaurants for this route are still being prepared.</p>}</div></section>

    <section id="experiences" className="bg-[#f4f1eb] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1280px]"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Experiences</p><h2 className="mt-5 font-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.9] tracking-[-0.05em]">What makes the drive worth it.</h2>{activities.length ? <div className="mt-10 grid gap-8 md:grid-cols-3">{activities.map((item) => <SelectablePlace key={item.id || item.name} item={item} eyebrow={selectedActivities.some((choice) => (choice.id || choice.name) === (item.id || item.name)) ? "Selected" : item.category || "Experience"} selected={selectedActivities.some((choice) => (choice.id || choice.name) === (item.id || item.name))} onSelect={() => toggleSelection(item, setSelectedActivities)} />)}</div> : <p className="mt-10 text-sm text-black/48">Verified experiences for this route are still being prepared.</p>}</div></section>

    <section className="bg-[#f7f7f4] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1280px]"><div className="grid gap-10 lg:grid-cols-2 lg:gap-20"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Getting there</p><h2 className="mt-5 font-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.9] tracking-[-0.05em]">Before the first mile.</h2></div><div className="self-end border-t border-black/15 pt-6 text-sm leading-7 text-black/55">{route.estimate.access.mode === "flight_and_rental" ? <p>Fly from {answers.originDetails.city}{answers.originDetails.airportCode ? ` (${answers.originDetails.airportCode})` : ""} to the route gateway, then collect a rental car. Estimated access cost: {money(route.estimate.access.low)}–{money(route.estimate.access.high)}. Schedules and live fares are not yet shown.</p> : <p>Drive from {answers.originDetails.city} to the first stop. Estimated access distance: {route.estimate.access.distanceMiles.toLocaleString("en-US")} miles. Estimated access cost: {money(route.estimate.access.low)}–{money(route.estimate.access.high)}.</p>}</div></div></div></section>

    <section className="bg-[#f4f1eb] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1280px]"><div className="flex flex-wrap items-end justify-between gap-8"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Plan the drive</p><h2 className="mt-5 font-serif text-4xl tracking-[-0.04em]">Useful when you need it.</h2></div><div className="flex flex-wrap gap-3"><button type="button" onClick={() => setShowMap((value) => !value)} className="border border-black/15 px-5 py-3 text-xs">{showMap ? "Hide route" : "View route"}</button><a href="#stays" className="border border-black/15 px-5 py-3 text-xs">Hotels</a><a href="#experiences" className="border border-black/15 px-5 py-3 text-xs">Experiences</a></div></div>{showMap ? <div className="relative mt-8 aspect-[16/8] min-h-[340px] overflow-hidden bg-[#d8d3ca]"><RoadTripMap route={route} /></div> : null}<details className="mt-8 border-y border-black/15 py-5"><summary className="flex cursor-pointer list-none items-center justify-between text-sm"><span>Add vehicle type</span><span aria-hidden="true">＋</span></summary><div className="mt-6 grid gap-3 sm:grid-cols-4">{["Gas", "Hybrid", "Electric", "RV"].map((option) => <button key={option} type="button" onClick={() => { setVehicle(option); window.localStorage.setItem("globtrekRoadVehicle", option); }} className={`border px-4 py-4 text-left text-sm ${vehicle === option ? "border-black bg-black text-white" : "border-black/15"}`}>{option}</button>)}</div><p className="mt-4 text-xs text-black/43">Saved for later fuel and charging optimization. No unverified calculation is shown.</p></details></div></section>

    <section className="bg-[#f7f7f4] px-6 py-16 sm:px-10 sm:py-24"><div className="mx-auto max-w-[1080px]"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Trip summary</p><h2 className="mt-5 font-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.9] tracking-[-0.05em]">One journey, organized.</h2><div className="mt-10 border-t border-black/15">{costs.map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-black/15 py-5 text-sm"><span>{label}</span><span>{value ? `est. ${money(value)}` : "Not needed"}</span></div>)}<div className="flex items-center justify-between py-6 font-serif text-2xl"><span>Estimated total</span><span>{money(route.estimate.low)}–{money(route.estimate.high)}</span></div></div><p className="text-xs text-black/45">Planning estimates are not live prices. Final cost and availability are confirmed by each provider.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><EmailTripButton trip={savedTrip} viewUrl="/road-trips/results" className="min-h-14 border border-black px-6 text-xs uppercase tracking-[0.1em]" /><button type="button" onClick={bookTrip} className="min-h-14 bg-black px-6 text-xs uppercase tracking-[0.1em] text-white">Book now</button></div><p role="status" className="mt-4 min-h-5 text-xs text-black/48">{bookingStatus}</p><Link href="/discover" className="mt-9 inline-block border-b border-black/25 pb-1 text-xs">Explore GlobTrek Trips →</Link></div></section>
    <SiteFooter />
  </>;
}

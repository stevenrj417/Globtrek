"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { HotelExperience } from "../../components/HotelExperience";
import { ExactPlacePhoto } from "../../components/ExactPlacePhoto";
import { SiteFooter } from "../../components/SiteChrome";
import { RoadTripMap } from "./RoadTripMap";

function money(value) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }

function ExperienceCard({ item, label, fallbackImage }) {
  const candidate = item.imageUrl || item.image;
  const image = typeof candidate === "string" && (/^\//.test(candidate) || /^https:\/\/(images\.unsplash\.com|upload\.wikimedia\.org|[^/]+\.googleusercontent\.com)\//.test(candidate)) ? candidate : fallbackImage;
  return <article className="group"><div className="relative aspect-[4/3] overflow-hidden bg-[#ddd7cd]"><Image src={image} alt="" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.025]" /></div><p className="mt-5 text-[9px] uppercase tracking-[0.18em] text-[#8a6b36]">{label}</p><h3 className="mt-2 font-serif text-3xl leading-[.95] tracking-[-0.035em]">{item.name}</h3><p className="mt-3 text-sm text-black/52">{item.neighborhood || item.location || (Array.isArray(item.cuisine) ? item.cuisine.slice(0, 2).join(" · ") : item.category) || "Verified for this stop"}</p></article>;
}

export function RoadTripResults() {
  const [revealed, setRevealed] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [recommendation, setRecommendation] = useState(undefined);
  const storedAnswers = useSyncExternalStore(() => () => {}, () => window.localStorage.getItem("globtrekRoadTripQuiz") || "", () => "");
  const answers = useMemo(() => { try { return JSON.parse(storedAnswers || "null"); } catch { return null; } }, [storedAnswers]);
  const route = recommendation?.route;
  const quiz = recommendation?.quiz;
  const primaryDestination = route?.stops.find((stop) => stop.id === route.hotelDestinationId) || route?.stops[0];
  const matchSummary = answers?.requestedRouteId
    ? `Built around ${route?.title || "the road you selected"}, with ${String(answers?.driving || "a balanced driving rhythm").toLowerCase()} and your chosen trip length.`
    : `This route reflects your pull toward ${String(answers?.landscape || "its landscapes").toLowerCase()}, a ${String(answers?.kind || "considered journey").toLowerCase()}, and ${String(answers?.driving || "balanced driving").toLowerCase()}.`;

  useEffect(() => {
    if (!storedAnswers) return undefined;
    const controller = new AbortController();
    fetch("/api/road-trips/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: storedAnswers, signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => setRecommendation(payload?.route ? payload : null))
      .catch((error) => { if (error.name !== "AbortError") setRecommendation(null); });
    return () => controller.abort();
  }, [storedAnswers]);

  useEffect(() => {
    if (!primaryDestination || !route) return undefined;
    const controller = new AbortController();
    Promise.all([
      fetch("/api/restaurants/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: primaryDestination.id, limit: 3 }), signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch("/api/activities/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: primaryDestination.id, quiz }), signal: controller.signal }).then((response) => response.ok ? response.json() : null),
    ]).then(([restaurantPayload, activityPayload]) => {
      const restaurant = restaurantPayload?.restaurants?.find((item) => item?.name);
      const activities = (activityPayload?.activities || []).filter((item) => item?.name).slice(0, 2);
      setExperiences([...(restaurant ? [{ ...restaurant, editorialType: "Restaurant" }] : []), ...activities.map((item) => ({ ...item, editorialType: item.category || "Experience" }))].slice(0, 3));
    }).catch((error) => { if (error.name !== "AbortError") setExperiences([]); });
    return () => controller.abort();
  }, [primaryDestination, quiz, route]);

  if (answers === null || recommendation === null) return <section className="grid min-h-[70svh] place-items-center px-6 text-center"><div><p className="font-serif text-5xl tracking-[-0.05em]">Your road is waiting.</p><p className="mt-4 text-sm text-black/50">Begin with the landscapes and pace that move you.</p><Link href="/road-trips/quiz" className="mt-8 inline-flex min-h-14 items-center bg-black px-7 text-xs uppercase tracking-[0.09em] text-white">Create my route</Link></div></section>;
  if (!route || !quiz || !primaryDestination) return <section className="grid min-h-[70svh] place-items-center"><p className="text-[10px] uppercase tracking-[0.2em] text-black/45">Drawing the road…</p></section>;

  return <>
    <section className={`relative min-h-[calc(100svh-5rem)] overflow-hidden bg-[#c9c3b9] ${revealed ? "road-revealed" : ""}`}>
      <RoadTripMap route={route} onReveal={() => setRevealed(true)} />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/72 via-transparent to-black/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-10 text-white sm:px-12 sm:pb-14 lg:px-16">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/70">{revealed ? "Your route" : "Creating your journey"}</p>
        <h1 className={`mt-4 max-w-6xl font-serif text-[clamp(3.5rem,7.4vw,8rem)] leading-[.8] tracking-[-0.06em] transition duration-1000 ${revealed ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>{route.title}</h1>
        <div className={`mt-7 flex flex-wrap gap-x-8 gap-y-2 text-xs text-white/80 transition delay-300 duration-700 ${revealed ? "opacity-100" : "opacity-0"}`}><span>{route.distanceMiles.toLocaleString("en-US")} miles</span><span>{route.days} days</span><span>{route.stops.length} considered stops</span></div>
      </div>
    </section>

    <section className="bg-[#f4f1eb] px-6 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-24">
        <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">The journey</p><h2 className="mt-6 font-serif text-[clamp(3.5rem,7vw,7.3rem)] leading-[.86] tracking-[-0.055em]">{route.dek}</h2></div>
        <div className="self-end border-t border-black/15 pt-6"><p className="text-sm leading-7 text-black/58">{matchSummary}</p><div className="mt-8 grid grid-cols-2 gap-6 text-sm"><div><p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Planning estimate</p><p className="mt-2 font-serif text-2xl">{money(route.estimate.low)}–{money(route.estimate.high)}</p></div><div><p className="text-[9px] uppercase tracking-[0.15em] text-black/40">Your budget</p><p className="mt-2 font-serif text-2xl">{money(Number(answers.budget))}</p></div></div><p className={`mt-6 text-xs ${route.compatibility.level === "poor" ? "text-[#8a4c37]" : "text-black/48"}`}>{route.compatibility.level === "excellent" ? "Estimated to fit within your total budget." : route.compatibility.level === "acceptable" ? "Close to your budget; the lower end is the practical target." : "Closest grounded route, but currently estimated above budget. It is not presented as within budget."} Estimates include stays, food, experiences, access to the route, and road costs; they are not live prices.</p></div>
      </div>
      <div className="mx-auto mt-16 max-w-[1320px] border-y border-black/12 py-7 text-sm sm:mt-20"><div className="grid gap-5 sm:grid-cols-3"><div><p className="text-[9px] uppercase tracking-[0.16em] text-black/40">Leaving from</p><p className="mt-2">{answers.originDetails.city}{answers.originDetails.airportCode ? ` (${answers.originDetails.airportCode})` : ""}, {answers.originDetails.countryName}</p></div><div><p className="text-[9px] uppercase tracking-[0.16em] text-black/40">Reach the route</p><p className="mt-2">{route.estimate.access.mode === "drive" ? `${route.estimate.access.distanceMiles.toLocaleString("en-US")} estimated driving miles` : "Estimated flight to the route gateway, then rental car"}</p></div><div><p className="text-[9px] uppercase tracking-[0.16em] text-black/40">Access estimate</p><p className="mt-2">{money(route.estimate.access.low)}–{money(route.estimate.access.high)} · not live</p></div></div></div>
      <div className="mx-auto mt-20 max-w-[1500px] space-y-16 sm:mt-28 sm:space-y-24">{route.stops.map((stop, index) => <article key={stop.id} className={`grid gap-7 lg:grid-cols-2 lg:items-center lg:gap-16 ${index % 2 ? "lg:[&>div:first-child]:order-2" : ""}`}><div className="relative aspect-[4/3] overflow-hidden bg-[#d7d0c4]">{stop.placeId ? <ExactPlacePhoto placeId={stop.placeId} alt={`${stop.city}, ${stop.country}`} className="h-full w-full object-cover" /> : stop.image ? <Image src={stop.image} alt={`${stop.city}, ${stop.country}`} fill unoptimized sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" /> : <div className="h-full w-full bg-[#d7d0c4]" role="img" aria-label={`${stop.city} photography is being verified`} />}</div><div className="max-w-xl"><p className="text-[10px] uppercase tracking-[0.18em] text-[#8a6b36]">Stop {String(index + 1).padStart(2, "0")}</p><h3 className="mt-4 font-serif text-[clamp(3.2rem,6vw,6rem)] leading-[.86] tracking-[-0.05em]">{stop.city}</h3><p className="mt-5 text-sm text-black/50">{stop.country} · {stop.style}</p></div></article>)}</div>
    </section>

    <section className="bg-[#f7f7f4]"><HotelExperience destination={primaryDestination} quiz={quiz} /></section>

    <section className="bg-[#171714] px-6 py-20 text-white sm:px-10 sm:py-28">
      <div className="mx-auto max-w-[1400px]"><div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-10 sm:flex-row sm:items-end"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#c0a66d]">Along the way</p><h2 className="mt-5 font-serif text-[clamp(3.5rem,7vw,7rem)] leading-[.86] tracking-[-0.055em]">Worth stopping for.</h2></div><p className="max-w-sm text-sm leading-7 text-white/55">Verified food and experiences from {primaryDestination.city}, selected through the existing GlobTrek catalog.</p></div>
        {experiences.length ? <div className="mt-12 grid gap-10 md:grid-cols-3">{experiences.map((item, index) => <ExperienceCard key={`${item.id || item.name}-${index}`} item={item} label={item.editorialType} fallbackImage={route.stops[index % route.stops.length].image} />)}</div> : <p className="mt-12 text-sm text-white/50">Verified experiences for this stop are still being prepared. No substitutes have been invented.</p>}
      </div>
    </section>

    <section className="bg-[#f4f1eb] px-6 py-20 sm:px-10 sm:py-28"><div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-2 lg:gap-24"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Next layer</p><h2 className="mt-5 font-serif text-[clamp(3.4rem,6vw,6.5rem)] leading-[.87] tracking-[-0.055em]">Make the road work for your car.</h2></div><div className="self-end"><details className="border-y border-black/15 py-6"><summary className="flex cursor-pointer list-none items-center justify-between text-sm"><span>Optimize fuel, charging, and daily distance</span><span aria-hidden="true">＋</span></summary><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Gas or diesel", "Hybrid", "Electric", "Rental / not sure"].map((vehicle) => <button key={vehicle} type="button" onClick={() => window.localStorage.setItem("globtrekRoadVehicle", vehicle)} className="border border-black/15 px-4 py-4 text-left text-sm hover:border-black">{vehicle}</button>)}</div><p className="mt-5 text-xs text-black/45">Vehicle details are saved as a later optimization preference. Fuel and charging calculations will be shown only when grounded route data is available.</p></details><Link href="/discover" className="mt-10 inline-flex min-h-14 items-center justify-between gap-12 bg-black px-6 text-xs font-semibold uppercase tracking-[0.09em] text-white">Explore GlobTrek Trips <span aria-hidden="true">→</span></Link></div></div></section>
    <SiteFooter />
  </>;
}

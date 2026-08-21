"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { placeProviderUrl } from "../data/destinations";
import { itineraryPreviewDays } from "../lib/recommendation/tripSerializer";

function ArrowUpRight() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.4"><path d="M7 17 17 7M8 7h9v9" /></svg>; }
function dayNumber(day, index) { const match = String(day?.day || "").match(/\d+/); return String(match?.[0] || index + 1).padStart(2, "0"); }
const GENERIC_PLAN_COPY = /arrive softly|find your rhythm|one meaningful place|explore at your pace|memorable local meal|easy neighborhood dinner|settle into your stay/i;
function factualTitle(day, index) { return GENERIC_PLAN_COPY.test(day?.title || "") ? `Day ${index + 1}` : day.title; }
function factualDetails(day) { return [day.morning, day.afternoon, day.evening].filter((detail) => detail && !GENERIC_PLAN_COPY.test(detail)); }
function displayableImage(place) {
  const value = place?.imageUrl || place?.image;
  if (!value || value.startsWith("/")) return value || null;
  try { const host = new URL(value).hostname; return host === "images.unsplash.com" || host === "upload.wikimedia.org" || host.endsWith(".googleusercontent.com") ? value : null; }
  catch { return null; }
}

export function ItineraryDocument({ trip, quiz, previewDays = 3, fullTripHref = null }) {
  const [verifiedActivities, setVerifiedActivities] = useState([]);
  const [verifiedRestaurants, setVerifiedRestaurants] = useState([]);
  const plan = trip.plan;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/activities/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: trip.id || trip.airport, quiz }), signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((payload) => setVerifiedActivities(payload?.activities || [])).catch((error) => { if (error.name !== "AbortError") setVerifiedActivities([]); });
    const names = (plan?.picks?.restaurants || []).map((restaurant) => restaurant.name).filter(Boolean);
    fetch("/api/restaurants/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: trip.id || trip.airport, names }), signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((payload) => setVerifiedRestaurants(payload?.restaurants || [])).catch((error) => { if (error.name !== "AbortError") setVerifiedRestaurants([]); });
    return () => controller.abort();
  }, [quiz, trip.id, trip.airport, plan]);
  if (!plan) return null;
  const days = plan.days || [];
  const factualDays = days.filter((day, index) => !GENERIC_PLAN_COPY.test(day?.title || "") || factualDetails(day).length > 0);
  const visibleDays = itineraryPreviewDays({ days: factualDays }, previewDays);
  const restaurantByName = new Map(verifiedRestaurants.map((restaurant) => [restaurant.name, restaurant]));
  const itineraryRestaurants = (plan.picks?.restaurants || []).map((place) => ({ ...place, ...restaurantByName.get(place.name), action: restaurantByName.get(place.name)?.bookingUrl ? "Reserve" : "View", kind: "Restaurant" }));
  const places = [...itineraryRestaurants, ...verifiedRestaurants.map((place) => ({ ...place, action: place.bookingUrl ? "Reserve" : "View", kind: "Restaurant" })), ...(plan.picks?.experiences || []).map((place) => ({ ...place, action: "Details", kind: "Experience" })), ...verifiedActivities.map((place) => ({ ...place, action: place.bookingUrl ? "Tickets" : "Details", kind: "Experience" }))].filter((place, index, all) => all.findIndex((item) => item.name === place.name) === index).slice(0, 6);

  return <>
    {visibleDays.length ? <section id="itinerary" className="scroll-mt-28 px-6 py-20 sm:px-12 sm:py-32" aria-labelledby="itinerary-heading"><div className="mx-auto max-w-[1240px]">
      <header className="max-w-3xl"><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/40">03 · Itinerary</p><h2 id="itinerary-heading" className="mt-5 font-serif text-[clamp(3rem,6vw,6.5rem)] leading-[.9] tracking-[-0.05em]">{days.length || previewDays} days in {trip.city}.</h2></header>
      <div className="mt-14 grid gap-px overflow-hidden bg-black/12 md:grid-cols-4">{visibleDays.map((day, index) => <article key={`${day.day}-${day.title}`} className="flex min-h-[340px] flex-col bg-[#f4f1eb] p-7"><div className="flex justify-between text-xs text-black/38"><span>{dayNumber(day, index)}</span><span>{day.location || day.day}</span></div><h3 className="mt-12 font-serif text-[clamp(2rem,3vw,3.2rem)] leading-[.94] tracking-[-.04em]">{factualTitle(day, index)}</h3><div className="mt-auto space-y-3 pt-10 text-sm leading-5 text-black/58">{factualDetails(day).map((detail) => <p key={detail}>{detail}</p>)}</div></article>)}{fullTripHref && factualDays.length > previewDays ? <Link href={fullTripHref} className="flex min-h-[220px] flex-col items-center justify-center bg-[#171714] p-7 text-white"><span className="font-serif text-6xl">+{factualDays.length - previewDays}</span><span className="mt-5 text-xs text-white/55">View the full itinerary</span></Link> : null}</div>
    </div></section> : null}
    {places.length ? <section className="bg-[#ded8cf] px-6 py-20 sm:px-12 sm:py-28" aria-labelledby="places-heading"><div className="mx-auto max-w-[1240px]"><p className="text-xs text-black/40">Places in your itinerary</p><h2 id="places-heading" className="mt-4 font-serif text-[clamp(2.7rem,5vw,5rem)] leading-[.95] tracking-[-0.045em]">Dining and plans.</h2><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{places.map((place, index) => { const image = displayableImage(place); return <a key={`${place.kind}-${place.name}`} href={placeProviderUrl(place, trip)} target="_blank" rel={place.bookingUrl ? "noopener sponsored" : "noopener"} className="group flex min-h-[240px] flex-col bg-[#f4f1eb]">{image ? <div className="relative aspect-[16/10] overflow-hidden"><Image src={image} alt="" fill sizes="(min-width:1024px) 33vw,(min-width:640px) 50vw,100vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" /></div> : null}<span className="flex flex-1 items-end justify-between gap-5 p-6"><span><span className="text-[10px] text-black/40">{place.kind} · Day {Math.min(index + 1, Math.max(days.length, 1))}</span><strong className="mt-2 block font-serif text-2xl font-normal">{place.name}</strong>{place.provider === "opentable" ? <span className="mt-2 block text-[9px] uppercase tracking-[0.14em] text-black/40">Powered by OpenTable</span> : null}</span><span className="flex items-center gap-2 text-xs font-medium">{place.action}<ArrowUpRight /></span></span></a>; })}</div><p className="mt-5 text-xs leading-5 text-black/45">Reservation and ticket availability are confirmed on the linked provider. No availability is implied here.</p></div></section> : null}
  </>;
}

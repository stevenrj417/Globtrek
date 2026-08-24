"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

const GENERIC_PLAN_COPY = /arrive softly|find your rhythm|one meaningful place|explore at your pace|memorable local meal|easy neighborhood dinner|settle into your stay/i;

function SelectMark() {
  return <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f4f1eb]/95 shadow-sm" aria-hidden="true"><BrandMark className="!h-6 !w-10" /></span>;
}

function dayTitle(day, index) {
  const title = String(day?.title || "").trim();
  return !title || GENERIC_PLAN_COPY.test(title) ? `A day in the city` : title;
}

function dayDetails(day) {
  return [day?.morning, day?.afternoon, day?.evening].filter((value) => value && !GENERIC_PLAN_COPY.test(value));
}

export function ProposalItinerary({ trip }) {
  const days = trip.plan?.days || [];
  if (!days.length) return null;
  const highlights = days.slice(0, 3);
  return <section id="itinerary" className="scroll-mt-24 border-t border-black/12 px-6 py-10 sm:px-12 sm:py-12" aria-labelledby="itinerary-heading"><div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[.5fr_1.5fr] lg:items-stretch"><header><p className="text-[9px] uppercase tracking-[.2em] text-black/45">03 &nbsp;&nbsp; Your itinerary</p><h2 id="itinerary-heading" className="mt-5 max-w-xs font-serif text-[clamp(2.25rem,3.7vw,3.55rem)] leading-[.95] tracking-[-.045em]">A first look at your {days.length} days.</h2><a href="#dining" className="mt-7 inline-block border-b border-black/25 pb-1 text-[9px] uppercase tracking-[.12em]">Continue through the trip →</a></header><div className="grid overflow-hidden border border-black/10 sm:grid-cols-2 lg:grid-cols-4">{highlights.map((day, index) => { const details = dayDetails(day); return <article key={`${day.day || "day"}-${index}`} className="grid min-h-[240px] grid-rows-[.82fr_1fr] border-b border-black/10 sm:border-r lg:border-b-0"><div className="relative min-h-[130px]"><Image src={trip.image} alt={`${trip.city}, day ${index + 1}`} fill sizes="(min-width:1024px) 18vw,50vw" className="object-cover" /></div><div className="bg-[#fbfaf7] p-4"><p className="text-[8px] uppercase tracking-[.15em] text-black/40">Day {index + 1}</p><h3 className="mt-2 font-serif text-xl leading-[1.02] tracking-[-.03em]">{dayTitle(day, index)}</h3><p className="mt-3 line-clamp-3 text-[11px] leading-4 text-black/55">{details[0] || day.location || `Explore ${trip.city}`}</p></div></article>; })}<article className="flex min-h-[190px] flex-col justify-between bg-[#eeeae2] p-5"><p className="text-[8px] uppercase tracking-[.15em] text-black/40">+{Math.max(0, days.length - highlights.length)} days</p><p className="font-serif text-xl leading-tight">Curated for you</p><a href="#dining" className="text-[9px] underline">Keep planning →</a></article></div></div></section>;
}

function safeImage(item) {
  const value = item?.imageUrl || item?.image;
  if (!value) return null;
  if (value.startsWith("/")) return value;
  try {
    const host = new URL(value).hostname;
    return host === "images.unsplash.com" || host === "upload.wikimedia.org" || host.endsWith(".googleusercontent.com") ? value : null;
  } catch { return null; }
}

function CatalogCard({ item, selected, onToggle, kind, destination }) {
  const verifiedImage = safeImage(item);
  const image = verifiedImage || destination.image;
  const meta = kind === "restaurant"
    ? [Array.isArray(item.cuisine) ? item.cuisine.slice(0, 2).join(" · ") : item.cuisine, item.neighborhood, item.rating ? `${item.rating} rating` : null]
    : [item.category, item.location];
  const description = item.description || (kind === "restaurant" ? "Selected from the verified dining edit." : "Matched to the pace and interests of this trip.");
  const sourceUrl = item.imageSourceUrl || item.imageLicenseMetadata?.sourcePageUrl || null;
  const action = selected ? "Added to your trip" : kind === "restaurant" && item.bookingUrl ? "Reserve" : "Add to trip";
  return <article className={`group relative overflow-hidden border border-black/8 transition duration-300 ${selected ? "bg-[#e6dfd4] shadow-[0_12px_30px_rgba(23,23,20,.07)]" : "bg-[#fbfaf7] hover:bg-[#eeeae2]"}`}><button type="button" onClick={() => onToggle(item)} aria-pressed={selected} className="block w-full text-left">
    <div className="relative aspect-[16/10] overflow-hidden bg-[#d8d2c8]">
      <Image src={image} alt={verifiedImage ? `${item.name}, ${destination.city}` : `${destination.city} destination view for ${item.name}`} fill sizes="(min-width:1024px) 31vw,(min-width:640px) 50vw,100vw" className="object-cover transition duration-700 group-hover:scale-[1.02]" />
      {!verifiedImage ? <span className="absolute bottom-3 left-3 bg-black/58 px-2 py-1 text-[8px] uppercase tracking-[.1em] text-white">Destination view</span> : null}
      {selected ? <span className="absolute right-4 top-4"><SelectMark /></span> : null}
    </div>
    <span className="block p-4"><span className="block text-[8px] uppercase tracking-[.12em] text-black/42">{meta.filter(Boolean).join(" · ")}</span><span className="mt-2 block font-serif text-[1.35rem] leading-[1.02] tracking-[-.03em]">{item.name}</span>{kind === "activity" ? <span className="mt-2 block line-clamp-2 text-[11px] leading-4 text-black/55">{description}</span> : null}<span className="mt-4 block text-[9px] font-medium uppercase tracking-[.12em]">{action} &nbsp;→</span></span>
  </button>{verifiedImage && sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener" className="absolute left-3 top-3 z-10 bg-black/58 px-2 py-1 text-[8px] text-white">Photo source ↗</a> : null}</article>;
}

function CuratedSection({ id, eyebrow, title, intro, items, selections, onToggle, kind, destination, loading, initialLimit = null }) {
  const [expanded, setExpanded] = useState(false);
  const visibleLimit = initialLimit ? (expanded ? Math.min(items.length, initialLimit * 2) : initialLimit) : items.length;
  const visibleItems = items.slice(0, visibleLimit);
  return <section id={id} className="scroll-mt-24 border-t border-black/12 px-6 py-10 sm:px-12 sm:py-12" aria-labelledby={`${id}-heading`}><div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[.5fr_1.5fr]"><header><p className="text-[9px] uppercase tracking-[.2em] text-black/45">{eyebrow}</p><h2 id={`${id}-heading`} className="mt-5 max-w-xs font-serif text-[clamp(2.25rem,3.7vw,3.55rem)] leading-[.95] tracking-[-.045em]">{title}</h2><p className="mt-4 max-w-xs text-xs leading-5 text-black/55">{intro}</p></header>
    {loading ? <div className="grid min-h-56 place-items-center bg-[#ebe6dd] text-sm text-black/45">Preparing the verified edit…</div> : items.length ? <div><div className={`grid gap-3 sm:grid-cols-2 ${kind === "restaurant" ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>{visibleItems.map((item) => <CatalogCard key={item.id || item.name} item={item} destination={destination} kind={kind} selected={selections.some((selected) => (selected.id || selected.name) === (item.id || item.name))} onToggle={onToggle} />)}</div>{initialLimit && items.length > initialLimit ? <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-5 border-b border-black/25 pb-1 text-[10px]">{expanded ? `Show fewer ${kind === "restaurant" ? "restaurants" : "experiences"}` : `View all ${kind === "restaurant" ? "restaurants" : "experiences"}`}</button> : null}</div> : <p className="border-y border-black/15 py-7 text-sm text-black/50">No verified {kind === "restaurant" ? "dining" : "experience"} recommendations are available yet.</p>}
  </div></section>;
}

export function CuratedTripChoices({ destination, quiz, restaurants, activities, onRestaurantsChange, onActivitiesChange }) {
  const [catalog, setCatalog] = useState({ restaurants: null, activities: null });
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/restaurants/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: destination.id || destination.airport }), signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch("/api/activities/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: destination.id || destination.airport, quiz }), signal: controller.signal }).then((response) => response.ok ? response.json() : null),
    ]).then(([dining, experiences]) => setCatalog({ restaurants: dining?.restaurants || [], activities: experiences?.activities || [] })).catch((error) => { if (error.name !== "AbortError") setCatalog({ restaurants: [], activities: [] }); });
    return () => controller.abort();
  }, [destination.id, destination.airport, quiz]);
  function toggle(item, selected, update) { update(selected.some((current) => (current.id || current.name) === (item.id || item.name)) ? selected.filter((current) => (current.id || current.name) !== (item.id || item.name)) : [...selected, item]); }
  return <>
    <CuratedSection id="dining" eyebrow="04 &nbsp;&nbsp; Dinner, handled" title="Reservations for you." intro="A concise edit of verified restaurants for this trip." items={catalog.restaurants || []} loading={catalog.restaurants === null} selections={restaurants} onToggle={(item) => toggle(item, restaurants, onRestaurantsChange)} kind="restaurant" destination={destination} initialLimit={4} />
    <CuratedSection id="experiences" eyebrow="Experiences" title="What brings the place to life." intro="Three experiences matched to this trip, with space left for the unexpected." items={catalog.activities || []} loading={catalog.activities === null} selections={activities} onToggle={(item) => toggle(item, activities, onActivitiesChange)} kind="activity" destination={destination} initialLimit={3} />
  </>;
}

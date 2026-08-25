"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

const GENERIC_PLAN_COPY = /arrive softly|find your rhythm|one meaningful place|explore at your pace|memorable local meal|easy neighborhood dinner|settle into your stay/i;
const DAY_HIGHLIGHTS = [
  { title: "Arrival & settle", description: "Land, check in, and get oriented nearby." },
  { title: "Historic neighborhoods", description: "Architecture, markets, and local character." },
  { title: "Local experiences", description: "Food, culture, and places worth lingering in." },
];
const DAY_IMAGE_POSITIONS = ["center", "35% center", "70% center"];

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

export function ProposalItinerary({ trip, images = [] }) {
  const days = trip.plan?.days || [];
  if (!days.length) return null;
  const highlights = days.slice(0, 3);
  const verifiedImages = images.map(safeImage).filter(Boolean);
  return <section id="itinerary" className="scroll-mt-24 border-t border-black/15 px-6 py-8 sm:px-12 sm:py-10" aria-labelledby="itinerary-heading"><div className="mx-auto grid max-w-[1180px] gap-7 lg:grid-cols-[.48fr_1.52fr] lg:items-stretch"><header><p className="text-[9px] uppercase tracking-[.2em]">03 &nbsp;&nbsp; Your itinerary</p><h2 id="itinerary-heading" className="mt-5 max-w-xs font-serif text-[clamp(2rem,3.2vw,3rem)] leading-[.95] tracking-[-.045em]">A first look at your {days.length} days.</h2><a href="#dining" className="mt-6 inline-block border-b border-black/30 pb-1 text-[9px] uppercase tracking-[.12em]">Continue through the trip →</a></header><div className="grid overflow-hidden border border-black/15 sm:grid-cols-2 lg:grid-cols-4">{highlights.map((day, index) => { const details = dayDetails(day); const fallback = DAY_HIGHLIGHTS[index]; const title = GENERIC_PLAN_COPY.test(dayTitle(day, index)) || dayTitle(day, index) === "A day in the city" ? fallback.title : dayTitle(day, index); const description = details[0] || fallback.description; const image = verifiedImages[index] || trip.image; return <article key={`${day.day || "day"}-${index}`} className="grid min-h-[225px] grid-rows-[.8fr_1fr] border-b border-black/15 sm:border-r lg:border-b-0"><div className="relative min-h-[120px]"><Image src={image} alt={`${trip.city}, ${title}`} fill sizes="(min-width:1024px) 18vw,50vw" className="object-cover" style={{ objectPosition: DAY_IMAGE_POSITIONS[index] }} /></div><div className="bg-white p-4"><p className="text-[8px] uppercase tracking-[.15em]">Day {index + 1}</p><h3 className="mt-2 font-serif text-lg leading-[1.02] tracking-[-.03em]">{title}</h3><p className="mt-3 line-clamp-3 text-[11px] leading-4">{description}</p></div></article>; })}<article className="flex min-h-[180px] flex-col justify-between bg-[#f1eee7] p-5"><p className="text-[8px] uppercase tracking-[.15em]">+{Math.max(0, days.length - highlights.length)} days</p><p className="font-serif text-lg leading-tight">Curated for you</p><a href="#dining" className="text-[9px] underline">Keep planning →</a></article></div></div></section>;
}

function safeImage(item) {
  const value = item?.imageUrl || item?.image || item?.photoUri;
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
  return <section id={id} className="scroll-mt-24 border-t border-black/15 px-6 py-8 sm:px-12 sm:py-10" aria-labelledby={`${id}-heading`}><div className="mx-auto grid max-w-[1180px] gap-7 lg:grid-cols-[.48fr_1.52fr]"><header><p className="text-[9px] uppercase tracking-[.2em]">{eyebrow}</p><h2 id={`${id}-heading`} className="mt-5 max-w-xs font-serif text-[clamp(2rem,3.2vw,3rem)] leading-[.95] tracking-[-.045em]">{title}</h2><p className="mt-4 max-w-xs text-xs leading-5">{intro}</p></header>
    {loading ? <div className="grid min-h-56 place-items-center bg-[#ebe6dd] text-sm text-black/45">Preparing the verified edit…</div> : items.length ? <div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{visibleItems.map((item) => <CatalogCard key={item.id || item.name} item={item} destination={destination} kind={kind} selected={selections.some((selected) => (selected.id || selected.name) === (item.id || item.name))} onToggle={onToggle} />)}</div>{initialLimit && items.length > initialLimit ? <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-5 border-b border-black/25 pb-1 text-[10px]">{expanded ? `Show fewer ${kind === "restaurant" ? "restaurants" : "experiences"}` : `View all ${kind === "restaurant" ? "restaurants" : "experiences"}`}</button> : null}</div> : <p className="border-y border-black/15 py-7 text-sm text-black/50">No verified {kind === "restaurant" ? "dining" : "experience"} recommendations are available yet.</p>}
  </div></section>;
}

export function CuratedTripChoices({ destination, quiz, restaurants, activities, onRestaurantsChange, onActivitiesChange, onCatalogChange }) {
  const [catalog, setCatalog] = useState({ restaurants: null, activities: null });
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/restaurants/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: destination.id || destination.airport }), signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch("/api/activities/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: destination.id || destination.airport, quiz }), signal: controller.signal }).then((response) => response.ok ? response.json() : null),
    ]).then(([dining, experiences]) => { const next = { restaurants: dining?.restaurants || [], activities: experiences?.activities || [] }; setCatalog(next); onCatalogChange?.(next); }).catch((error) => { if (error.name !== "AbortError") { const empty = { restaurants: [], activities: [] }; setCatalog(empty); onCatalogChange?.(empty); } });
    return () => controller.abort();
  }, [destination.id, destination.airport, onCatalogChange, quiz]);
  function toggle(item, selected, update) { update(selected.some((current) => (current.id || current.name) === (item.id || item.name)) ? selected.filter((current) => (current.id || current.name) !== (item.id || item.name)) : [...selected, item]); }
  return <>
    <CuratedSection id="dining" eyebrow="04 &nbsp;&nbsp; Dinner, handled" title="Reservations for you." intro="A concise edit of verified restaurants for this trip." items={catalog.restaurants || []} loading={catalog.restaurants === null} selections={restaurants} onToggle={(item) => toggle(item, restaurants, onRestaurantsChange)} kind="restaurant" destination={destination} initialLimit={4} />
    <CuratedSection id="experiences" eyebrow="Experiences" title="What brings the place to life." intro="Four experiences matched to this trip, with space left for the unexpected." items={catalog.activities || []} loading={catalog.activities === null} selections={activities} onToggle={(item) => toggle(item, activities, onActivitiesChange)} kind="activity" destination={destination} initialLimit={4} />
  </>;
}

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
  const [openDay, setOpenDay] = useState(null);
  const days = trip.plan?.days || [];
  if (!days.length) return null;

  return <section id="itinerary" className="scroll-mt-24 px-6 py-16 sm:px-12 sm:py-20" aria-labelledby="itinerary-heading">
    <div className="mx-auto max-w-[1240px]">
      <header className="max-w-3xl"><p className="text-[10px] uppercase tracking-[.2em] text-black/40">The itinerary</p><h2 id="itinerary-heading" className="mt-4 font-serif text-[clamp(2.8rem,5.2vw,5.2rem)] leading-[.9] tracking-[-.05em]">The days, considered.</h2><p className="mt-5 max-w-xl text-sm leading-6 text-black/55">A calm overview first. Open any day for the plan.</p></header>
      <div className="mt-9 border-t border-black/15">
        {days.map((day, index) => {
          const isOpen = openDay === index;
          const details = dayDetails(day);
          return <article key={`${day.day || "day"}-${index}`} className="border-b border-black/15">
            <button type="button" onClick={() => setOpenDay(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`trip-day-${index}`} className="grid w-full grid-cols-[4rem_1fr_auto] items-center gap-4 py-5 text-left sm:grid-cols-[7rem_1fr_auto] sm:py-6">
              <span className="text-[10px] tracking-[.18em] text-black/40">DAY {String(index + 1).padStart(2, "0")}</span>
              <span className="font-serif text-[clamp(1.45rem,2.5vw,2.3rem)] leading-tight tracking-[-.03em]">{dayTitle(day, index)}</span>
              <span className={`text-xl transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} aria-hidden="true">+</span>
            </button>
            <div id={`trip-day-${index}`} hidden={!isOpen} className="pb-8 sm:pb-10">
              <div className="grid overflow-hidden bg-[#e6dfd4] lg:grid-cols-[.9fr_1.1fr]">
                <div className="relative min-h-[250px] lg:min-h-[350px]"><Image src={trip.image} alt={`${trip.city} destination view`} fill sizes="(min-width:1024px) 45vw,100vw" className="object-cover" /></div>
                <div className="flex flex-col justify-center p-6 sm:p-9">
                  <p className="text-[10px] uppercase tracking-[.18em] text-black/40">{day.location || trip.city}</p>
                  {details.length ? <ol className="mt-7 space-y-6">{details.map((detail, detailIndex) => <li key={detail} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-7 text-black/62"><span className="font-serif text-lg text-black/35">{String(detailIndex + 1).padStart(2, "0")}</span><span>{detail}</span></li>)}</ol> : <p className="mt-7 text-sm leading-7 text-black/55">Your verified dining and experiences appear below, ready to add to this trip.</p>}
                </div>
              </div>
            </div>
          </article>;
        })}
      </div>
    </div>
  </section>;
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
  return <article className={`group relative overflow-hidden transition duration-300 ${selected ? "bg-[#e6dfd4] shadow-[0_14px_38px_rgba(23,23,20,.08)]" : "bg-[#ebe6dd] hover:bg-[#e6dfd4]"}`}><button type="button" onClick={() => onToggle(item)} aria-pressed={selected} className="block w-full text-left">
    <div className="relative aspect-[4/3] overflow-hidden bg-[#d8d2c8]">
      <Image src={image} alt={verifiedImage ? `${item.name}, ${destination.city}` : `${destination.city} destination view for ${item.name}`} fill sizes="(min-width:1024px) 31vw,(min-width:640px) 50vw,100vw" className="object-cover transition duration-700 group-hover:scale-[1.02]" />
      {!verifiedImage ? <span className="absolute bottom-3 left-3 bg-black/58 px-2 py-1 text-[8px] uppercase tracking-[.1em] text-white">Destination view</span> : null}
      {selected ? <span className="absolute right-4 top-4"><SelectMark /></span> : null}
    </div>
    <span className="block p-5 sm:p-6"><span className="block text-[9px] uppercase tracking-[.15em] text-black/42">{meta.filter(Boolean).join(" · ")}</span><span className="mt-2 block font-serif text-[1.7rem] leading-[1.02] tracking-[-.035em]">{item.name}</span><span className="mt-3 block line-clamp-3 text-[13px] leading-5 text-black/55">{description}</span><span className="mt-5 block text-[9px] uppercase tracking-[.15em] text-black/45">{selected ? "Added to your trip" : "Add to your trip"}</span></span>
  </button>{verifiedImage && sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener" className="absolute left-3 top-3 z-10 bg-black/58 px-2 py-1 text-[8px] text-white">Photo source ↗</a> : null}</article>;
}

function CuratedSection({ id, eyebrow, title, intro, items, selections, onToggle, kind, destination, loading, initialLimit = null }) {
  const [expanded, setExpanded] = useState(false);
  const visibleLimit = initialLimit ? (expanded ? Math.min(items.length, initialLimit * 2) : initialLimit) : items.length;
  const visibleItems = items.slice(0, visibleLimit);
  return <section id={id} className="scroll-mt-24 px-6 py-16 sm:px-12 sm:py-20" aria-labelledby={`${id}-heading`}><div className="mx-auto max-w-[1240px]"><header className="max-w-3xl"><p className="text-[10px] uppercase tracking-[.2em] text-black/40">{eyebrow}</p><h2 id={`${id}-heading`} className="mt-4 font-serif text-[clamp(2.8rem,5.2vw,5.2rem)] leading-[.9] tracking-[-.05em]">{title}</h2><p className="mt-5 max-w-xl text-sm leading-6 text-black/55">{intro}</p></header>
    {loading ? <div className="mt-9 grid min-h-56 place-items-center bg-[#ebe6dd] text-sm text-black/45">Preparing the verified edit…</div> : items.length ? <><div className="mt-9 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{visibleItems.map((item) => <CatalogCard key={item.id || item.name} item={item} destination={destination} kind={kind} selected={selections.some((selected) => (selected.id || selected.name) === (item.id || item.name))} onToggle={onToggle} />)}</div>{initialLimit && items.length > initialLimit ? <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-7 border-b border-black/25 pb-1 text-xs">{expanded ? "Show fewer experiences" : "View more experiences"}</button> : null}</> : <p className="mt-9 border-y border-black/15 py-7 text-sm text-black/50">No verified {kind === "restaurant" ? "dining" : "experience"} recommendations are available yet.</p>}
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
    <CuratedSection id="dining" eyebrow="Dining" title="Tables worth keeping." intro="A short, verified edit. Add only the places you want in the final trip." items={catalog.restaurants || []} loading={catalog.restaurants === null} selections={restaurants} onToggle={(item) => toggle(item, restaurants, onRestaurantsChange)} kind="restaurant" destination={destination} />
    <CuratedSection id="experiences" eyebrow="Experiences" title="What brings the place to life." intro="Three experiences matched to this trip, with space left for the unexpected." items={catalog.activities || []} loading={catalog.activities === null} selections={activities} onToggle={(item) => toggle(item, activities, onActivitiesChange)} kind="activity" destination={destination} initialLimit={3} />
  </>;
}

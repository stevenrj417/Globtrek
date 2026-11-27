"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "./Photo";
import { ExploreMap } from "./ExploreMap";

const titleWords = (value) => String(value || "").toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (letter) => letter.toUpperCase());
const LEVEL = { PRICE_LEVEL_INEXPENSIVE: "$ · Inexpensive", PRICE_LEVEL_MODERATE: "$$ · Moderate", PRICE_LEVEL_EXPENSIVE: "$$$ · Expensive", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$ · Very expensive" };
const TIER = { budget: "$ · Cheap eats", mid: "$$ · Mid-range", high: "$$$ · Splurge", free: "Free to explore", ticketed: "Ticketed" };

function Stars({ value }) {
  const full = Math.round(Number(value) || 0);
  return <span aria-hidden="true" className="tracking-[0.12em]">{"★".repeat(full)}<span className="opacity-25">{"★".repeat(Math.max(0, 5 - full))}</span></span>;
}

// A plain sentence for places without a Wikipedia introduction, built only
// from what GlobTrek knows (type, area, city); nothing is made up.
function summary(item, kind, city) {
  const type = String(item.category || (kind === "restaurant" ? "restaurant" : "place to visit")).replace(/_/g, " ").toLowerCase();
  const article = /^[aeiou]/.test(type) ? "An" : "A";
  return `${article} ${type} in ${item.neighborhood ? `${item.neighborhood}, ` : ""}${titleWords(city)}.`;
}

export function PlaceDetailsDialog({ item, kind, destination, selected, onToggle, onClose }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [onClose]);
  const city = destination.city;
  const type = titleWords(String(item.category || (kind === "restaurant" ? "Restaurant" : "Things to do")).replace(/_/g, " "));
  const price = TIER[item.tier] || LEVEL[item.priceLevel] || null;
  const mapsUrl = item.googleMapsUrl && /^https:\/\/(maps\.google\.com|www\.google\.com\/maps)/.test(item.googleMapsUrl) ? item.googleMapsUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([item.name, titleWords(city)].join(", "))}`;
  const website = item.websiteUrl && /^https?:\/\//.test(item.websiteUrl) ? item.websiteUrl : null;
  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);
  return createPortal(<div className="fixed inset-0 z-[120] flex justify-end bg-black/35 backdrop-blur-[2px]" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-label={item.name} onMouseDown={(event) => event.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto overscroll-contain bg-bg shadow-overlay">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-black/10 bg-bg/95 px-6 py-4 backdrop-blur sm:px-10">
        <p className="truncate font-serif text-xl">{item.name}</p>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 shrink-0 place-items-center text-2xl font-light">×</button>
      </div>
      {item.imageUrl ? <figure className="relative aspect-[16/10] bg-placeholder">
        <Image src={item.imageUrl} alt={item.imageIsExample ? `${item.exampleDish || item.cuisineLabel || "Food"}, an example dish` : `${item.name}, ${titleWords(city)}`} fill sizes="(min-width: 672px) 672px, 100vw" className="object-cover" />
        {item.imageSourceUrl ? <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 pb-3 pt-8 text-xs text-white sm:px-10">{item.imageIsExample ? `Example dish${item.exampleDish ? ` (${item.exampleDish})` : ""}, not a photo of this restaurant. ` : ""}Photo: <a href={item.imageSourceUrl} target="_blank" rel="noopener" className="underline">{item.imageCredit || "Wikimedia Commons"}</a></figcaption> : null}
      </figure> : null}
      <div className="px-6 pb-12 sm:px-10">
        <p className="mt-8 text-micro uppercase tracking-label">{[type, item.neighborhood, titleWords(city)].filter(Boolean).join(" · ")}</p>
        <h2 className="mt-2 font-serif text-4xl leading-none tracking-tight-3">{item.name}</h2>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {item.rating ? <p><span className="tabular font-serif text-2xl">{Number(item.rating).toFixed(1)}</span> <Stars value={item.rating} />{item.reviewCount ? <span className="text-subtle"> · {Number(item.reviewCount).toLocaleString("en-US")} reviews</span> : null}<span className="sr-only"> out of 5</span></p> : null}
          {price ? <p className="tabular">{price}</p> : null}
        </div>
        {item.rating ? <p className="mt-1 text-xs text-subtle">Rating from Google Maps when GlobTrek last checked.</p> : null}
        {item.location ? <p className="mt-4 text-sm leading-6">{item.location}</p> : null}

        <div className="mt-7 flex flex-wrap gap-2">
          <button type="button" onClick={() => onToggle(item)} aria-pressed={selected} className={`inline-flex min-h-12 items-center px-6 text-micro font-medium uppercase tracking-label ${selected ? "border border-black" : "bg-black text-white"}`}>{selected ? "Added to your trip ✓" : "Add to trip"}</button>
          {website ? <a href={website} target="_blank" rel="noopener nofollow" className="inline-flex min-h-12 items-center border border-black/20 px-5 text-micro font-medium uppercase tracking-label hover:border-black">Website ↗</a> : null}
          <a href={mapsUrl} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center border border-black/20 px-5 text-micro font-medium uppercase tracking-label hover:border-black">Google Maps ↗</a>
        </div>

        <h3 className="mt-12 font-serif text-2xl tracking-tight-2">{kind === "restaurant" ? "About the restaurant" : "What it is"}</h3>
        {item.about ? <>
          {item.about.split(/\n+/).map((paragraph, index) => <p key={index} className="mt-4 text-sm leading-7">{paragraph}</p>)}
          <p className="mt-4 text-xs text-subtle">From <a href={item.aboutSourceUrl} target="_blank" rel="noopener" className="underline">Wikipedia</a>, CC BY-SA 4.0.</p>
        </> : <p className="mt-4 text-sm leading-7">{item.description || summary(item, kind, city)} {kind === "restaurant" ? "Check the menu, hours and booking on their website or Google Maps before you go." : "Check opening hours and tickets on their website before you go."}</p>}

        {Number.isFinite(latitude) && Number.isFinite(longitude) ? <>
          <h3 className="mt-12 font-serif text-2xl tracking-tight-2">Where it is</h3>
          <ExploreMap className="mt-5" latitude={latitude} longitude={longitude} label={item.name} query={[item.name, titleWords(city)].join(", ")} zoomKm={1.2} height="h-[280px]" />
        </> : null}
      </div>
    </section>
  </div>, document.body);
}

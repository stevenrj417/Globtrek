"use client";

import Image from "./Photo";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { BookableTours } from "./results/BookableTours";
import { PlaceDetailsDialog } from "./PlaceDetails";

function SelectMark() {
  return <span className="grid h-12 w-12 place-items-center rounded-full bg-canvas/95 shadow-sm" aria-hidden="true"><BrandMark className="!h-6 !w-10" /></span>;
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

const titleWords = (value) => String(value || "").toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (letter) => letter.toUpperCase());

// The tile shown when a place has no free photo: what kind of place it is.
function placeKindWord(item, kind) {
  const cuisine = Array.isArray(item.cuisine) ? item.cuisine[0] : item.cuisine;
  if (kind === "restaurant") return cuisine ? titleWords(cuisine) : "Restaurant";
  const category = String(item.category || "").replace(/_/g, " ").trim();
  return category ? titleWords(category) : "Things to do";
}

function CatalogCard({ item, selected, onToggle, onOpen, kind, destination }) {
  const [broken, setBroken] = useState(false);
  const verifiedImage = broken ? null : safeImage(item);
  const meta = kind === "restaurant"
    ? [(item.category && !/^restaurant$/i.test(item.category) ? titleWords(String(item.category).replace(/_/g, " ")) : null) || (Array.isArray(item.cuisine) ? item.cuisine.slice(0, 2).join(" · ") : item.cuisine), item.neighborhood, item.rating ? `★ ${Number(item.rating).toFixed(1)}` : null, item.priceRange ? `${item.priceRange.currency} ${item.priceRange.low}${item.priceRange.high ? `–${item.priceRange.high}` : "+"} per person` : LEVEL_SIGN[item.priceLevel] || null]
    : [item.category ? String(item.category).replace(/_/g, " ") : null, item.rating ? `★ ${Number(item.rating).toFixed(1)}` : null, item.isFree ? "Free" : null];
  const description = item.description || (item.about ? item.about.split("\n")[0] : null);
  const sourceUrl = item.imageSourceUrl || item.imageLicenseMetadata?.sourcePageUrl || null;
  return <article className={`group relative flex flex-col overflow-hidden border border-black/8 transition duration-300 ${selected ? "bg-placeholder shadow-hover" : "bg-surface hover:bg-surface-sunken"}`}>
    <button type="button" onClick={() => onOpen(item)} aria-label={`About ${item.name}`} className="block w-full text-left">
      {verifiedImage ? <span className="relative block aspect-[4/3] overflow-hidden bg-placeholder">
        <Image src={verifiedImage} alt={item.imageIsExample ? `${item.exampleDish || item.cuisineLabel || "Food"}, an example dish` : `${item.name}, ${destination.city}`} fill sizes="(min-width:1280px) 22vw,(min-width:640px) 45vw,100vw" className="object-cover transition duration-700 motion-reduce:transition-none group-hover:scale-[1.02]" onError={() => setBroken(true)} />
        {selected ? <span className="absolute right-3 top-3"><SelectMark /></span> : null}
      </span> : <span aria-hidden="true" className={`relative flex aspect-[4/3] flex-col justify-end p-5 ${kind === "restaurant" ? "bg-[radial-gradient(120%_90%_at_100%_0%,#f3ece0_0%,#e6dccb_100%)]" : "bg-[radial-gradient(120%_90%_at_100%_0%,#eef0ea_0%,#dde2d8_100%)]"}`}><span className="font-serif text-[1.7rem] italic leading-none tracking-tight-2 text-black/55">{placeKindWord(item, kind)}</span><span className="mt-2 text-micro uppercase tracking-label text-black/45">{item.neighborhood || titleWords(destination.city)}</span>{selected ? <span className="absolute right-3 top-3"><SelectMark /></span> : null}</span>}
      <span className="block p-4 pb-3"><span className="block text-micro uppercase tracking-label text-ink">{meta.filter(Boolean).join(" · ")}</span><span className="mt-2 block font-serif text-[1.35rem] leading-[1.02] tracking-tight-2 group-hover:underline group-hover:decoration-black/30 group-hover:underline-offset-4">{item.name}</span>{description ? <span className="mt-2 block line-clamp-2 text-eyebrow leading-4 text-ink">{description}</span> : null}</span>
    </button>
    <div className="mt-auto flex items-center justify-between gap-3 px-4 pb-4">
      <button type="button" onClick={() => onToggle(item)} aria-pressed={selected} aria-label={`${selected ? "Remove" : "Add"} ${item.name} ${selected ? "from" : "to"} your trip`} className="inline-flex min-h-11 items-center text-micro font-medium uppercase tracking-label">{selected ? "Added to your trip ✓" : "Add to trip +"}</button>
      <button type="button" onClick={() => onOpen(item)} className="inline-flex min-h-11 items-center text-micro text-subtle underline underline-offset-4 hover:text-ink" aria-label={`Details about ${item.name}`}>Details</button>
    </div>
    {verifiedImage && sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener" title={item.imageCredit ? `Photo: ${item.imageCredit}, via Wikimedia Commons` : undefined} className="absolute left-2 top-2 z-10 inline-flex min-h-6 max-w-[calc(100%-1rem)] items-center bg-black/65 px-2 text-micro text-white"><span className="truncate">{item.imageIsExample ? "Example dish · " : "Photo: "}{item.imageCredit || "Wikimedia Commons"}</span>&nbsp;↗<span className="sr-only"> (opens in a new tab)</span></a> : null}
  </article>;
}

// Places collected in price tiers (scripts/activities/curate-places.mjs --tiers),
// shown cheapest first so the spread is plain.
const TIERS = {
  restaurant: [["budget", "Cheap eats", "$"], ["mid", "Mid-range", "$$"], ["high", "Splurge", "$$$"]],
  activity: [["free", "Free to explore", null], ["ticketed", "Museums and attractions", null]],
};
const LEVEL_SIGN = { PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };

function TierGroups({ items, kind, renderCard }) {
  const groups = TIERS[kind].map(([tier, label, sign]) => ({ tier, label, sign, items: items.filter((item) => item.tier === tier) })).filter((group) => group.items.length);
  const other = items.filter((item) => !TIERS[kind].some(([tier]) => tier === item.tier));
  if (other.length) groups.push({ tier: "other", label: kind === "restaurant" ? "More local favorites" : "More to see", sign: null, items: other.slice(0, 3) });
  return <div className="space-y-8">{groups.map((group) => <div key={group.tier}>
    <h3 className="mb-3 flex items-baseline gap-2 text-micro uppercase tracking-label">{group.label}{group.sign ? <span className="tabular text-subtle" aria-hidden="true">{group.sign}</span> : null}</h3>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.items.map(renderCard)}</div>
  </div>)}</div>;
}

function CuratedSection({ id, title, step, items, selections, onToggle, kind, destination, status, onRetry, initialLimit = null }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(null);
  const isSelected = (item) => selections.some((selected) => (selected.id || selected.name) === (item.id || item.name));
  const dialog = open ? <PlaceDetailsDialog item={open} kind={kind} destination={destination} selected={isSelected(open)} onToggle={onToggle} onClose={() => setOpen(null)} /> : null;
  // Nothing to show once loaded: leave the section out instead of an empty block.
  if (status === "ready" && !items.length) return null;
  const tiered = items.some((item) => item.tier);
  const card = (item) => <CatalogCard key={item.id || item.name} item={item} destination={destination} kind={kind} selected={isSelected(item)} onToggle={onToggle} onOpen={setOpen} />;
  if (status === "ready" && tiered) {
    return <section id={id} className="scroll-mt-24 border-t border-black/10 px-6 py-14 sm:px-12 sm:py-20" aria-labelledby={`${id}-heading`}><div className="mx-auto grid max-w-[1180px] gap-8"><header>{step ? <p className="eyebrow">{step}</p> : null}<h2 id={`${id}-heading`} className="mt-3 font-serif text-[clamp(2.2rem,3.6vw,3.4rem)] leading-[.95] tracking-tight-3">{title}</h2></header>
      <TierGroups items={items} kind={kind} renderCard={card} />
    </div>{dialog}</section>;
  }
  const visibleLimit = initialLimit ? (expanded ? Math.min(items.length, initialLimit * 2) : initialLimit) : items.length;
  const visibleItems = items.slice(0, visibleLimit);
  const noun = kind === "restaurant" ? "restaurants" : "experiences";
  return <section id={id} className="scroll-mt-24 border-t border-black/10 px-6 py-14 sm:px-12 sm:py-20" aria-labelledby={`${id}-heading`} aria-busy={status === "loading"}><div className="mx-auto grid max-w-[1180px] gap-8"><header>{step ? <p className="eyebrow">{step}</p> : null}<h2 id={`${id}-heading`} className="mt-3 font-serif text-[clamp(2.2rem,3.6vw,3.4rem)] leading-[.95] tracking-tight-3">{title}</h2></header>
    {status === "loading" ? <div role="status" className="grid min-h-56 place-items-center bg-surface-sunken text-sm text-ink">Loading {noun}…</div>
      : status === "error" ? <div role="alert" className="flex min-h-40 flex-col items-start justify-center gap-3 border-y border-black/15 py-7 text-sm"><p>We couldn&apos;t load {noun} just now.</p><button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center border border-black/25 px-4 hover:border-black">Try again</button></div>
      : <div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleItems.map(card)}</div>{initialLimit && items.length > initialLimit ? <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="mt-5 min-h-11 border-b border-black/25 pb-1 text-micro">{expanded ? `Show fewer ${noun}` : `Show all ${Math.min(items.length, initialLimit * 2)} ${noun}`}</button> : null}</div>}
  </div>{dialog}</section>;
}

const LOAD_TIMEOUT = 9000;

// One request per section, each with its own timeout and retry, so a slow
// dining lookup never holds up experiences (or the other way round).
function useCatalog(url, body, key) {
  const [state, setState] = useState({ status: "loading", items: [], attempt: 0 });
  const payload = JSON.stringify(body);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException("timeout", "TimeoutError")), LOAD_TIMEOUT);
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`status_${response.status}`))))
      .then((data) => setState((current) => ({ ...current, status: "ready", items: Array.isArray(data?.[key]) ? data[key] : [], extra: data })))
      .catch((error) => { if (controller.signal.reason?.name === "TimeoutError" || error?.name !== "AbortError") setState((current) => ({ ...current, status: "error", items: [] })); })
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); };
  }, [url, payload, key, state.attempt]);
  return { ...state, retry: () => setState((current) => ({ status: "loading", items: [], attempt: current.attempt + 1 })) };
}

export function CuratedTripChoices({ destination, quiz, restaurants, activities, onRestaurantsChange, onActivitiesChange, onCatalogChange }) {
  const destinationId = destination.id || destination.airport;
  const dining = useCatalog("/api/restaurants/recommend", { destinationId, spendStyle: quiz?.spendStyle || quiz?.answers?.spendStyle || null }, "restaurants");
  const experiences = useCatalog("/api/activities/recommend", { destinationId, quiz }, "activities");
  useEffect(() => { onCatalogChange?.({ restaurants: dining.items, activities: experiences.items }); }, [dining.items, experiences.items, onCatalogChange]);
  function toggle(item, selected, update) { update(selected.some((current) => (current.id || current.name) === (item.id || item.name)) ? selected.filter((current) => (current.id || current.name) !== (item.id || item.name)) : [...selected, item]); }
  return <>
    <CuratedSection id="dining" step="03 · Where to eat" title="Restaurants" items={dining.items} status={dining.status} onRetry={dining.retry} selections={restaurants} onToggle={(item) => toggle(item, restaurants, onRestaurantsChange)} kind="restaurant" destination={destination} initialLimit={3} />
    <CuratedSection id="experiences" step="04 · What to do" title="Experiences" items={experiences.items} status={experiences.status} onRetry={experiences.retry} selections={activities} onToggle={(item) => toggle(item, activities, onActivitiesChange)} kind="activity" destination={destination} initialLimit={3} />
    <BookableTours tours={experiences.extra?.bookable || []} destination={destination} />
  </>;
}

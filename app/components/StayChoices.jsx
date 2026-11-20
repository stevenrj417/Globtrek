"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { bookingPropertyUrl } from "../data/destinations";
import { BookingLogo } from "./PartnerLogo";
import { cjDestinationStaysUrl } from "../lib/booking/cj";

const STALE_DAYS = 21;

function formatDay(value) {
  if (!value) return null;
  const time = Date.parse(String(value).length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isFinite(time) ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(time)) : null;
}

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function kindLabel(stay) {
  const type = stay.dorms && (!stay.category || stay.category === "Hotel") ? "Hostel" : stay.category || null;
  return [type, stay.starRating ? `${stay.starRating}-star` : null].filter(Boolean).join(" · ");
}

// Rooms Booking.com should search for, matching the estimate: the priced rooms,
// one for a dorm stay, otherwise one private room per two travelers.
export function stayLinkContext(trip, stay) {
  const travelers = Math.max(1, (Number(trip?.adults) || Number.parseInt(trip?.guestCount, 10) || 1) + (Number(trip?.children) || 0));
  const rooms = stay?.price?.unit === "room" ? stay.price.units : stay?.price?.unit === "bed" || stay?.dorms ? 1 : Math.ceil(travelers / 2);
  return { ...trip, roomCount: String(rooms) };
}

// One stay: photo, name, kind and distance, rating, and a price marked when it is
// an estimate. Facts come from the catalog only.
function StayCard({ stay, destination, trip, selected, onSelect, priority }) {
  const url = bookingPropertyUrl({ ...stay, providerLinkVerified: true }, stayLinkContext(trip, stay));
  const photo = stay.photos?.[0] || stay.image;
  const price = stay.price;
  const scale = Number(stay.rating) > 5 ? 10 : 5;
  const meta = [kindLabel(stay), stay.distanceKm !== null && stay.distanceKm !== undefined ? `${stay.distanceKm} km from center` : stay.neighborhood].filter(Boolean).join(" · ");
  return <li className="flex flex-col">
    <div className={`relative aspect-[4/3] overflow-hidden bg-placeholder ${selected ? "outline outline-2 outline-offset-4 outline-black" : ""}`}>
      {photo ? <Image src={photo} alt={`${stay.name}, photo from Booking.com`} fill priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /> : null}
      <span className="absolute left-3 top-3 bg-canvas px-2.5 py-1 text-micro font-medium uppercase tracking-label">{stay.role}</span>
    </div>
    <div className="flex flex-1 flex-col pt-5">
      <h3 className="font-serif text-2xl leading-[1.05] tracking-tight-2">{stay.name}</h3>
      {meta ? <p className="mt-2 text-sm">{meta}</p> : null}
      {stay.rating && stay.reviewCount ? <p className="tabular mt-1 text-sm">{Number(stay.rating).toFixed(1)}/{scale} · {Number(stay.reviewCount).toLocaleString("en-US")} reviews</p> : null}
      {price && price.kind !== "unavailable" ? <p className="tabular mt-4 font-serif text-2xl">{money(price.total)} <span className="font-sans text-sm">for {price.nights} night{price.nights === 1 ? "" : "s"}{price.kind === "estimate" ? ", estimated" : price.kind === "observed" ? ", recent price" : ""}</span></p> : null}
      <div className="mt-auto flex items-center justify-between gap-4 pt-5">
        <button type="button" aria-pressed={selected} onClick={() => onSelect(stay)} className={`inline-flex min-h-11 items-center gap-2 px-5 text-micro uppercase tracking-label ${selected ? "border border-black" : "bg-black text-white"}`}>{selected ? "Selected" : "Select"}<span aria-hidden="true">{selected ? "✓" : "→"}</span></button>
        {url ? <a href={url} target="_blank" rel="noopener sponsored" aria-label={`${stay.name} on Booking.com (opens in a new tab)`} onClick={() => track("stay_partner_opened", { destination: destination.city, role: stay.role })} className="inline-flex min-h-11 items-center gap-1.5 text-sm underline underline-offset-4"><BookingLogo className="h-3 w-auto" /> ↗</a> : null}
      </div>
    </div>
  </li>;
}

// Three more stays at each price tier, compact, for comparing beyond the main three.
const STAY_TIERS = [["budget", "Budget", "Hostels, guest houses and simple hotels"], ["mid", "Mid-range", "Three-star hotels, inns and B&Bs"], ["upscale", "Upscale", "Four- and five-star hotels"]];

function TierStays({ tiers, destination, trip, selectedStayId, onSelected }) {
  const groups = STAY_TIERS.map(([tier, label, hint]) => ({ tier, label, hint, stays: tiers?.[tier] || [] })).filter((group) => group.stays.length);
  if (!groups.length) return null;
  return <div className="mt-12 border-t border-black/10 pt-8">
    <h3 className="font-serif text-2xl leading-tight tracking-tight-2">Compare by price</h3>
    <div className="mt-6 grid gap-8 lg:grid-cols-3">{groups.map((group) => <div key={group.tier}>
      <p className="text-micro uppercase tracking-label">{group.label}</p>
      <p className="mt-1 text-xs text-subtle">{group.hint}</p>
      <ul className="mt-3 divide-y divide-black/10 border-y border-black/10">{group.stays.map((stay) => {
        const url = bookingPropertyUrl({ ...stay, providerLinkVerified: true }, stayLinkContext(trip, stay));
        const scale = Number(stay.rating) > 5 ? 10 : 5;
        const selected = stay.id === selectedStayId;
        return <li key={stay.id} className="flex gap-3 py-3">
          {stay.image ? <span className="relative h-16 w-20 shrink-0 overflow-hidden bg-placeholder"><Image src={stay.image} alt={`${stay.name}, photo from Booking.com`} fill sizes="80px" className="object-cover" /></span> : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{stay.name}</span>
            <span className="block text-xs text-subtle">{[kindLabel(stay), stay.rating && stay.reviewCount ? `${Number(stay.rating).toFixed(1)}/${scale}` : null, stay.distanceKm !== null && stay.distanceKm !== undefined ? `${stay.distanceKm} km from center` : null].filter(Boolean).join(" · ")}</span>
            <span className="mt-1 flex items-center gap-4 text-xs">
              <button type="button" aria-pressed={selected} onClick={() => { onSelected({ ...stay, role: group.label }, { automatic: false }); track("hotel_selected", { destination: destination.city, role: `tier_${group.tier}` }); }} className="min-h-8 underline underline-offset-4">{selected ? "Selected ✓" : "Select"}</button>
              {url ? <a href={url} target="_blank" rel="noopener sponsored" aria-label={`${stay.name} on Booking.com (opens in a new tab)`} onClick={() => track("stay_partner_opened", { destination: destination.city, role: `tier_${group.tier}` })} className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4"><BookingLogo className="h-2.5 w-auto" /> ↗</a> : null}
            </span>
          </span>
        </li>;
      })}</ul>
    </div>)}</div>
  </div>;
}

// No checked stays for this place yet: hand off to a Booking.com search with the trip's dates and party.
function EmptyStays({ destination, trip }) {
  const city = String(destination.city || "").toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (letter) => letter.toUpperCase());
  const adults = Math.max(1, Number(trip?.adults) || Number.parseInt(trip?.guestCount, 10) || 2);
  const url = cjDestinationStaysUrl(destination, { dates: { start: trip?.tripStart, end: trip?.tripEnd }, travelers: { adults, children: Number(trip?.children) || 0 } });
  if (!url) return null;
  return <p className="mt-3 text-sm">We haven&apos;t checked stays in {city} yet. <a href={url} target="_blank" rel="noopener sponsored" onClick={() => track("stay_search_opened", { destination: destination.city })} className="whitespace-nowrap text-ink underline decoration-black/25 underline-offset-4">Search stays on <BookingLogo className="mx-0.5 inline h-3 w-auto align-baseline" /> →</a></p>;
}

export function StayChoices({ destination, tripContext, selectedStayId, onSelected }) {
  const [state, setState] = useState({ status: "loading", hotels: [], notice: null, catalog: null });
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const destinationId = destination.id || destination.airport;
  const contextKey = JSON.stringify({ s: tripContext.tripStart, e: tripContext.tripEnd, f: tripContext.isFlexible, g: tripContext.guestCount, h: tripContext.answers?.hotel, p: tripContext.answers?.spendStyle, o: tripContext.originAirport });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hotels/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId, quiz: tripContext, accessibleOnly }), signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("unavailable"); return response.json(); })
      .then((payload) => {
        const checked = payload.catalog?.checkedAt ? Date.parse(`${payload.catalog.checkedAt}T00:00:00Z`) : null;
        setState({ status: "ready", hotels: Array.isArray(payload.hotels) ? payload.hotels : [], tiers: payload.tiers || null, notice: payload.notice || null, catalog: payload.catalog || null, stale: Boolean(checked && Date.now() - checked > STALE_DAYS * 86400000) });
      })
      .catch((error) => { if (error.name !== "AbortError") setState({ status: "error", hotels: [], notice: null, catalog: null }); });
    return () => controller.abort();
  }, [destinationId, contextKey, accessibleOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the chosen stay when it is still on the list; otherwise choose Our pick.
  useEffect(() => {
    // "I already have a place to stay" holds until the traveler picks a stay.
    if (state.status !== "ready" || !state.hotels.length || selectedStayId === "none") return;
    const current = [...state.hotels, ...Object.values(state.tiers || {}).flat()].find((stay) => stay.id === selectedStayId);
    onSelected(current || state.hotels[0], { automatic: !current });
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const stale = state.stale;
  return <section id="hotel-selection" className="scroll-mt-20 border-t border-black/15 px-6 py-10 sm:px-12 sm:py-14" aria-labelledby="stay-heading">
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="stay-heading" className="font-serif text-[clamp(2rem,3.2vw,3rem)] leading-[.95] tracking-tight-3">Stays</h2>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={accessibleOnly} onChange={(event) => setAccessibleOnly(event.target.checked)} className="h-4 w-4 accent-black" />
          Accessible stays only
        </label>
      </div>
      <div aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" ? <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading stays">{[0, 1, 2].map((item) => <li key={item} className="h-[520px] animate-pulse bg-placeholder motion-reduce:animate-none" />)}</ul> : null}
        {state.status === "error" ? <p className="mt-6 border border-black/15 bg-surface p-5 text-sm">Stays aren&apos;t loading right now. Try again in a moment.</p> : null}
        {state.status === "ready" && state.hotels.length ? <ul className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{state.hotels.map((stay, index) => <StayCard key={stay.id} stay={stay} destination={destination} trip={tripContext} selected={stay.id === selectedStayId} onSelect={(choice) => { onSelected(choice, { automatic: false }); track("hotel_selected", { destination: destination.city, role: choice.role }); }} priority={index === 0} />)}</ul> : null}
        {state.status === "ready" && state.notice && (state.hotels.length || accessibleOnly) ? <p className="mt-4 text-sm">{state.notice}</p> : null}
        {state.status === "ready" && !state.hotels.length && !accessibleOnly ? <EmptyStays destination={destination} trip={tripContext} /> : null}
        {state.status === "ready" && state.hotels.length ? <TierStays tiers={state.tiers} destination={destination} trip={tripContext} selectedStayId={selectedStayId} onSelected={onSelected} /> : null}
              </div>
      {state.status === "ready" && !state.hotels.length ? null : <p className="mt-8 text-xs">From Booking.com{state.catalog?.checkedAt ? ` on ${formatDay(state.catalog.checkedAt)}` : ""}. Not live availability.{stale ? " Over three weeks old." : ""}</p>}
      <button type="button" onClick={() => onSelected({ id: "none", type: "none", name: "No hotel needed" }, { automatic: false })} className="mt-2 min-h-11 text-sm underline underline-offset-4">I already have a place to stay</button>
    </div>
  </section>;
}

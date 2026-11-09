"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { bookingPropertyUrl } from "../data/destinations";
import { PRICE_KIND_LABEL } from "../lib/pricing/stayPrice";
import { BookingLogo } from "./PartnerLogo";

const STALE_DAYS = 21;

function formatDay(value) {
  if (!value) return null;
  const time = Date.parse(String(value).length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isFinite(time) ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(time)) : null;
}

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function typeLabel(stay) {
  const type = stay.dorms && (!stay.category || stay.category === "Hotel") ? "Hostel" : stay.category || "Stay";
  return [type, stay.starRating ? `${stay.starRating}-star` : null].filter(Boolean).join(" · ");
}

function locationLabel(stay, destination) {
  const place = stay.neighborhood || stay.address?.split(",").slice(0, 2).join(",") || destination.city;
  return stay.distanceKm !== null && stay.distanceKm !== undefined ? `${place} · ${stay.distanceKm} km from the center` : place;
}

// Rooms Booking.com should search for, matching the estimate: the priced rooms,
// one for a dorm stay, otherwise one private room per two travelers.
export function stayLinkContext(trip, stay) {
  const travelers = Math.max(1, (Number(trip?.adults) || Number.parseInt(trip?.guestCount, 10) || 1) + (Number(trip?.children) || 0));
  const rooms = stay?.price?.unit === "room" ? stay.price.units : stay?.price?.unit === "bed" || stay?.dorms ? 1 : Math.ceil(travelers / 2);
  return { ...trip, roomCount: String(rooms) };
}

function PriceBlock({ price }) {
  return <div className="mt-4 border-t border-black/12 pt-4">
    <p className="text-micro uppercase tracking-label text-black/50">{PRICE_KIND_LABEL[price.kind]}</p>
    {price.kind === "unavailable"
      ? <p className="mt-1 text-sm">Check the current price and availability on Booking.com.</p>
      : <>
        <p className="tabular mt-1 font-serif text-xl">{money(price.total)} <span className="font-sans text-xs text-black/55">for {price.nights} night{price.nights === 1 ? "" : "s"}</span></p>
        <p className="tabular mt-1 text-xs text-black/60">{price.math}</p>
        <p className="mt-1 text-xs leading-5 text-black/55">{price.detail}</p>
      </>}
  </div>;
}

function StayCard({ stay, destination, trip, selected, onSelect, priority }) {
  const url = bookingPropertyUrl({ ...stay, providerLinkVerified: true }, stayLinkContext(trip, stay));
  const photo = stay.photos?.[0] || stay.image;
  const updated = formatDay(stay.dataUpdatedAt || stay.importedAt);
  const amenities = [stay.catalogFreeWifi ? "Free Wi-Fi" : null, stay.catalogFreeBreakfast ? "Breakfast on some rates" : null, stay.catalogFreeCancellation ? "Free cancellation on some rates" : null, ...(stay.amenities || []).filter((item) => /air conditioning|24-hour front desk|lockers|kitchen|laundry|private bathroom/i.test(item)).slice(0, 2)].filter(Boolean).slice(0, 4);
  const accessibility = (stay.accessibility || []).slice(0, 3);
  const rooms = (stay.roomTypes || []).slice(0, 2);
  return <li className={`flex flex-col border bg-white ${selected ? "border-black shadow-overlay" : "border-black/15"}`}>
    <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">
      {photo ? <Image src={photo} alt={`${stay.name}, photo from Booking.com`} fill priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /> : <span className="grid h-full place-items-center text-micro tracking-label text-black/45">PHOTO NOT AVAILABLE</span>}
      <span className="absolute left-3 top-3 bg-canvas/95 px-2.5 py-1 text-micro font-medium uppercase tracking-label">{stay.role}</span>
    </div>
    <div className="flex flex-1 flex-col p-5">
      <p className="text-micro uppercase tracking-label text-black/50">{typeLabel(stay)}</p>
      <h3 className="mt-2 font-serif text-2xl leading-[1.05] tracking-tight-2">{stay.name}</h3>
      <p className="mt-1 text-xs text-black/55">{locationLabel(stay, destination)}</p>
      {stay.rating && stay.reviewCount ? <p className="tabular mt-1 text-xs">{Number(stay.rating).toFixed(1)} / {Number(stay.rating) > 5 ? 10 : 5} · {Number(stay.reviewCount).toLocaleString("en-US")} {stay.ratingSource || "guest"} reviews · checked {formatDay(stay.dataUpdatedAt) || "recently"}</p> : null}
      <p className="mt-3 text-sm leading-6">{stay.why}</p>
      {amenities.length ? <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">{amenities.map((item) => <li key={item} className="border border-black/15 px-2 py-0.5">{item}</li>)}</ul> : null}
      {rooms.length ? <p className="mt-3 text-xs text-black/60">Rooms: {rooms.join(" · ")}{stay.roomTypes.length > 2 ? ` · +${stay.roomTypes.length - 2} more` : ""}</p> : null}
      {accessibility.length ? <p className="mt-1 text-xs text-black/60">Accessibility: {accessibility.join(" · ")}</p> : null}
      <PriceBlock price={stay.price} />
      <div className="mt-auto pt-5">
        <button type="button" aria-pressed={selected} onClick={() => onSelect(stay)} className={`flex min-h-11 w-full items-center justify-between px-4 text-micro uppercase tracking-label ${selected ? "border border-black bg-transparent" : "bg-black text-white"}`}>{selected ? "Selected for your trip" : "Select this stay"}<span aria-hidden="true">{selected ? "✓" : "→"}</span></button>
        {url ? <a href={url} target="_blank" rel="noopener sponsored" onClick={() => track("stay_partner_opened", { destination: destination.city, role: stay.role })} className="mt-3 inline-flex min-h-11 items-center text-sm underline decoration-black/30 underline-offset-4 hover:decoration-ink">Check price and availability on <BookingLogo className="mx-1 h-3 w-auto" /> ↗</a> : null}
        {updated ? <p className="mt-1 text-micro text-black/45">Property details updated {updated}</p> : null}
      </div>
    </div>
  </li>;
}

// Three stays for the trip (Our pick, Best value, Upgrade), each with only the
// facts the catalog supports and a price labeled by where it came from.
export function StayChoices({ destination, tripContext, selectedStayId, onSelected, budgetLodging }) {
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
        setState({ status: "ready", hotels: Array.isArray(payload.hotels) ? payload.hotels : [], notice: payload.notice || null, catalog: payload.catalog || null, stale: Boolean(checked && Date.now() - checked > STALE_DAYS * 86400000) });
      })
      .catch((error) => { if (error.name !== "AbortError") setState({ status: "error", hotels: [], notice: null, catalog: null }); });
    return () => controller.abort();
  }, [destinationId, contextKey, accessibleOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the chosen stay when it is still on the list; otherwise choose Our pick.
  useEffect(() => {
    // "I already have a place to stay" holds until the traveler picks a stay.
    if (state.status !== "ready" || !state.hotels.length || selectedStayId === "none") return;
    const current = state.hotels.find((stay) => stay.id === selectedStayId);
    onSelected(current || state.hotels[0], { automatic: !current });
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const stale = state.stale;
  return <section id="hotel-selection" className="scroll-mt-20 border-t border-black/15 px-6 py-8 sm:px-12 sm:py-10" aria-labelledby="stay-heading">
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-micro uppercase tracking-editorial">01 &nbsp;&nbsp; Your stay</p>
          <h2 id="stay-heading" className="mt-3 font-serif text-[clamp(2rem,3vw,2.75rem)] leading-[.94] tracking-tight-2">Three places to sleep</h2>
          {budgetLodging?.total ? <p className="tabular mt-3 max-w-xl text-xs leading-5 text-black/60">Your estimate counts {money(budgetLodging.perUnit)} × {budgetLodging.units} {budgetLodging.unit}{budgetLodging.units === 1 ? "" : "s"} × {budgetLodging.nights} night{budgetLodging.nights === 1 ? "" : "s"} = {money(budgetLodging.total)} for lodging{budgetLodging.source ? ` (${budgetLodging.source})` : ""}.</p> : null}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={accessibleOnly} onChange={(event) => setAccessibleOnly(event.target.checked)} className="h-4 w-4 accent-black" />
          Only stays that list accessibility features
        </label>
      </div>
      <div aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "loading" ? <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading stays">{[0, 1, 2].map((item) => <li key={item} className="h-[520px] animate-pulse bg-placeholder motion-reduce:animate-none" />)}</ul> : null}
        {state.status === "error" ? <p className="mt-6 border border-black/15 bg-surface p-5 text-sm">Stays are temporarily unavailable. Your trip estimate still includes lodging; try again in a moment.</p> : null}
        {state.status === "ready" && state.hotels.length ? <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{state.hotels.map((stay, index) => <StayCard key={stay.id} stay={stay} destination={destination} trip={tripContext} selected={stay.id === selectedStayId} onSelect={(choice) => { onSelected(choice, { automatic: false }); track("hotel_selected", { destination: destination.city, role: choice.role }); }} priority={index === 0} />)}</ul> : null}
        {state.status === "ready" && state.notice ? <p className="mt-4 text-sm text-black/60">{state.notice}</p> : null}
      </div>
      <p className="mt-5 text-xs leading-5 text-black/55">Property details come from <BookingLogo className="mx-0.5 h-3 w-auto" />&apos;s catalog{state.catalog?.checkedAt ? `, updated ${formatDay(state.catalog.checkedAt)}` : ""}. They aren&apos;t live availability or a confirmed room. &quot;On some rates&quot; means Booking.com offers it on at least one rate; check the terms of the rate you book.{stale ? " These details are more than three weeks old." : ""}</p>
      <button type="button" onClick={() => onSelected({ id: "none", type: "none", name: "No hotel needed" }, { automatic: false })} className="mt-3 min-h-11 text-xs text-black/55 underline decoration-black/25 underline-offset-4">I already have a place to stay</button>
    </div>
  </section>;
}

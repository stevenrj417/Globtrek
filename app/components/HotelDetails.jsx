"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookingLogo } from "./PartnerLogo";
import { ExploreMap } from "./ExploreMap";

const large = (url) => String(url || "").replace("/max500/", "/max1024x768/");

function Stars({ value }) {
  const full = Math.round(Number(value) || 0);
  return <span aria-label={`${value} out of 5`} className="tracking-[0.1em]">{"★".repeat(full)}<span className="opacity-25">{"★".repeat(Math.max(0, 5 - full))}</span></span>;
}

// Facilities the hotel lists, and the common ones it doesn't.
export function AmenityChecklist({ checklist }) {
  if (!checklist?.length) return null;
  const has = checklist.filter((item) => item.has);
  const missing = checklist.filter((item) => !item.has);
  return <div className="grid gap-8 sm:grid-cols-2">
    <div>
      <p className="text-micro font-medium uppercase tracking-label">Has</p>
      <ul className="mt-3 space-y-2 text-sm">{has.map((item) => <li key={item.label} className="flex gap-2"><span aria-hidden="true">✓</span><span>{item.label}{item.note ? <span className="font-medium">, {item.note.toLowerCase()}</span> : null}</span></li>)}</ul>
    </div>
    {missing.length ? <div>
      <p className="text-micro font-medium uppercase tracking-label">Not listed</p>
      <ul className="mt-3 space-y-2 text-sm">{missing.map((item) => <li key={item.label} className="flex gap-2 line-through decoration-black/40"><span aria-hidden="true" className="no-underline">✕</span><span>{item.label}</span></li>)}</ul>
    </div> : null}
  </div>;
}

// Google rating and up to five reviews, with the attribution Google requires.
export function GoogleReviews({ google }) {
  if (!google?.rating) return <p className="text-sm">No Google rating found for this hotel.</p>;
  return <div>
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <p className="tabular font-serif text-5xl">{google.rating.toFixed(1)}</p>
      <p className="text-sm"><Stars value={google.rating} /><br />{google.count ? `${google.count.toLocaleString("en-US")} reviews on Google` : "Google rating"}</p>
    </div>
    {google.reviews?.length ? <ul className="mt-6 space-y-6">{google.reviews.map((review, index) => <li key={index} className="border-t border-black/10 pt-5">
      <div className="flex items-center gap-3">
        {review.authorPhoto ? <Image src={review.authorPhoto} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-full" /> : null}
        <p className="text-sm font-medium">{review.authorUrl ? <a href={review.authorUrl} target="_blank" rel="noopener nofollow" className="hover:underline">{review.author}</a> : review.author}</p>
        <p className="ml-auto text-xs">{review.rating ? <Stars value={review.rating} /> : null}{review.when ? ` · ${review.when}` : ""}</p>
      </div>
      <p className="mt-3 line-clamp-6 text-sm leading-6">{review.text}</p>
    </li>)}</ul> : null}
    <p className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs"><span>Rating and reviews from Google</span>{google.url ? <a href={google.url} target="_blank" rel="noopener" className="underline">Read all reviews on Google Maps ↗</a> : null}</p>
  </div>;
}

export function useHotelDetails(id) {
  const [state, setState] = useState({ status: id ? "loading" : "idle", data: null });
  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();
    fetch(`/api/hotels/${encodeURIComponent(id)}/details`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("unavailable"))))
      .then((data) => setState({ status: "ready", data }))
      .catch((error) => { if (error.name !== "AbortError") setState({ status: "error", data: null }); });
    return () => controller.abort();
  }, [id]);
  return state;
}

// Reviews and the checklist on a hotel's own page, loaded after the page.
export function HotelLiveDetails({ id }) {
  const { status, data } = useHotelDetails(id);
  if (status === "loading") return <div className="h-48 animate-pulse bg-placeholder motion-reduce:animate-none" aria-label="Loading reviews" />;
  if (status !== "ready") return null;
  return <GoogleReviews google={data.google} />;
}

// Plain facts from the listing, as short tiles.
function GoodToKnow({ facts }) {
  if (!facts) return null;
  const tiles = [
    facts.freeCancellation ? ["Free cancellation", "On some rooms"] : null,
    facts.freeBreakfast ? ["Breakfast", "Included on some rooms"] : null,
    facts.freeWifi ? ["Wi-Fi", "Free"] : null,
    facts.maxGuests ? ["Sleeps", `Up to ${facts.maxGuests}`] : null,
    facts.bedrooms ? ["Bedrooms", String(facts.bedrooms)] : null,
    facts.bathrooms ? ["Bathrooms", String(facts.bathrooms)] : null,
    facts.beds ? ["Beds", facts.beds] : null,
    facts.dorms ? ["Dorm beds", "Shared rooms available"] : null,
  ].filter(Boolean);
  if (!tiles.length) return null;
  return <><h3 className="mt-12 font-serif text-2xl tracking-tight-2">Good to know</h3>
    <dl className="mt-5 grid grid-cols-2 gap-px bg-black/10 sm:grid-cols-3">{tiles.map(([label, value]) => <div key={label} className="bg-bg p-4"><dt className="text-micro uppercase tracking-label text-subtle">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>)}</dl></>;
}

// The listing's description, a few lines with "Read more".
function AboutText({ text }) {
  const [more, setMore] = useState(false);
  const long = text.length > 480;
  return <>
    <p className={`mt-4 whitespace-pre-line text-sm leading-7 ${long && !more ? "line-clamp-6" : ""}`}>{text}</p>
    {long ? <button type="button" onClick={() => setMore(!more)} className="mt-2 min-h-11 text-sm underline underline-offset-4">{more ? "Show less" : "Read more"}</button> : null}
  </>;
}

// The pop-up for one hotel on the results page.
export function HotelDetailsDialog({ id, name, bookingUrl, onClose }) {
  const { status, data } = useHotelDetails(id);
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [onClose]);
  const hotel = data?.hotel;
  return createPortal(<div className="fixed inset-0 z-[120] flex justify-end bg-black/35 backdrop-blur-[2px]" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-label={name} onMouseDown={(event) => event.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto overscroll-contain bg-bg shadow-overlay">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-black/10 bg-bg/95 px-6 py-4 backdrop-blur sm:px-10">
        <p className="truncate font-serif text-xl">{name}</p>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 shrink-0 place-items-center text-2xl font-light">×</button>
      </div>
      {status === "loading" ? <div className="space-y-4 p-6 sm:p-10"><div className="aspect-[4/3] animate-pulse bg-placeholder" /><div className="h-40 animate-pulse bg-placeholder" /></div> : null}
      {status === "error" ? <p className="p-6 text-sm sm:p-10">This hotel&apos;s details didn&apos;t load. {bookingUrl ? <a href={bookingUrl} target="_blank" rel="noopener sponsored" className="underline">See it on Booking.com ↗</a> : null}</p> : null}
      {hotel ? <div className="px-6 pb-12 sm:px-10">
        {hotel.photos?.length ? <div className="-mx-6 mt-0 flex snap-x snap-mandatory gap-1 overflow-x-auto [scrollbar-width:none] sm:-mx-10">{hotel.photos.map((photo, index) => <div key={photo} className="relative aspect-[4/3] w-[88%] shrink-0 snap-start bg-placeholder"><Image src={index ? photo : large(photo)} alt={`${hotel.name}, photo ${index + 1} from Booking.com`} fill sizes="640px" className="object-cover" /></div>)}</div> : null}
        <p className="mt-2 text-xs">Photos from <BookingLogo className="inline h-3 w-auto align-baseline" />. Swipe for more.</p>
        <p className="mt-8 text-micro uppercase tracking-label">{[hotel.stars ? `${hotel.stars}-star` : null, hotel.category, hotel.city].filter(Boolean).join(" · ")}</p>
        <h2 className="mt-2 font-serif text-4xl leading-none tracking-tight-3">{hotel.name}</h2>
        {hotel.street ? <p className="mt-2 text-sm">{hotel.street}</p> : null}
        {bookingUrl ? <a href={bookingUrl} target="_blank" rel="noopener sponsored" className="mt-6 inline-flex min-h-12 items-center gap-2 bg-black px-6 text-micro font-medium uppercase tracking-label text-white">See rooms on <BookingLogo className="h-3 w-auto invert" /> ↗</a> : null}

        {data.reviews ? <><h3 className="mt-12 font-serif text-2xl tracking-tight-2">What guests say</h3>
        <div className="mt-5"><GoogleReviews google={data.google} /></div></> : null}

        <GoodToKnow facts={hotel.facts} />

        {hotel.description ? <><h3 className="mt-12 font-serif text-2xl tracking-tight-2">About it</h3><AboutText text={hotel.description} /></> : null}

        {hotel.roomTypes?.length ? <><h3 className="mt-12 font-serif text-2xl tracking-tight-2">Rooms</h3>
        <ul className="mt-5 divide-y divide-black/10 border-y border-black/10 text-sm">{hotel.roomTypes.map((room) => <li key={room} className="py-3">{room}</li>)}</ul>
        <p className="mt-3 text-xs leading-5">Room types on the hotel&apos;s listing. Prices and what&apos;s free for your dates are on Booking.com.</p></> : null}

        <h3 className="mt-12 font-serif text-2xl tracking-tight-2">The basics</h3>
        <div className="mt-5"><AmenityChecklist checklist={hotel.checklist} /></div>
        <p className="mt-5 text-xs leading-5">From the hotel&apos;s Booking.com listing. &ldquo;Not listed&rdquo; means the listing doesn&apos;t mention it; ask the hotel if it matters.</p>

        {hotel.amenities?.length ? <details className="group mt-10 border-t border-black/10 pt-5">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-serif text-2xl tracking-tight-2">All {hotel.amenities.length} facilities<span aria-hidden="true" className="inline-block text-xl transition group-open:rotate-45">+</span></summary>
          <ul className="mt-4 columns-1 gap-8 text-sm leading-7 sm:columns-2">{hotel.amenities.map((item) => <li key={item} className="break-inside-avoid">{item}</li>)}</ul>
        </details> : null}

        {hotel.accessibility?.length ? <><h3 className="mt-12 font-serif text-2xl tracking-tight-2">Accessibility</h3>
        <ul className="mt-4 columns-1 gap-8 text-sm leading-7 sm:columns-2">{hotel.accessibility.map((item) => <li key={item} className="break-inside-avoid">{item}</li>)}</ul></> : null}

        {hotel.dining && !/^restaurant\s*#?\d*$/i.test(hotel.dining.trim()) ? <><h3 className="mt-12 font-serif text-2xl tracking-tight-2">Eat and drink here</h3><p className="mt-4 text-sm leading-6">{hotel.dining}</p></> : null}

        <h3 className="mt-12 font-serif text-2xl tracking-tight-2">Where it is</h3>
        <ExploreMap className="mt-5" latitude={hotel.latitude} longitude={hotel.longitude} label={hotel.name} query={[hotel.name, hotel.city].filter(Boolean).join(", ")} zoomKm={1.2} height="h-[300px]" />
      </div> : null}
    </section>
  </div>, document.body);
}

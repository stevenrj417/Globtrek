"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import Image from "../../components/Photo";
import { Chip, PhotoCredit, Stars, textLink } from "../../components/TravelPage";
import { BookingLogo } from "../../components/PartnerLogo";
import { tripPath } from "../../lib/anyplace/trip";

const PRICE = { PRICE_LEVEL_FREE: "Free", PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };
const km = (value) => (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10);
const storageKey = (placeId, budget) => `globtrek:trip:${placeId}:${budget}`;

function Heading({ id, eyebrow, title, intro, children }) {
  return <section id={id} aria-labelledby={`${id}-heading`} className="mx-auto mt-[var(--section-space)] max-w-[1280px] scroll-mt-24 px-5 sm:px-8">
    <p className="eyebrow mb-3">{eyebrow}</p>
    <h2 id={`${id}-heading`} className="font-serif text-3xl font-normal tracking-tight-3 sm:text-5xl">{title}</h2>
    {intro ? <p className="mt-4 max-w-[var(--width-reading)] text-base leading-7 text-ink">{intro}</p> : null}
    {children}
  </section>;
}

function Row({ children }) {
  return <ul className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 lg:grid-cols-3">{children}</ul>;
}

// A Google Maps photo: loaded straight from Google (never copied into our image
// cache), small and lazy so the page stays quick, with the author's credit.
function GooglePhoto({ photo, alt, eager = false }) {
  if (!photo?.url) return <span className="grid h-full place-items-center p-8 text-center font-serif text-2xl leading-tight text-subtle">{alt}</span>;
  return <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={photo.url} alt={alt} width={800} height={600} loading={eager ? "eager" : "lazy"} decoding="async" className="image-calm absolute inset-0 h-full w-full object-cover" />
    <PhotoCredit credit={photo.artist ? { artist: photo.artist, source: photo.source } : null} />
  </>;
}

function AddButton({ added, onClick, label, addedLabel }) {
  return <button type="button" onClick={onClick} aria-pressed={added} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 border px-4 text-micro font-medium uppercase tracking-label transition-colors ${added ? "border-black bg-black text-white" : "border-black/25 hover:border-black"}`}>
    <span aria-hidden="true">{added ? "✓" : "+"}</span>{added ? addedLabel : label}
  </button>;
}

function StayCard({ stay, index, chosen, onChoose, townKm, name, labels }) {
  const chips = [stay.stars ? `${stay.stars}-star ${String(stay.category || "stay").toLowerCase()}` : stay.category, stay.dorms ? "Dorm beds" : null, ...(stay.themes || []).map((theme) => labels[theme])].filter(Boolean);
  const tags = [stay.freeCancellation ? "Free cancellation on some rooms" : null, stay.freeBreakfast ? "Breakfast on some rooms" : null].filter(Boolean);
  return <li className={`flex w-[78%] shrink-0 snap-start flex-col sm:w-auto ${chosen ? "outline outline-2 outline-offset-8 outline-black" : ""}`}>
    <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
      {stay.photo ? <Image src={stay.photo} alt={`${stay.name}, photo from Booking.com`} fill className="image-calm object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw" loading={index < 2 ? "eager" : "lazy"} /> : null}
      {chips.length ? <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{chosen ? <Chip dark>Your stay</Chip> : null}{chips.map((chip) => <Chip key={chip}>{chip}</Chip>)}</div> : null}
    </div>
    <div className="flex flex-1 flex-col pt-4">
      <h3 className="text-xl font-medium leading-snug tracking-tight-2">{stay.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-ink">{[stay.street, stay.city].filter(Boolean).join(" · ")}</p>
      {stay.sleeps || stay.bedrooms ? <p className="tabular mt-2 text-sm">{[stay.sleeps ? `Sleeps ${stay.sleeps}` : null, stay.bedrooms ? `${stay.bedrooms} bedroom${stay.bedrooms === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ")}</p> : null}
      {stay.km > townKm ? <p className="tabular mt-2 text-sm">{km(stay.km)} km from {name}</p> : null}
      {stay.unrated ? <p className="mt-2 text-sm">No Google reviews yet. Check guest reviews on Booking.com.</p> : null}
      {tags.length ? <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">{tags.map((tag) => <li key={tag} className="border border-black/15 px-2 py-0.5">{tag}</li>)}</ul> : null}
      <div className="mt-auto grid gap-2 pt-5">
        <AddButton added={chosen} onClick={onChoose} label="Choose this stay" addedLabel="Your stay" />
        <a href={stay.clickUrl} target="_blank" rel="noopener sponsored" className={`text-center text-sm ${textLink}`}>See rooms and prices on Booking.com ↗</a>
      </div>
    </div>
  </li>;
}

function PlaceCard({ place, index, added, onToggle, townKm, eager, kind }) {
  const details = [place.type, PRICE[place.priceLevel], place.km > townKm ? `${km(place.km)} km away` : null].filter(Boolean);
  return <li className="flex w-[78%] shrink-0 snap-start flex-col sm:w-auto">
    <div className={`relative aspect-[4/3] overflow-hidden bg-surface ${added ? "outline outline-2 outline-offset-4 outline-black" : ""}`}>
      <GooglePhoto photo={place.photo} alt={place.name} eager={eager} />
      <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5"><Chip>{String(index + 1).padStart(2, "0")}</Chip>{added ? <Chip dark>In your trip</Chip> : null}</div>
    </div>
    <h3 className="mt-4 text-lg font-medium leading-snug tracking-tight-1">{place.name}</h3>
    <p className="mt-1 text-sm text-ink">{details.join(" · ")}</p>
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">{place.rating ? <Stars rating={place.rating} reviews={place.reviews} /> : null}{place.belowBar ? <span>Few reviews yet</span> : null}{place.mapsUrl ? <a href={place.mapsUrl} target="_blank" rel="noopener" className={textLink}>Map ↗</a> : null}</p>
    <div className="mt-4"><AddButton added={added} onClick={onToggle} label={kind === "dinner" ? "Add dinner" : "Add to trip"} addedLabel="Added" /></div>
  </li>;
}

// The picks, with choosing built in: one stay, any number of dinners and things
// to do. Choices are kept for this tab, so switching stay themes keeps them.
export function PicksPicker({ placeId, budget, name, townKm, stays, allStays, dinners, activities, intros, themeLabels, stayControls, emptyStay, emptyDinners, emptyActivities }) {
  const key = storageKey(placeId, budget);
  const [trip, setTrip] = useState(() => ({ stay: stays[0] ? { id: stays[0].id, name: stays[0].name } : null, dinners: dinners[0] ? [dinners[0].id] : [], activities: activities[0] ? [activities[0].id] : [] }));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = JSON.parse(window.sessionStorage.getItem(key) || "null");
        if (saved && typeof saved === "object") setTrip((current) => ({
          stay: saved.stay?.id && allStays.some((stay) => stay.id === saved.stay.id) ? saved.stay : current.stay,
          dinners: Array.isArray(saved.dinners) ? saved.dinners.filter((id) => dinners.some((item) => item.id === id)) : current.dinners,
          activities: Array.isArray(saved.activities) ? saved.activities.filter((id) => activities.some((item) => item.id === id)) : current.activities,
        }));
      } catch {}
      setReady(true);
    });
    return () => clearTimeout(timer);
  }, [key, allStays, dinners, activities]);

  useEffect(() => {
    if (!ready) return;
    try { window.sessionStorage.setItem(key, JSON.stringify(trip)); } catch {}
  }, [key, trip, ready]);

  const toggle = (field, id) => setTrip((current) => ({ ...current, [field]: current[field].includes(id) ? current[field].filter((item) => item !== id) : [...current[field], id] }));
  const chooseStay = (stay) => setTrip((current) => ({ ...current, stay: current.stay?.id === stay.id ? null : { id: stay.id, name: stay.name } }));
  const href = useMemo(() => tripPath(placeId, { budget, stay: trip.stay?.id || null, dinners: trip.dinners, activities: trip.activities }), [placeId, budget, trip]);
  const count = (trip.stay ? 1 : 0) + trip.dinners.length + trip.activities.length;
  const summary = [trip.stay?.name || null, trip.dinners.length ? `${trip.dinners.length} dinner${trip.dinners.length === 1 ? "" : "s"}` : null, trip.activities.length ? `${trip.activities.length} thing${trip.activities.length === 1 ? "" : "s"} to do` : null].filter(Boolean).join(" · ");

  return <>
    <Heading id="stay" eyebrow="From Booking.com · choose one" title="Where to stay" intro={intros.stays}>
      {stayControls}
      {stays.length ? <Row>{stays.map((stay, index) => <StayCard key={stay.id} stay={stay} index={index} chosen={trip.stay?.id === stay.id} onChoose={() => chooseStay(stay)} townKm={townKm} name={name} labels={themeLabels} />)}</Row> : emptyStay}
      <p className="mt-6 text-xs text-ink">Listings on <BookingLogo className="h-3 w-auto" />. You book and pay on Booking.com.</p>
    </Heading>

    <Heading id="eat" eyebrow="From Google Maps · add as many as you like" title="Where to eat" intro={intros.dinners}>
      {dinners.length ? <Row>{dinners.map((place, index) => <PlaceCard key={place.id} kind="dinner" place={place} index={index} eager={false} added={trip.dinners.includes(place.id)} onToggle={() => toggle("dinners", place.id)} townKm={townKm} />)}</Row> : emptyDinners}
    </Heading>

    <Heading id="do" eyebrow="From Google Maps · add as many as you like" title="Things to do" intro={intros.activities}>
      {activities.length ? <Row>{activities.map((place, index) => <PlaceCard key={place.id} kind="activity" place={place} index={index} eager={false} added={trip.activities.includes(place.id)} onToggle={() => toggle("activities", place.id)} townKm={townKm} />)}</Row> : emptyActivities}
      <p className="mt-6 text-xs text-ink">Places, ratings and photos from Google Maps.</p>
    </Heading>

    <div className="h-28" aria-hidden="true" />
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/15 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3 sm:px-8 sm:py-4">
        <div className="min-w-0">
          <p className="text-micro font-medium uppercase tracking-label">Your trip<span className="hidden sm:inline"> to {name}</span></p>
          <p className="mt-0.5 truncate text-sm" aria-live="polite">{count ? summary : "Choose a stay and add a few plans"}</p>
        </div>
        {count ? <Link href={href} onClick={() => track("anyplace_book_now", { count })} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 bg-black px-6 text-micro font-medium uppercase tracking-label text-white transition-opacity hover:opacity-90 sm:px-8">Book now <span aria-hidden="true">→</span></Link> : <span className="inline-flex min-h-12 shrink-0 items-center border border-black/15 px-6 text-micro font-medium uppercase tracking-label">Book now</span>}
      </div>
    </div>
  </>;
}

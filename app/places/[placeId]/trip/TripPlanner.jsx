"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import Image from "../../../components/Photo";
import { Chip, PhotoCredit, Stars, textLink } from "../../../components/TravelPage";
import { BookingLogo } from "../../../components/PartnerLogo";
import { StartingLocationField } from "../../../components/StartingLocationField";
import { flightLink, isFreeToVisit, nights, stayLink, ticketsLink, tripQuery } from "../../../lib/anyplace/trip";

const PRICE = { PRICE_LEVEL_FREE: "Free", PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };
const km = (value) => (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10);
const today = () => new Date().toISOString().slice(0, 10);
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

function dayLabel(value) {
  return value ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : null;
}

function GooglePhoto({ photo, alt, className = "" }) {
  if (!photo?.url) return <span className="grid h-full place-items-center p-8 text-center font-serif text-2xl leading-tight text-ink">{alt}</span>;
  return <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={photo.url} alt={alt} loading="lazy" decoding="async" width={1200} height={900} className={`image-calm absolute inset-0 h-full w-full object-cover ${className}`} />
    <PhotoCredit credit={photo.artist ? { artist: photo.artist, source: photo.source } : null} />
  </>;
}

function Action({ href, children, primary, sponsored = true, onClick }) {
  return <a href={href} target="_blank" rel={sponsored ? "noopener sponsored" : "noopener"} onClick={onClick} className={`inline-flex min-h-12 items-center justify-center gap-2 px-6 text-micro font-medium uppercase tracking-label transition-colors ${primary ? "bg-black text-white hover:bg-black/85" : "border border-black/25 hover:border-black"}`}>{children} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>;
}

function Booked({ id, checked, onChange }) {
  return <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm">
    <input id={id} type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 accent-black" />
    I&apos;ve booked this
  </label>;
}

function Step({ number, title, why, done, current, children }) {
  return <li className={`border bg-white ${current ? "border-black" : "border-black/15"}`}>
    <div className="grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:gap-x-5 sm:p-8">
      <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center text-sm font-semibold tabular ${done ? "bg-black text-white" : current ? "border-2 border-black" : "border border-black/30"}`}>{done ? "✓" : number}</span>
      <div>
        <p className="text-micro uppercase tracking-label">Step {number}{done ? " · done" : current ? " · start here" : ""}</p>
        <h3 className="mt-1 font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight tracking-tight-2">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink">{why}</p>
      </div>
    </div>
    <div className="px-6 pb-6 sm:px-8 sm:pb-8">{children}</div>
  </li>;
}

export function TripPlanner({ placeId, destination, initial, stay, dinners, activities, airport, townKm, staysSearchUrl, editHref }) {
  const [trip, setTrip] = useState(initial);
  const [origin, setOrigin] = useState(initial.from ? { type: "airport", airportCode: initial.from, city: initial.from } : null);
  const [done, setDone] = useState({});
  const [email, setEmail] = useState("");
  const [sendState, setSendState] = useState({ status: "idle", message: "" });
  const doneKey = `globtrek:booked:place:${placeId}:${trip.stay || ""}:${trip.dinners.join(",")}:${trip.activities.join(",")}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      let stored = {};
      try { stored = JSON.parse(window.localStorage.getItem(doneKey) || "{}"); } catch {}
      setDone((current) => ({ ...stored, ...current }));
    });
    return () => clearTimeout(timer);
  }, [doneKey]);

  // Keep the address bar in step, so a copied or emailed link opens this exact trip.
  useEffect(() => {
    try { window.history.replaceState(null, "", `/places/${placeId}/trip?${tripQuery(trip)}`); } catch {}
  }, [placeId, trip]);

  function toggle(id) {
    setDone((current) => {
      const next = { ...current, [id]: !current[id] };
      try { window.localStorage.setItem(doneKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const setDates = (field, value) => setTrip((current) => {
    const next = { ...current, [field]: value || null };
    if (next.start && next.end && next.end <= next.start) next.end = null;
    return next;
  });
  const chooseOrigin = (location) => { setOrigin(location); setTrip((current) => ({ ...current, from: location?.airportCode || null })); };

  const stayUrl = stay ? stayLink(stay, trip) : staysSearchUrl;
  const flightUrl = flightLink(airport, trip);
  const stayNights = nights(trip);
  const dated = Boolean(trip.start && trip.end);

  const items = useMemo(() => [
    { id: "flight" },
    { id: "stay" },
    ...activities.map((place) => ({ id: `a:${place.id}` })),
    ...dinners.map((place) => ({ id: `d:${place.id}` })),
  ], [activities, dinners]);
  const bookedCount = items.filter((item) => done[item.id]).length;
  const steps = [
    { key: "flight", ids: ["flight"] },
    { key: "stay", ids: ["stay"] },
    ...(activities.length ? [{ key: "activities", ids: activities.map((place) => `a:${place.id}`) }] : []),
    ...(dinners.length ? [{ key: "dinners", ids: dinners.map((place) => `d:${place.id}`) }] : []),
  ];
  const current = steps.find((step) => step.ids.some((id) => !done[id]))?.key;
  const numberOf = (key) => steps.findIndex((step) => step.key === key) + 1;
  const stepDone = (key) => steps.find((step) => step.key === key)?.ids.every((id) => done[id]);
  const open = (type) => () => track("anyplace_trip_link", { type });

  async function sendEmail(event) {
    event.preventDefault();
    setSendState({ status: "sending", message: "" });
    try {
      const response = await fetch("/api/email/place-trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placeId, query: tripQuery(trip), email }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Your trip could not be emailed right now.");
      track("anyplace_trip_emailed");
      setSendState({ status: "sent", message: `Sent to ${email}. It has every link, in order.` });
    } catch (error) {
      setSendState({ status: "error", message: error.message });
    }
  }

  const overview = [
    ["Stay", stay?.name || "Not chosen yet"],
    ["When", dated ? `${dayLabel(trip.start)} – ${dayLabel(trip.end)}` : "Add your dates", dated ? plural(stayNights, "night") : null],
    ["Who", plural(trip.adults, "traveler")],
    ["Plans", [activities.length ? plural(activities.length, "thing") + " to do" : null, dinners.length ? plural(dinners.length, "dinner") : null].filter(Boolean).join(", ") || "Add some from your picks"],
  ];

  return <>
    <section className="mx-auto max-w-[1080px] px-5 pt-10 sm:px-8 sm:pt-14">
      <dl className="grid grid-cols-2 border-t border-black md:grid-cols-4">
        {overview.map(([label, value, note], index) => <div key={label} className={`border-b border-black/15 py-5 pr-5 md:border-b-0 ${index ? "md:border-l md:border-black/15 md:pl-6" : ""}`}>
          <dt className="text-micro uppercase tracking-label">{label}</dt>
          <dd className="mt-2 font-serif text-[1.35rem] leading-tight tracking-tight-2">{value}</dd>
          {note ? <dd className="mt-1 text-sm">{note}</dd> : null}
        </div>)}
      </dl>

      <div className="mt-10 border border-black/15 bg-white p-6 sm:p-8">
        <p className="text-micro uppercase tracking-label">Your details</p>
        <h2 className="mt-1 font-serif text-[1.8rem] leading-tight tracking-tight-2">Add your dates and every link opens ready to book</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">Check in
            <input type="date" min={today()} value={trip.start || ""} onChange={(event) => setDates("start", event.target.value)} className="mt-1 block w-full border-0 border-b border-black/30 bg-transparent py-3 text-lg focus:border-black focus:outline-none focus:ring-0" />
          </label>
          <label className="block text-sm">Check out
            <input type="date" min={trip.start || today()} value={trip.end || ""} onChange={(event) => setDates("end", event.target.value)} className="mt-1 block w-full border-0 border-b border-black/30 bg-transparent py-3 text-lg focus:border-black focus:outline-none focus:ring-0" />
          </label>
          <label className="block text-sm">Travelers
            <select value={trip.adults} onChange={(event) => setTrip((value) => ({ ...value, adults: Number(event.target.value) }))} className="mt-1 block w-full border-0 border-b border-black/30 bg-transparent py-3 text-lg focus:border-black focus:outline-none focus:ring-0">
              {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{plural(count, "adult")}</option>)}
            </select>
          </label>
          <div className="text-sm"><span>Flying from</span><div className="-mt-2 [&_input]:py-3 [&_input]:text-lg"><StartingLocationField id="trip-origin" value={origin} onChange={chooseOrigin} placeholder="City or airport" /></div></div>
        </div>
      </div>

      <div className="mt-14 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-[clamp(2rem,3.4vw,2.8rem)] leading-[.95] tracking-tight-2">Book it in this order</h2>
        <p className="tabular text-sm" aria-live="polite">{bookedCount} of {items.length} booked</p>
      </div>
      <div className="mt-4 h-1 w-full bg-black/10" aria-hidden="true"><div className="h-1 bg-black transition-[width] duration-500" style={{ width: `${(bookedCount / Math.max(1, items.length)) * 100}%` }} /></div>

      <ol className="mt-8 space-y-5">
        <Step number={numberOf("flight")} title={airport ? `Fly into ${airport.city}` : "Book your flight"} why={`Do this first: fares change fastest, and your flight times set your check-in and check-out.${airport ? ` ${airport.name} (${airport.code}) is ${airport.km} km from ${destination.name}.` : ""}`} done={stepDone("flight")} current={current === "flight"}>
          <div className="flex flex-wrap items-center gap-4 sm:ml-16">
            <Action href={flightUrl} primary={current === "flight"} onClick={open("flight")}>{trip.from && airport ? `See flights ${trip.from} → ${airport.code}` : "See flights"}</Action>
            <Booked id="booked-flight" checked={Boolean(done.flight)} onChange={() => toggle("flight")} />
          </div>
          <p className="mt-3 text-xs sm:ml-16">Flights on <BookingLogo className="h-3 w-auto" />{trip.from ? "" : ". Add where you're flying from above to see your route"}.</p>
        </Step>

        <Step number={numberOf("stay")} title={stay ? `Book ${stay.name}` : "Book your stay"} why={stay?.freeCancellation ? "Some rooms here have free cancellation, so you can lock in your place now and cancel later if your plans change. Match the dates to your flight." : "Match check-in and check-out to your flight days, and read the cancellation policy before you pay."} done={stepDone("stay")} current={current === "stay"}>
          {stay ? <div className="grid gap-6 sm:ml-16 md:grid-cols-[1.1fr_1fr]">
            <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">
              {stay.photo ? <Image src={stay.photo} alt={`${stay.name}, photo from Booking.com`} fill sizes="(min-width: 768px) 520px, 90vw" className="image-calm object-cover" priority /> : null}
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{[stay.stars ? `${stay.stars}-star ${String(stay.category || "stay").toLowerCase()}` : stay.category].filter(Boolean).map((chip) => <Chip key={chip}>{chip}</Chip>)}</div>
            </div>
            <div className="flex flex-col">
              <p className="text-sm">{[stay.street, stay.city].filter(Boolean).join(" · ")}</p>
              {stay.km > townKm ? <p className="mt-1 text-sm">{km(stay.km)} km from {destination.name}</p> : null}
              <ul className="mt-4 space-y-1.5 text-sm">
                {stay.freeCancellation ? <li>✓ Free cancellation on some rooms</li> : null}
                {stay.freeBreakfast ? <li>✓ Breakfast included on some rooms</li> : null}
                <li>✓ You book and pay on Booking.com</li>
                {dated ? <li>✓ Opens on {dayLabel(trip.start)} for {plural(stayNights, "night")}, {plural(trip.adults, "adult")}</li> : null}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Action href={stayUrl} primary={current === "stay"} onClick={open("stay")}>{dated ? "Check rooms for your dates" : "See rooms and prices"}</Action>
                <Booked id="booked-stay" checked={Boolean(done.stay)} onChange={() => toggle("stay")} />
              </div>
            </div>
          </div> : <div className="flex flex-wrap items-center gap-4 sm:ml-16">
            <Action href={stayUrl} primary={current === "stay"} onClick={open("stay")}>Search stays near {destination.name}</Action>
            <Booked id="booked-stay" checked={Boolean(done.stay)} onChange={() => toggle("stay")} />
          </div>}
        </Step>

        {activities.length ? <Step number={numberOf("activities")} title={activities.length === 1 ? "Plan your day out" : "Plan your days out"} why="Book anything with set times around your arrival and departure. Outdoor places are free to visit." done={stepDone("activities")} current={current === "activities"}>
          <ul className="grid gap-6 sm:ml-16 sm:grid-cols-2">
            {activities.map((place) => {
              const tickets = ticketsLink(place, destination);
              const id = `a:${place.id}`;
              return <li key={place.id} className="flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface"><GooglePhoto photo={place.photo} alt={place.name} /></div>
                <p className="mt-3 text-lg font-medium leading-snug">{place.name}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-sm">{[place.type, place.km > townKm ? `${km(place.km)} km away` : null].filter(Boolean).join(" · ")}{place.rating ? <Stars rating={place.rating} reviews={place.reviews} /> : null}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {tickets ? <Action href={tickets} primary={current === "activities" && !done[id]} onClick={open("tickets")}>Tours and tickets</Action> : null}
                  {place.mapsUrl ? <Action href={place.mapsUrl} sponsored={false} primary={!tickets && current === "activities" && !done[id]} onClick={open("map")}>{tickets ? "Map" : "Directions"}</Action> : null}
                </div>
                <div className="mt-3"><Booked id={`booked-${place.id}`} checked={Boolean(done[id])} onChange={() => toggle(id)} /></div>
              </li>;
            })}
          </ul>
        </Step> : null}

        {dinners.length ? <Step number={numberOf("dinners")} title={dinners.length === 1 ? "Reserve your dinner" : "Reserve your dinners"} why="Last, once your days are set. Popular places book up, so reserve the ones that take reservations." done={stepDone("dinners")} current={current === "dinners"}>
          <ul className="grid gap-6 sm:ml-16 sm:grid-cols-2">
            {dinners.map((place) => {
              const id = `d:${place.id}`;
              return <li key={place.id} className="flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface"><GooglePhoto photo={place.photo} alt={place.name} /></div>
                <p className="mt-3 text-lg font-medium leading-snug">{place.name}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-sm">{[place.type, PRICE[place.priceLevel], place.km > townKm ? `${km(place.km)} km away` : null].filter(Boolean).join(" · ")}{place.rating ? <Stars rating={place.rating} reviews={place.reviews} /> : null}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {place.mapsUrl ? <Action href={place.mapsUrl} sponsored={false} primary={current === "dinners" && !done[id]} onClick={open("dinner")}>Hours and reservations</Action> : null}
                </div>
                <div className="mt-3"><Booked id={`booked-${place.id}`} checked={Boolean(done[id])} onChange={() => toggle(id)} /></div>
              </li>;
            })}
          </ul>
        </Step> : null}
      </ol>

      {bookedCount === items.length ? <p role="status" className="mt-8 border-l-2 border-black pl-4 text-base font-medium">Everything&apos;s booked. Keep each confirmation email: they hold your reservations. Have a great trip.</p> : null}

      <form onSubmit={sendEmail} className="mt-14 bg-ink p-6 text-white sm:p-10">
        <p className="text-micro uppercase tracking-label text-white/80">Not booking right now?</p>
        <h2 className="mt-2 max-w-xl font-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.02] tracking-tight-2">Email yourself this trip, laid out step by step</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">Every link, in the order to book, so you can pick up where you left off. One email; it doesn&apos;t sign you up for anything.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="trip-email" className="sr-only">Email address</label>
          <input id="trip-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-12 flex-1 border border-white/30 bg-transparent px-4 text-base text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-0" />
          <button type="submit" disabled={sendState.status === "sending"} className="inline-flex min-h-12 items-center justify-center bg-white px-7 text-micro font-medium uppercase tracking-label text-black transition-opacity hover:opacity-90 disabled:opacity-60">{sendState.status === "sending" ? "Sending…" : "Email my trip"}</button>
        </div>
        {sendState.message ? <p role="status" className="mt-3 text-sm">{sendState.message}</p> : null}
      </form>

      <p className="mt-8 text-sm"><a href={editHref} className={textLink}>← Change your picks</a></p>
      <p className="mt-4 text-xs leading-5">GlobTrek may earn a commission from bookings made through these links, at no extra cost to you. Check the final price, fees and terms on each partner&apos;s site. Places, ratings and photos for things to do and dinners come from Google Maps.</p>
    </section>
  </>;
}

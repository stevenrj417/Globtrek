"use client";

import { createContext, useContext, useMemo, useState } from "react";
import Image from "../../components/Photo";
import { BookingLogo } from "../../components/PartnerLogo";
import { CJ_LINKS, cjTracked, isCjUrl } from "../../lib/booking/cj";

// Travelers, nights, check-in and the chosen stay, shared by the stays, the
// cost breakdown and the mobile booking bar. The guide itself is server-rendered.
const TripContext = createContext(null);

const money = (value) => `$${Math.round(value).toLocaleString("en-US")}`;
const range = ([low, high]) => (low === high ? money(low) : `${money(low)}–${money(high)}`);

function addDays(date, days) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function bookUrl(stay, { travelers, nights, checkin }) {
  let target;
  try { target = new URL(stay.bookingUrl); } catch { return null; }
  if (target.protocol !== "https:" || !/(^|\.)booking\.com$/.test(target.hostname)) return null;
  if (checkin) {
    target.searchParams.set("checkin", checkin);
    target.searchParams.set("checkout", addDays(checkin, nights));
  }
  target.searchParams.set("group_adults", String(travelers));
  target.searchParams.set("no_rooms", String(Math.ceil(travelers / 2)));
  target.searchParams.set("group_children", "0");
  const click = stay.cjTrackingBaseUrl && isCjUrl(stay.cjTrackingBaseUrl) ? stay.cjTrackingBaseUrl.replace(/\/$/, "") : CJ_LINKS.stays;
  return cjTracked(click, target.toString());
}

const round10 = (value) => Math.round(value / 10) * 10;

// budgets: [{ key, label, sign, stayIds, lodging: [low, high] per room night }].
export function GuideTrip({ stays, costs, budgets = [], children }) {
  const [travelers, setTravelers] = useState(costs.travelers);
  const [nights, setNights] = useState(costs.nights);
  const [checkin, setCheckin] = useState("");
  const [budget, setBudgetKey] = useState(budgets[0]?.key || null);
  const [stayId, setStayId] = useState(budgets[0]?.stayIds[0] || stays[0]?.id);
  const value = useMemo(() => {
    const level = budgets.find((item) => item.key === budget);
    // The lodging row follows the chosen budget: typical nightly price for that kind of hotel.
    const rows = costs.grid[nights - 1][travelers - 1].map((row, index) => (level?.lodging && index === costs.lodgingIndex ? [round10(level.lodging[0] * nights * Math.ceil(travelers / 2)), round10(level.lodging[1] * nights * Math.ceil(travelers / 2))] : row));
    const total = rows.reduce((sum, [low, high]) => [sum[0] + low, sum[1] + high], [0, 0]);
    const stay = stays.find((item) => item.id === stayId) || stays[0];
    const setBudget = (key) => {
      setBudgetKey(key);
      const next = budgets.find((item) => item.key === key);
      if (next && !next.stayIds.includes(stayId)) setStayId(next.stayIds[0]);
    };
    return { travelers, setTravelers, nights, setNights, checkin, setCheckin, stayId, setStayId, budget, setBudget, budgets, rows, total, stay, labels: costs.labels, href: stay ? bookUrl(stay, { travelers, nights, checkin }) : null };
  }, [travelers, nights, checkin, stayId, budget, budgets, stays, costs]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

// Budget, Mid-range or Splurge: the page shows only that level's hotels and dinners.
export function BudgetPicker({ place }) {
  const trip = useContext(TripContext);
  if (trip.budgets.length < 2) return null;
  return <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
    <div role="group" aria-label={`Your budget in ${place}`} className="-mt-7 relative z-10 grid grid-cols-3 bg-ink p-1 sm:inline-grid sm:min-w-[30rem]">
      {trip.budgets.map((level) => {
        const active = level.key === trip.budget;
        return <button key={level.key} type="button" onClick={() => trip.setBudget(level.key)} aria-pressed={active} className={`flex min-h-12 flex-col items-center justify-center px-3 py-1.5 text-center transition-colors ${active ? "bg-white text-ink" : "text-white/80 hover:text-white"}`}>
          <span className="text-micro font-semibold uppercase tracking-caps">{level.label}</span>
          <span className="tabular text-[11px] opacity-70">{level.sign}</span>
        </button>;
      })}
    </div>
  </div>;
}

// Shows its children only while that budget level is chosen. Every level is in
// the page's HTML; the others are just hidden.
export function ForBudget({ level, children }) {
  const trip = useContext(TripContext);
  return <div hidden={trip.budget !== level}>{children}</div>;
}

function Stepper({ label, value, min, max, onChange, unit }) {
  return <div className="flex items-center justify-between gap-4 py-3">
    <span className="text-sm">{label}</span>
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${unit}`} className="grid size-11 place-items-center border border-black/15 bg-bg text-lg transition-colors hover:border-ink disabled:opacity-30">−</button>
      <span className="tabular w-10 text-center font-medium" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${unit}`} className="grid size-11 place-items-center border border-black/15 bg-bg text-lg transition-colors hover:border-ink disabled:opacity-30">+</button>
    </div>
  </div>;
}

export function TripControls() {
  const trip = useContext(TripContext);
  const today = new Date().toISOString().slice(0, 10);
  return <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
    <Stepper label="Travelers" value={trip.travelers} min={1} max={8} unit="travelers" onChange={trip.setTravelers} />
    <Stepper label="Nights" value={trip.nights} min={1} max={14} unit="nights" onChange={trip.setNights} />
    <label className="flex items-center justify-between gap-4 py-3 text-sm">
      Check-in <span className="text-subtle">(optional)</span>
      <input type="date" min={today} value={trip.checkin} onChange={(event) => trip.setCheckin(event.target.value)} className="ml-auto min-h-11 border border-black/15 bg-bg px-3 text-sm" />
    </label>
  </div>;
}

const priceText = (price) => (price.high ? range([price.value, price.high]) : money(price.value));
const priceKind = (price) => (price.unit === "dorm bed" ? "dorm bed" : `${price.kind} room`);

// When every stay in a group carries the same typical price (it's the price for
// that kind of stay, not each hotel's rate), say it once above the cards instead
// of repeating the same number on every card.
export function StayCards({ stays, label }) {
  const trip = useContext(TripContext);
  const first = stays[0]?.price;
  const shared = stays.length > 1 && first && stays.every((stay) => stay.price && priceText(stay.price) === priceText(first) && stay.price.unit === first.unit) ? first : null;
  return <>
    {label || shared ? <p className="tabular mt-10 text-sm">
      {label ? <span className="eyebrow mr-3">{label}</span> : null}
      {shared ? <>A typical {priceKind(shared)} here is about <span className="font-medium">{priceText(shared)}</span> a night.</> : null}
    </p> : null}
    <ul className={`-mx-5 ${label || shared ? "mt-6" : "mt-10"} flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 lg:grid-cols-3`}>
      {stays.map((stay, index) => {
        const chosen = stay.id === trip.stay?.id;
        const href = bookUrl(stay, trip);
        const chips = [stay.type, ...(stay.dorms ? ["Dorm beds"] : [])];
        const tags = [...(stay.freeCancellation ? ["Free cancellation on some rates"] : []), ...(stay.breakfast ? ["Breakfast on some rates"] : []), ...stay.highlights].slice(0, 4);
        return <li key={stay.id} className="flex w-[78%] shrink-0 snap-start flex-col sm:w-auto">
          <div className={`relative aspect-[4/3] overflow-hidden bg-placeholder ${chosen ? "outline outline-2 outline-offset-4 outline-ink" : ""}`}>
            <Image src={stay.photo} alt={`${stay.name}, photo from Booking.com`} fill className="image-calm object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw" loading={index < 2 ? "eager" : "lazy"} />
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {chips.map((chip) => <span key={chip} className="bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm">{chip}</span>)}
            </div>
            {chosen ? <span className="absolute bottom-3 left-3 bg-ink px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-white">In your trip</span> : null}
          </div>
          <div className="flex flex-1 flex-col pt-4">
            <h3 className="text-xl font-medium leading-snug tracking-tight-2">{stay.name}</h3>
            {stay.distance ? <p className="mt-1 text-xs text-subtle">{stay.distance}</p> : stay.address ? <p className="mt-1 line-clamp-2 text-xs text-subtle">{stay.address}</p> : null}
            {shared ? <p className="mt-3 text-sm text-subtle">Today&apos;s price on Booking.com</p> : stay.price ? <p className="tabular mt-3 text-sm"><span className="font-medium">About {stay.price.high ? range([stay.price.value, stay.price.high]) : money(stay.price.value)}</span> a night{stay.price.unit === "dorm bed" ? " per bed" : ""}<span className="block text-xs text-subtle">Typical for this kind of stay, not this hotel&apos;s rate</span></p> : <p className="mt-3 text-sm text-subtle">See today&apos;s price on Booking.com</p>}
            {stay.evidence ? <p className="mt-2 text-sm">✓ {stay.evidence}</p> : null}
            {tags.length ? <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {tags.map((tag) => <li key={tag} className="border border-black/15 px-2 py-0.5">{tag}</li>)}
            </ul> : null}
            <div className="mt-auto flex flex-col gap-2 pt-5">
              {href ? <a href={href} target="_blank" rel="noopener sponsored" className="btn btn-primary w-full">Book now ↗</a> : null}
              <button type="button" onClick={() => trip.setStayId(stay.id)} aria-pressed={chosen} className="btn btn-secondary w-full">{chosen ? "✓ In your trip" : "Use in my trip"}</button>
            </div>
          </div>
        </li>;
      })}
    </ul>
  </>;
}

// Said once under all the stay groups, not after each one.
export function StayNote({ note }) {
  const trip = useContext(TripContext);
  const opens = `Book now opens Booking.com with your ${trip.checkin ? "travelers and dates" : "travelers"}, and you pay Booking.com directly.`;
  return <p className="mt-8 max-w-[var(--width-reading)] text-xs leading-5 text-subtle">{`${note} ${opens}`}</p>;
}

export function CostPanel({ source, month, place }) {
  const trip = useContext(TripContext);
  return <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
    <div>
      <h3 className="font-serif text-2xl tracking-tight-2">Your trip</h3>
      <TripControls />
      {trip.stay ? <p className="mt-4 text-sm text-muted">Staying at <span className="text-ink">{trip.stay.name}</span>.</p> : null}
    </div>
    <div>
      <h3 className="font-serif text-2xl tracking-tight-2">Estimated cost in {month}</h3>
      <dl className="mt-4 divide-y divide-black/10 border-y border-black/10 text-sm">
        {trip.labels.map((label, index) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-muted">{label}</dt><dd className="tabular font-medium">{range(trip.rows[index])}</dd></div>)}
        <div className="flex items-baseline justify-between gap-4 py-4"><dt className="font-medium">Total</dt><dd className="tabular text-2xl font-medium tracking-tight-2">{range(trip.total)}</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-subtle">{trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}, {trip.nights} night{trip.nights === 1 ? "" : "s"} in {place}, before flights or driving there. {source} Estimates, not live prices.</p>
      {trip.href ? <a href={trip.href} target="_blank" rel="noopener sponsored" className="btn btn-primary mt-6 w-full sm:w-auto">Book {trip.stay.name} ↗</a> : null}
      <p className="mt-2 text-xs text-subtle">On <BookingLogo className="h-3 w-auto" /></p>
    </div>
  </div>;
}

// Phones: the total and a Book button stay in reach while reading.
export function MobileBookBar() {
  const trip = useContext(TripContext);
  if (!trip.href) return null;
  return <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-black/10 bg-bg/95 px-5 py-3 backdrop-blur-sm sm:hidden">
    <div className="min-w-0">
      <p className="tabular text-sm font-semibold">{range(trip.total)}</p>
      <p className="truncate text-xs text-subtle">{trip.travelers} traveler{trip.travelers === 1 ? "" : "s"} · {trip.nights} night{trip.nights === 1 ? "" : "s"} · {trip.stay.name}</p>
    </div>
    <a href={trip.href} target="_blank" rel="noopener sponsored" className="btn btn-primary shrink-0">Book now</a>
  </div>;
}

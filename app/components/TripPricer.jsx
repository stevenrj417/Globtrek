"use client";

import Image from "./Photo";
import { useEffect, useMemo, useState } from "react";
import { AirportAutocomplete } from "./AirportAutocomplete";
import { formatMoney } from "../lib/format";
import { flightBookingUrl } from "../lib/booking/bookIt";

// The live price of a themed trip or expedition, for the traveler's airport,
// dates, group and spending style, with every line's basis on show, and a
// "plan and book" button for each stop.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STYLES = [["cheapest", "Cheapest"], ["value", "Good value"], ["comfortable", "Comfortable"]];
const ROWS = [["flights", "Flights"], ["hotel", "Places to stay"], ["food", "Food"], ["activities", "Things to do"], ["transportation", "Getting around"], ["extras", "Tickets and passes"], ["packages", "Expedition or guided tour"], ["buffer", "A little extra, just in case"]];

export function calm(value) {
  const text = String(value || "");
  return text && text === text.toUpperCase() ? text.toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (letter) => letter.toUpperCase()) : text;
}

const iso = (date) => date.toISOString().slice(0, 10);
function prettyDay(day, year = false) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}
const range = (start, end) => `${prettyDay(start)} – ${prettyDay(end, true)}`;

// The next start in one of the trip's best months, at least three weeks out.
export function nextGoodStart(bestMonths = []) {
  const soon = new Date(Date.now() + 21 * 86400000);
  if (!bestMonths.length) return iso(new Date(Date.now() + 60 * 86400000));
  for (let add = 0; add < 24; add += 1) {
    const candidate = new Date(Date.UTC(soon.getUTCFullYear(), soon.getUTCMonth() + add, add === 0 ? Math.max(soon.getUTCDate(), 10) : 10));
    if (bestMonths.includes(candidate.getUTCMonth() + 1)) return iso(candidate);
  }
  return iso(new Date(Date.now() + 60 * 86400000));
}

function savedTraveler() {
  try {
    const quiz = JSON.parse(window.localStorage.getItem("globtrekQuiz") || "null");
    const details = quiz?.originDetails?.airportCode ? quiz.originDetails : quiz?.originAirport ? { airportCode: quiz.originAirport, city: quiz.originAirport } : null;
    return { origin: details, travelers: Number(quiz?.adults || quiz?.guestCount) || null };
  } catch { return { origin: null, travelers: null }; }
}

// Opens GlobTrek's full planner (stays, flights, dinners, booking in order) for one stop.
function planStop(stop, { origin, travelers, style }) {
  try {
    window.localStorage.setItem("globtrekQuiz", JSON.stringify({
      answers: {}, spendStyle: style, tripStart: stop.start, tripEnd: stop.end, isFlexible: false,
      originAirport: origin?.airportCode || "", originDetails: origin?.airportCode ? origin : null,
      guestCount: String(travelers), adults: travelers, children: 0, destination: stop.id, createdAt: Date.now(),
    }));
  } catch {}
  window.location.href = `/results?destination=${encodeURIComponent(stop.id)}`;
}

export function TripPricer({ kind, slug = "", bestMonths = [], months: initialMonths = 3, showMonths = false, heading = "What this trip costs you" }) {
  const [origin, setOrigin] = useState(null);
  const [travelers, setTravelers] = useState(1);
  const [start, setStart] = useState(() => nextGoodStart(bestMonths));
  const [style, setStyle] = useState("value");
  const [months, setMonths] = useState(initialMonths);
  const [state, setState] = useState({ status: "loading", result: null });

  useEffect(() => {
    const saved = savedTraveler();
    window.setTimeout(() => {
      if (saved.origin) setOrigin(saved.origin);
      if (saved.travelers) setTravelers(Math.min(8, saved.travelers));
    }, 0);
  }, []);

  const query = useMemo(() => new URLSearchParams({ kind, slug, months: String(months), origin: origin?.airportCode || "JFK", travelers: String(travelers), start, style }).toString(), [kind, slug, months, origin, travelers, start, style]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/themed?${query}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("price")))
        .then((data) => setState({ status: "ready", result: data.result }))
        .catch((error) => { if (error.name !== "AbortError") setState((current) => ({ ...current, status: "error" })); });
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  const result = state.result;
  const from = origin?.airportCode || "JFK";
  const today = iso(new Date());
  const button = "inline-flex min-h-12 items-center justify-center gap-2 px-5 text-micro font-medium uppercase tracking-label";

  return <section aria-labelledby="pricer-heading" className="border border-black/10 bg-white shadow-[0_1px_0_rgba(0,0,0,.04)]">
    <div className="border-b border-black/10 p-6 sm:p-10">
      <h2 id="pricer-heading" className="font-serif text-3xl tracking-tight-3 sm:text-4xl">{heading}</h2>
      <p className="mt-2 text-sm">Change anything and the price updates. Built from GlobTrek&apos;s price data for your dates, not a guess.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-micro font-medium uppercase tracking-label">Flying from</p><AirportAutocomplete key={origin?.airportCode || "none"} id={`${slug || kind}-from`} value={origin} onChange={(value) => value?.airportCode && setOrigin(value)} />{!origin ? <p className="mt-1 text-xs">Showing New York (JFK) until you pick yours.</p> : null}</div>
        <div><p className="text-micro font-medium uppercase tracking-label">Travelers</p><div className="mt-3 flex items-center gap-3"><button type="button" aria-label="One fewer traveler" onClick={() => setTravelers((value) => Math.max(1, value - 1))} className="grid h-11 w-11 place-items-center border border-black/25 text-lg hover:border-black">−</button><span className="tabular min-w-8 text-center text-lg" aria-live="polite">{travelers}</span><button type="button" aria-label="One more traveler" onClick={() => setTravelers((value) => Math.min(8, value + 1))} className="grid h-11 w-11 place-items-center border border-black/25 text-lg hover:border-black">+</button></div></div>
        <label className="block"><span className="text-micro font-medium uppercase tracking-label">Leaving</span><input type="date" min={today} value={start} onChange={(event) => event.target.value && setStart(event.target.value)} className="mt-3 block min-h-11 w-full border border-black/25 bg-white px-3 text-base" /></label>
        <div><p className="text-micro font-medium uppercase tracking-label">Spending style</p><div className="mt-3 grid grid-cols-3 border border-black/25" role="group" aria-label="Spending style">{STYLES.map(([key, label]) => <button key={key} type="button" aria-pressed={style === key} onClick={() => setStyle(key)} className={`min-h-11 px-1 text-xs font-medium ${style === key ? "bg-black text-white" : "hover:bg-black/5"}`}>{label}</button>)}</div></div>
      </div>
      {showMonths ? <label className="mt-6 block"><span className="text-micro font-medium uppercase tracking-label">How long: <span className="tabular">{months} month{months === 1 ? "" : "s"}</span></span><input type="range" min={1} max={12} step={1} value={months} onChange={(event) => setMonths(Number(event.target.value))} className="mt-3 block w-full accent-black" /></label> : null}
      {bestMonths.length ? <p className="mt-4 text-sm">Best months: {bestMonths.map((month) => MONTHS[month - 1]).join(", ")}.{!bestMonths.includes(Number(start.slice(5, 7))) ? " Your dates are outside them, so expect different weather (and sometimes lower prices)." : ""}</p> : null}
    </div>

    {state.status === "error" && !result ? <p className="p-7 text-base">The price didn&apos;t load. Check your connection; it retries when you change anything.</p> : null}
    {!result ? <p className="p-7 text-base" aria-live="polite">Pricing your trip…</p> : <div className={state.status === "loading" ? "opacity-60 transition-opacity" : "transition-opacity"} aria-live="polite">
      <div className="grid gap-8 border-b border-black/10 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
        <div>
          <p className="text-micro font-medium uppercase tracking-label">Estimated total</p>
          <p className="tabular mt-3 font-serif text-[clamp(3rem,6vw,5rem)] leading-none tracking-tight-3">{formatMoney(result.total)}</p>
          <p className="tabular mt-4 text-base">{travelers > 1 ? `${formatMoney(result.perPerson)} a person · ` : ""}{result.nights} nights · {range(result.start, result.end)}</p>
          <p className="tabular mt-1 text-sm">Most likely between {formatMoney(result.low)} and {formatMoney(result.high)}, depending on the flights and rooms you pick.</p>
          {result.suggestedStart ? <p className="mt-4 border-l-2 border-black pl-3 text-sm">Antarctic ships only sail November to March. Start on <button type="button" className="underline" onClick={() => setStart(result.suggestedStart)}>{prettyDay(result.suggestedStart, true)}</button> and your ship sails in season.</p> : null}
        </div>
        <dl className="grid content-start divide-y divide-black/10 border-y border-black/10">
          {ROWS.map(([key, label]) => result.totals[key] > 0 ? <div key={key} className="flex items-baseline justify-between gap-4 py-3"><dt className="text-sm">{label}</dt><dd className="tabular text-sm font-medium">{formatMoney(result.totals[key])}</dd></div> : null)}
        </dl>
      </div>

      <div className="p-6 sm:p-10">
        <h3 className="font-serif text-2xl tracking-tight-2 sm:text-3xl">Your route</h3>
        <ol className="relative mt-8 space-y-5 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-black/15 sm:before:left-[39px]">
          {result.stops.map((stop, index) => <li key={`${stop.id}-${stop.start}`} className="relative grid grid-cols-[56px_1fr] gap-4 sm:grid-cols-[80px_1fr_auto] sm:items-center sm:gap-6">
            <span className="relative block aspect-square w-14 sm:w-20">
              <span className="absolute inset-0 overflow-hidden rounded-full bg-placeholder ring-4 ring-white">{stop.photo ? <Image src={stop.photo} alt="" fill sizes="80px" className="object-cover" /> : null}</span>
              <span className="tabular absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full bg-black text-[11px] font-medium text-white ring-2 ring-white">{index + 1}</span>
            </span>
            <div className="min-w-0">
              <p className="font-serif text-2xl leading-tight">{calm(stop.city)}<span className="ml-2 text-micro uppercase tracking-label">{calm(stop.country)}</span></p>
              <p className="tabular mt-1 text-sm">{range(stop.start, stop.end)} · {stop.nights} night{stop.nights === 1 ? "" : "s"} · <span className="font-medium">{formatMoney(stop.total)}</span></p>
              {stop.kind === "package" ? <div className="mt-2 text-sm leading-6"><p className="font-medium">{stop.label}: {formatMoney(stop.perPerson.typical)} a person (operators list {formatMoney(stop.perPerson.low)} to {formatMoney(stop.perPerson.high)}).</p><p>{stop.includes}</p>{!stop.inSeason ? <p className="font-medium">These trips run {stop.seasonMonths.map((month) => MONTHS[month - 1]).join(", ")}; move your dates to sail.</p> : null}</div> : null}
            </div>
            <div className="col-start-2 sm:col-start-auto">
              {stop.kind === "stay"
                ? <button type="button" onClick={() => planStop(stop, { origin: index === 0 ? origin : { airportCode: result.stops[index - 1].airport, city: result.stops[index - 1].city }, travelers, style })} className="inline-flex min-h-11 items-center gap-2 text-micro font-medium uppercase tracking-label underline underline-offset-4">Plan this stop →</button>
                : <a href={stop.sources?.[0]} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 text-micro font-medium uppercase tracking-label underline underline-offset-4">See sailings ↗</a>}
            </div>
          </li>)}
        </ol>

        <div className="mt-12 grid gap-px border-y border-black/10 bg-black/10">
          <details className="group bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3"><span className="font-medium">Flights <span className="tabular font-normal">· {result.legs.filter((leg) => leg.mode !== "ground").length} legs · {formatMoney(result.totals.flights || 0)}</span></span><span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">+</span></summary>
            <ul className="grid gap-px bg-black/10 pb-4">
              {result.legs.map((leg) => <li key={`${leg.from}-${leg.to}-${leg.date}`} className="flex flex-wrap items-center justify-between gap-3 bg-white py-3">
                <span className="tabular text-sm"><strong className="font-medium">{leg.from} → {leg.to}</strong> · {prettyDay(leg.date, true)}{leg.roundTrip ? " · round trip" : ""}</span>
                {leg.mode === "ground" ? <span className="text-sm">By road or rail</span> : <span className="flex items-center gap-4"><span className="tabular text-sm font-medium">{formatMoney(leg.total)}{travelers > 1 ? ` (${formatMoney(leg.perPerson)} each)` : ""}</span><a href={flightBookingUrl({ from: leg.from, to: leg.to, start: leg.date, end: leg.roundTrip ? result.end : null, adults: travelers, oneWay: !leg.roundTrip })} target="_blank" rel="noopener sponsored" className="text-micro font-medium uppercase tracking-label underline">Search ↗</a></span>}
              </li>)}
            </ul>
          </details>
          {result.extras.length ? <details className="group bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3"><span className="font-medium">Tickets and passes <span className="tabular font-normal">· {result.extras.length} · {formatMoney(result.totals.extras || 0)}</span></span><span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">+</span></summary>
            <ul className="grid gap-px bg-black/10 pb-4">{result.extras.map((extra) => <li key={extra.key} className="bg-white py-3 text-sm leading-6"><span className="flex flex-wrap justify-between gap-3"><span className="font-medium">{extra.label}</span><span className="tabular font-medium">{formatMoney(extra.total)}{travelers > 1 ? ` (${formatMoney(extra.perPerson)} each)` : ""}</span></span><span>{extra.local ? `${extra.local}. ` : ""}{extra.note} <a href={extra.source} target="_blank" rel="noopener" className="underline">Source ↗</a></span></li>)}</ul>
          </details> : null}
          {result.notPriced?.length ? <details className="group bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3"><span className="font-medium">Not in the total <span className="tabular font-normal">· {result.notPriced.length}</span></span><span aria-hidden="true" className="text-xl transition-transform group-open:rotate-45">+</span></summary>
            <ul className="list-disc space-y-1 pb-4 pl-5 text-sm leading-6">{result.notPriced.map((line) => <li key={line}>{line}</li>)}</ul>
          </details> : null}
        </div>

        <details className="mt-8">
          <summary className="cursor-pointer text-micro font-medium uppercase tracking-label">How GlobTrek built this price</summary>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>Places to stay, food, things to do and getting around come from GlobTrek&apos;s price model for each stop and month: local restaurant prices, hostel and hotel prices we checked on Booking.com, and government lodging rates where they exist.</li>
            <li>Flights are GlobTrek&apos;s fare estimate for each route and month. A one-way leg on a multi-stop trip is priced at 60% of that route&apos;s round trip, because one-way tickets usually cost more than half.</li>
            <li>Tickets and expedition ships use their published prices, with the source linked. Prices change; check them before you pay.</li>
            <li>GlobTrek doesn&apos;t add a fee. You book directly with Booking.com and the operators, and pay them.</li>
          </ul>
        </details>
      </div>
    </div>}
  </section>;
}

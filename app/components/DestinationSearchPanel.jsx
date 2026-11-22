"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { destinations } from "../data/destinations";
import { discoverySliderToUnknownness, legacyBudgetLabel } from "../lib/recommendation/travelerProfile";
import { searchDestinations } from "../lib/search/destinationSearch";
import { BUDGETS as PLACE_BUDGETS, BUDGET_KEYS } from "../lib/anyplace/rank";
import { useAuth } from "./AuthProvider";
import { AirportAutocomplete } from "./AirportAutocomplete";
import { CJ_LINKS, cjTracked } from "../lib/booking/cj";

const VIBES = ["Food", "Culture", "Nature", "Nightlife"];
const PACES = ["Slow mornings", "Balanced days", "Packed schedule"];
const BUDGETS = [750, 1000, 1500, 2500];

function titleCase(value) {
  return String(value).toLowerCase().replace(/(^|[\s&-])\S/g, (letter) => letter.toUpperCase());
}

export function DestinationSearchPanel({ onClose }) {
  const open = true;
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState(null);
  const [budget, setBudget] = useState(1500);
  const [vibe, setVibe] = useState("Food");
  const [pace, setPace] = useState("Balanced days");
  const [knownness, setKnownness] = useState(50);
  const [included, setIncluded] = useState({ flights: true, hotel: true, food: true, activities: true, transportation: true });
  const [originAirport, setOriginAirport] = useState("");
  const { user } = useAuth();
  // Any place in the world, from Google Places through our server (the key never reaches the browser).
  const [places, setPlaces] = useState([]);
  const [anywhere, setAnywhere] = useState(null);
  const [anyBudget, setAnyBudget] = useState("mid");
  const [mode, setMode] = useState("search");
  const [found, setFound] = useState({ hotels: [], moreHotels: [], activities: [] });
  const [flyFrom, setFlyFrom] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [sessionToken] = useState(() => (globalThis.crypto?.randomUUID?.() || String(Date.now())).replace(/-/g, ""));

  const suggestions = useMemo(() => {
    return searchDestinations(destinations, query);
  }, [query]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/places/autocomplete?q=${encodeURIComponent(text)}&s=${sessionToken}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : { suggestions: [] }).then((payload) => setPlaces(payload.suggestions || [])).catch(() => {});
      fetch(`/api/search?q=${encodeURIComponent(text)}&s=${sessionToken}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : { hotels: [], moreHotels: [], activities: [] }).then((payload) => setFound({ hotels: payload.hotels || [], moreHotels: payload.moreHotels || [], activities: payload.activities || [] })).catch(() => {});
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, sessionToken]);
  const featuredNames = new Set(suggestions.map((item) => String(item.city).toLowerCase()));
  const otherPlaces = query.trim().length < 3 ? [] : places.filter((item) => !featuredNames.has(item.name.toLowerCase()));

  // Three of each at a time; "Show more" opens the rest of that list.
  const long = query.trim().length >= 3;
  const row = "flex w-full items-center justify-between gap-4 border-b border-black/10 py-4 text-left transition hover:pl-2";
  const destinationRows = [
    ...suggestions.map((item) => <button key={item.id || item.airport} type="button" onClick={() => setDestination(item)} className={row}><span><strong className="font-serif text-xl font-normal">{titleCase(item.city)}</strong><span className="ml-3 text-micro uppercase tracking-label">{titleCase(item.country)}</span></span><span className="text-micro tracking-label">{item.airport}</span></button>),
    ...otherPlaces.map((item) => <button key={item.placeId} type="button" onClick={() => setAnywhere(item)} className={row}><span><strong className="font-serif text-xl font-normal">{item.name}</strong><span className="ml-3 text-micro uppercase tracking-label">{item.detail}</span></span></button>),
  ];
  const hotelRows = !long ? [] : [
    ...found.hotels.map((item) => <a key={item.id} href={`/hotels/${item.id}`} className={row}><span className="min-w-0"><strong className="block truncate font-serif text-xl font-normal">{item.name}</strong><span className="text-micro uppercase tracking-label">{[item.city, item.country].filter(Boolean).join(", ")}</span></span><span className="shrink-0 text-micro tracking-label">{item.stars ? `${item.stars}★` : item.category || ""}</span></a>),
    ...(found.moreHotels || []).map((item) => <a key={item.placeId} href={`/stays/${encodeURIComponent(item.placeId)}`} className={row}><span className="min-w-0"><strong className="block truncate font-serif text-xl font-normal">{item.name}</strong><span className="text-micro uppercase tracking-label">{item.detail}</span></span><span className="shrink-0 text-micro tracking-label">Hotel</span></a>),
  ];
  const thingRows = !long ? [] : found.activities.map((item) => <a key={item.placeId} href={`/things-to-do/${encodeURIComponent(item.placeId)}`} className={row}><span className="min-w-0"><strong className="block truncate font-serif text-xl font-normal">{item.name}</strong><span className="text-micro uppercase tracking-label">{item.detail}</span></span></a>);
  const shown = (list, rows) => (expanded[list] ? rows : rows.slice(0, 3));
  const moreButton = (list, rows) => (rows.length > 3 && !expanded[list] ? <button type="button" onClick={() => setExpanded((current) => ({ ...current, [list]: true }))} className="mt-2 min-h-11 text-micro font-medium uppercase tracking-label underline underline-offset-4">Show {rows.length - 3} more</button> : null);

  useEffect(() => { if (!open || !user || originAirport) return; fetch("/api/account").then((response) => response.ok ? response.json() : null).then((payload) => { if (payload?.profile?.home_airport) setOriginAirport(payload.profile.home_airport); }).catch(() => {}); }, [open, originAirport, user]);

  useEffect(() => {
    function onKey(event) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function close() {
    setDestination(null);
    setAnywhere(null);
    setQuery("");
    onClose();
  }

  function launch() {
    if (!destination) return;
    const answers = {
      alive: destination.tags.includes("Ocean") ? "Ocean" : destination.tags.includes("Mountains") ? "Mountains" : destination.tags.includes("Culture") ? "Culture" : destination.tags.includes("Wild") && !destination.tags.includes("Cities") ? "Wild" : "Cities",
      escape: pace,
      self: "Couple",
      duration: "One Week",
      hotel: destination.tags.includes("Private villa") ? "Private villa" : destination.tags.includes("Beach resort") ? "Beach resort" : "Boutique hotel",
      luxury: vibe,
      memory: legacyBudgetLabel(budget),
      exactBudget: budget,
      discovery: discoverySliderToUnknownness(knownness),
      season: "Flexible dates",
      includedBudgetCategories: included,
    };
    window.localStorage.setItem("globtrekQuiz", JSON.stringify({ answers, exactBudget: budget, includedBudgetCategories: included, budgetIncludesFlights: included.flights, budgetIncludesHotel: included.hotel, budgetIncludesFood: included.food, budgetIncludesActivities: included.activities, budgetIncludesTransportation: included.transportation, tripStart: "", tripEnd: "", isFlexible: true, originAirport, guestCount: "2", createdAt: Date.now() }));
    window.location.assign(`/thinking?destination=${encodeURIComponent(destination.id || destination.airport)}`);
  }

  // The header's backdrop blur makes it the containing block for fixed children,
  // so the dialog is mounted on the body to cover the real viewport.
  return createPortal(<>
    {open ? <div className="fixed inset-0 z-[120] grid place-items-center bg-black/30 px-4 py-4 backdrop-blur-[3px]" onMouseDown={close}>
      <section role="dialog" aria-modal="true" aria-label={destination ? `Personalize ${destination.city}` : anywhere ? `Pick a budget for ${anywhere.name}` : "Search destinations"} className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain bg-bg p-6 shadow-overlay sm:p-10" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-6"><div><p className="text-micro uppercase tracking-editorial text-black">{destination ? "A quick edit" : anywhere ? "Pick your budget" : "Search GlobTrek"}</p><h2 className="mt-3 font-serif text-4xl tracking-tight-3 sm:text-5xl">{destination ? titleCase(destination.city) : anywhere ? anywhere.name : mode === "flights" ? "Find a flight." : "Where, or what?"}</h2></div><button type="button" onClick={close} aria-label="Close" className="grid h-10 w-10 place-items-center text-xl font-light">×</button></div>
        {!destination && !anywhere ? <div className="mt-7">
          <div role="tablist" aria-label="What to search" className="flex gap-2">
            {[["search", "Places & hotels"], ["flights", "Flights"]].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key)} className={`min-h-10 border px-4 text-micro uppercase tracking-label ${mode === key ? "border-black bg-black text-white" : "border-black/20"}`}>{label}</button>)}
          </div>
          {mode === "flights" ? <div className="mt-6 grid gap-5">
            <div><p className="text-micro uppercase tracking-editorial">From</p><AirportAutocomplete id="fly-from" value={flyFrom} onChange={setFlyFrom} /></div>
            <div><p className="text-micro uppercase tracking-editorial">To</p><AirportAutocomplete id="fly-to" value={flyTo} onChange={setFlyTo} /></div>
            {flyFrom && flyTo && flyFrom.airportCode !== flyTo.airportCode ? <a href={`/flights/${flyFrom.airportCode}-${flyTo.airportCode}`} className="inline-flex min-h-14 items-center justify-center bg-black px-7 text-micro uppercase tracking-editorial text-white">See this flight →</a> : <span className="inline-flex min-h-14 items-center justify-center bg-black px-7 text-micro uppercase tracking-editorial text-white opacity-40" aria-disabled="true">Pick both airports</span>}
            <p className="text-sm">Book just the flight, or plan a whole trip around it.</p>
          </div> : <>
          <label className="sr-only" htmlFor="destination-search">Search places, hotels and things to do</label><input id="destination-search" autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setExpanded({}); }} placeholder="A city, hotel or sight…" className="mt-5 min-h-16 w-full border-b border-black/20 bg-transparent font-serif text-2xl outline-none placeholder:text-black/45 focus:border-black" />
          <div className="mt-3">
            {destinationRows.length ? <p className="pt-4 text-micro uppercase tracking-editorial">Destinations</p> : null}
            {shown("places", destinationRows)}
            {moreButton("places", destinationRows)}
            {hotelRows.length ? <p className="pt-6 text-micro uppercase tracking-editorial">Hotels</p> : null}
            {shown("hotels", hotelRows)}
            {moreButton("hotels", hotelRows)}
            {thingRows.length ? <p className="pt-6 text-micro uppercase tracking-editorial">Things to do</p> : null}
            {shown("things", thingRows)}
            {moreButton("things", thingRows)}
            {otherPlaces.length || found.activities.length || found.moreHotels?.length ? <p className="pt-3 text-right text-[11px]">Place search by Google Maps</p> : null}
            {query.trim().length >= 3 ? <a href={cjTracked(CJ_LINKS.stays, `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query.trim())}`)} target="_blank" rel="noopener sponsored" className="mt-4 flex w-full items-center justify-between border border-black/15 px-4 py-3 text-sm hover:border-black"><span>Can&apos;t see your hotel? Search &ldquo;{query.trim()}&rdquo; on Booking.com</span><span aria-hidden="true">↗</span></a> : null}
          </div>
          </>}
        </div> : anywhere && !destination ? <div className="mt-9 grid gap-8">
          <fieldset><legend className="text-micro uppercase tracking-editorial text-black">Budget</legend><div className="mt-3 flex flex-wrap gap-2">{BUDGET_KEYS.map((key) => <button key={key} type="button" aria-pressed={anyBudget === key} onClick={() => setAnyBudget(key)} className={`border px-4 py-3 text-micro uppercase tracking-label ${anyBudget === key ? "border-black bg-black text-white" : "border-black/15"}`}>{PLACE_BUDGETS[key].label}</button>)}</div></fieldset>
          <p className="text-sm">The top 3 places to stay, eat and explore in {anywhere.name}, picked by rating.</p>
          <div className="sticky -bottom-6 -mx-6 -mb-6 flex items-center justify-between border-t border-black/10 bg-bg px-6 pb-6 pt-4 sm:-bottom-10 sm:-mx-10 sm:-mb-10 sm:px-10 sm:pb-10 sm:pt-6"><button type="button" onClick={() => setAnywhere(null)} className="text-micro uppercase tracking-editorial text-black">← Back</button><button type="button" onClick={() => window.location.assign(`/places/${encodeURIComponent(anywhere.placeId)}?budget=${anyBudget}&s=${sessionToken}`)} className="min-h-14 bg-black px-7 text-micro uppercase tracking-editorial text-white">Show my picks →</button></div>
        </div> : <div className="mt-9 grid gap-8">
          <fieldset><legend className="text-micro uppercase tracking-editorial text-black">Exact budget</legend><div className="mt-3 flex items-center border-b border-black/20 font-serif text-3xl"><span>$</span><input type="number" inputMode="numeric" min="100" max="1000000" step="50" value={budget} onChange={(event) => setBudget(Math.max(100, Number(event.target.value) || 0))} className="min-h-14 min-w-0 flex-1 bg-transparent px-2 outline-none" /></div><div className="mt-3 flex flex-wrap gap-2">{BUDGETS.map((amount) => <button key={amount} type="button" onClick={() => setBudget(amount)} className="border border-black/12 px-3 py-2 text-micro uppercase tracking-label">${amount.toLocaleString()}</button>)}</div></fieldset>
          <fieldset><legend className="text-micro uppercase tracking-editorial text-black">What should that include?</legend><div className="mt-3 flex flex-wrap gap-2">{Object.keys(included).map((key) => <label key={key} className={`cursor-pointer border px-3 py-3 text-micro uppercase tracking-label ${included[key] ? "border-black bg-black text-white" : "border-black/15"}`}><input type="checkbox" checked={included[key]} onChange={() => setIncluded((current) => ({ ...current, [key]: !current[key] }))} className="sr-only" />{key}</label>)}</div></fieldset>
          <label className="block text-micro uppercase tracking-editorial text-black">Leaving from<input maxLength={3} value={originAirport} onChange={(event) => setOriginAirport(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} placeholder="Airport code" className="mt-3 min-h-12 w-full border-b border-black/20 bg-transparent text-sm tracking-normal outline-none focus:border-black" /></label>
          <fieldset><legend className="text-micro uppercase tracking-editorial text-black">What matters most?</legend><div className="mt-3 flex flex-wrap gap-2">{VIBES.map((item) => <button key={item} type="button" onClick={() => setVibe(item)} className={`border px-4 py-3 text-micro uppercase tracking-label ${vibe === item ? "border-black bg-black text-white" : "border-black/15"}`}>{item}</button>)}</div></fieldset>
          <fieldset><legend className="text-micro uppercase tracking-editorial text-black">Pace</legend><div className="mt-3 flex flex-wrap gap-2">{PACES.map((item) => <button key={item} type="button" onClick={() => setPace(item)} className={`border px-4 py-3 text-micro uppercase tracking-label ${pace === item ? "border-black bg-black text-white" : "border-black/15"}`}>{item}</button>)}</div></fieldset>
          <label className="block"><span className="flex justify-between text-micro uppercase tracking-editorial text-black"><span>Hidden</span><span>Iconic</span></span><input type="range" min="0" max="100" value={knownness} onChange={(event) => setKnownness(Number(event.target.value))} className="mt-4 w-full accent-black" aria-label="Destination knownness" /></label>
          <div className="sticky -bottom-6 -mx-6 -mb-6 flex items-center justify-between border-t border-black/10 bg-bg px-6 pb-6 pt-4 sm:-bottom-10 sm:-mx-10 sm:-mb-10 sm:px-10 sm:pb-10 sm:pt-6"><button type="button" onClick={() => setDestination(null)} className="text-micro uppercase tracking-editorial text-black">← Back</button><button type="button" onClick={launch} className="min-h-14 bg-black px-7 text-micro uppercase tracking-editorial text-white">Build this trip →</button></div>
        </div>}
      </section>
    </div> : null}
  </>, document.body);
}

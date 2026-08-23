"use client";

import { useEffect, useState } from "react";

function label(value) { return value ? `${value.type === "address" ? value.formattedAddress : value.city || value.airportName}${value.airportCode ? ` (${value.airportCode})` : ""}` : ""; }

export function StartingLocationField({ value, onChange, id = "starting-location", placeholder = "City, airport, or code" }) {
  const [query, setQuery] = useState(() => label(value));
  const [locations, setLocations] = useState([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const text = query.trim();
    if (!open || text.length < 2 || label(value) === text) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(() => { setStatus("Searching…"); fetch(`/api/locations/search?q=${encodeURIComponent(text)}`, { signal: controller.signal }).then((response) => response.json()).then((payload) => { setLocations(payload.locations || []); setStatus(payload.locations?.length ? "" : "No verified city or airport found."); }).catch((error) => { if (error.name !== "AbortError") setStatus("Location search is temporarily unavailable."); }); }, 260);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query, value]);
  function choose(location) { onChange(location); setQuery(label(location)); setLocations([]); setOpen(false); setStatus(""); }
  return <div className="relative"><input id={id} aria-label="Leaving from" aria-required="true" role="combobox" aria-expanded={open && locations.length > 0} aria-controls={`${id}-results`} autoComplete="off" value={query} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 150)} onChange={(event) => { setQuery(event.target.value); onChange(null); setOpen(true); }} placeholder={placeholder} className="w-full border-b border-black/30 bg-transparent py-5 text-xl outline-none placeholder:text-black/25 focus:border-black" />{open && (locations.length || status) ? <div id={`${id}-results`} className="absolute inset-x-0 top-full z-40 max-h-80 overflow-auto border border-black/15 bg-[#fbfaf7] shadow-xl">{locations.map((location) => <button type="button" key={location.placeId} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(location)} className="flex w-full items-center justify-between border-b border-black/10 px-5 py-4 text-left last:border-b-0 hover:bg-[#eeeae2]"><span><strong className="block text-sm font-medium">{location.city}</strong><span className="mt-1 block text-[10px] uppercase tracking-[0.1em] text-black/45">{location.airportName || location.formattedAddress}{location.countryName ? ` · ${location.countryName}` : ""}</span></span>{location.airportCode ? <span className="text-xs font-semibold tracking-[0.14em]">{location.airportCode}</span> : null}</button>)}{status ? <p aria-live="polite" className="px-5 py-4 text-xs text-black/45">{status}</p> : null}</div> : null}</div>;
}

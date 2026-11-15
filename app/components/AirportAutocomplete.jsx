"use client";

import { useEffect, useMemo, useState } from "react";

// "Portland, OR" or "Lisbon, PT": enough to tell same-named cities apart.
function airportPlace(airport) {
  const place = airport.city || airport.name;
  return `${place}, ${airport.region || airport.country}`;
}

// The worldwide airport list is large, so it loads only when the field mounts.
function loadAirportSearch() {
  return Promise.all([import("../data/airports.json"), import("../lib/recommendation/travelArea")]).then(([data, travelArea]) => ({
    structuredOrigin: travelArea.structuredOrigin,
    index: (data.default || data).map((airport) => ({ airport, code: airport.code.toLowerCase(), city: airport.city.toLowerCase(), name: airport.name.toLowerCase() })),
  }));
}

export function AirportAutocomplete({ value, onChange, id = "airport-suggestions", className = "relative mt-3" }) {
  const [query, setQuery] = useState(value ? `${value.city || value.airportName} (${value.airportCode})` : "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState(null);
  useEffect(() => { let live = true; loadAirportSearch().then((loaded) => { if (live) setSearch(loaded); }).catch(() => {}); return () => { live = false; }; }, []);
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!normalized || !search) return [];
    const ranked = search.index
      .map(({ airport, code, city, name }) => {
        let rank = 99;
        if (code === normalized) rank = 0;
        else if (city === normalized) rank = 1;
        else if (city.startsWith(normalized)) rank = 2;
        else if (code.startsWith(normalized)) rank = 3;
        else if (name.startsWith(normalized)) rank = 4;
        else if (`${city} ${name} ${code}`.includes(normalized)) rank = 5;
        return { airport, rank };
      })
      // Airfields with no airline service only appear when their code is typed exactly.
      .filter(({ airport, rank }) => rank < 99 && (airport.scheduled || rank === 0))
      .sort((a, b) => a.rank - b.rank || Number(b.airport.scheduled) - Number(a.airport.scheduled) || a.airport.city.localeCompare(b.airport.city));
    return ranked.slice(0, 8).map(({ airport }) => airport);
  }, [normalized, search]);

  function choose(airport) {
    setQuery(`${airportPlace(airport)} (${airport.code})`);
    onChange(search.structuredOrigin(airport.code));
    setOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event) {
    if (!open || !matches.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((current) => (current + 1) % matches.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => (current - 1 + matches.length) % matches.length); }
    if (event.key === "Enter") { event.preventDefault(); choose(matches[activeIndex]); }
    if (event.key === "Escape") setOpen(false);
  }

  return <div className={className}>
    <input
      className="w-full border-0 border-b border-black/25 bg-transparent px-0 py-4 text-lg tracking-tight-1 outline-none transition-colors placeholder:text-black/28 focus:border-black"
      type="text"
      inputMode="text"
      autoComplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open && matches.length > 0}
      aria-controls={id}
      aria-required="true"
      placeholder="City, airport, or code"
      value={query}
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      onKeyDown={handleKeyDown}
      onChange={(event) => { setQuery(event.target.value); onChange(null); setOpen(true); setActiveIndex(0); }}
    />
    {open && normalized && <div id={id} role="listbox" className="absolute inset-x-0 top-full z-50 max-h-80 overflow-y-auto border-x border-b border-black/20 bg-surface shadow-overlay">
      {matches.length ? matches.map((airport, index) => <button
        key={`${airport.code}-${airport.name}`}
        type="button"
        role="option"
        aria-selected={index === activeIndex}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => choose(airport)}
        className={`flex w-full items-center justify-between gap-5 border-t border-black/10 px-5 py-3 text-left transition-colors first:border-t-0 ${index === activeIndex ? "bg-surface-sunken" : "hover:bg-canvas"}`}
      >
        <span className="min-w-0"><strong className="block truncate text-sm font-medium text-black">{airportPlace(airport)}</strong><span className="mt-1 block text-micro uppercase leading-5 tracking-caps text-subtle">{airport.name}</span></span>
        <span className="shrink-0 text-xs font-semibold tracking-label">{airport.code}</span>
      </button>) : <p className="px-5 py-4 text-xs text-subtle">{search ? "No matching airport found." : "Loading airports…"}</p>}
    </div>}
  </div>;
}

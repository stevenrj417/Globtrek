"use client";

import { useMemo, useState } from "react";
import { TripCard } from "../components/TripCard";

function Chips({ label, options, value, onChange }) {
  return <fieldset>
    <legend className="eyebrow">{label}</legend>
    <div className="mt-3 flex flex-wrap gap-2">
      {["All", ...options].map((option) => {
        const active = value === option;
        return <button key={option} type="button" aria-pressed={active} onClick={() => onChange(option)} className={`inline-flex min-h-11 items-center border px-4 text-sm transition-colors duration-150 ${active ? "border-ink bg-ink text-white" : "border-black/20 hover:border-ink"}`}>{option}</button>;
      })}
    </div>
  </fieldset>;
}

export function DestinationBrowser({ destinations, continents, settings }) {
  const [continent, setContinent] = useState("All");
  const [setting, setSetting] = useState("All");
  const [sort, setSort] = useState("budget");

  const visible = useMemo(() => {
    const list = destinations.filter((item) => (continent === "All" || item.continent === continent) && (setting === "All" || item.settings.includes(setting)));
    return sort === "budget" ? list : [...list].sort((a, b) => (sort === "hidden" ? a.knownness - b.knownness : a.name.localeCompare(b.name)));
  }, [destinations, continent, setting, sort]);

  return <>
    <div className="flex flex-col gap-6 border-b border-black/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
        <Chips label="Continent" options={continents.filter((name) => destinations.some((item) => item.continent === name))} value={continent} onChange={setContinent} />
        <Chips label="Vibe" options={settings} value={setting} onChange={setSetting} />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <span className="eyebrow">Sort</span>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 border border-black/20 bg-transparent px-3 text-sm">
          <option value="budget">Lowest estimate first</option>
          <option value="hidden">Least known first</option>
          <option value="name">A to Z</option>
        </select>
      </label>
    </div>
    <p className="tabular mt-6 text-sm text-subtle" aria-live="polite">{visible.length} destination{visible.length === 1 ? "" : "s"}</p>
    {visible.length ? <div className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
      {visible.map((item) => <TripCard key={item.id} trip={item} href={`/destinations/${item.slug}`} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />)}
    </div> : <div className="py-20 text-center">
      <p className="text-lg">No destinations match those filters.</p>
      <button type="button" onClick={() => { setContinent("All"); setSetting("All"); }} className="btn btn-secondary mt-6">Clear filters</button>
    </div>}
  </>;
}

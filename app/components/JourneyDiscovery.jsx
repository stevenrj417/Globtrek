"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExactPlacePhoto } from "./ExactPlacePhoto";

export function JourneySearch({ items, basePath, label = "Where do you want to go?" }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => { const value = query.trim().toLowerCase(); return value ? items.filter((item) => [item.name, ...(item.aliases || [])].some((text) => text.toLowerCase().includes(value))).slice(0, 5) : []; }, [items, query]);
  return <div className="relative mx-auto max-w-4xl"><label className="text-[10px] uppercase tracking-[0.2em] text-black/45">{label}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a region or journey" className="mt-4 w-full border-b border-black/30 bg-transparent py-5 font-serif text-3xl tracking-[-0.04em] outline-none placeholder:text-black/18 sm:text-5xl" /></label>{query ? <div className="absolute inset-x-0 top-full z-30 border border-black/15 bg-[#fbfaf7] shadow-xl">{results.length ? results.map((item) => <Link key={item.id} href={`${basePath}?journey=${encodeURIComponent(item.id)}`} className="flex items-center justify-between border-b border-black/10 px-5 py-4 text-sm last:border-b-0 hover:bg-[#eeeae2]"><span>{item.name}</span><span aria-hidden="true">→</span></Link>) : <p className="px-5 py-5 text-sm text-black/45">No verified journey matches that search yet.</p>}</div> : null}</div>;
}

export function JourneyCards({ items, basePath, eyebrow }) {
  return <section className="border-t border-black/10 px-6 py-20 sm:px-10 sm:py-28"><div className="mx-auto max-w-[1450px]"><p className="text-center text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">{eyebrow}</p><div className="mt-12 grid gap-8 md:grid-cols-3">{items.slice(0, 3).map((item) => <article key={item.id} className="group relative"><div className="relative aspect-[4/5] overflow-hidden bg-[#d8d4ca]"><ExactPlacePhoto placeId={item.placeId} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" /></div><div className="border-b border-black/12 py-5"><h3 className="font-serif text-3xl tracking-[-0.04em]"><Link href={`${basePath}?journey=${encodeURIComponent(item.id)}`} className="after:absolute after:inset-0">{item.name}</Link></h3><p className="mt-3 max-w-sm text-sm leading-6 text-black/48">{item.description}</p></div></article>)}</div></div></section>;
}

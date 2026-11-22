"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// The search panel carries the whole destination catalog, so it loads only when opened.
const DestinationSearchPanel = dynamic(() => import("./DestinationSearchPanel").then((module) => module.DestinationSearchPanel), { ssr: false });

export function DestinationSearch({ variant }) {
  const [open, setOpen] = useState(false);
  const warm = () => import("./DestinationSearchPanel");
  if (variant === "hero") return <>
    <button type="button" onClick={() => setOpen(true)} onPointerEnter={warm} onFocus={warm} className="flex min-h-14 w-full max-w-xl items-center gap-3 border border-white/55 bg-white/10 px-5 text-left text-base text-white backdrop-blur-md transition-colors hover:border-white hover:bg-white/20" aria-label="Search places, hotels, things to do and flights"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-current" strokeWidth="1.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>Search a city, hotel or sight</button>
    {open ? <DestinationSearchPanel onClose={() => setOpen(false)} /> : null}
  </>;
  return <>
    <button type="button" onClick={() => setOpen(true)} onPointerEnter={() => import("./DestinationSearchPanel")} onFocus={() => import("./DestinationSearchPanel")} className="flex min-h-11 items-center gap-2 text-micro uppercase tracking-label text-muted transition-colors duration-150 hover:text-ink" aria-label="Search places, hotels, things to do and flights"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg><span className="hidden xl:inline">Search</span></button>
    {open ? <DestinationSearchPanel onClose={() => setOpen(false)} /> : null}
  </>;
}

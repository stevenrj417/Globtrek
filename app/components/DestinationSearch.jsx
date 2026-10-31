"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// The search panel carries the whole destination catalog, so it loads only when opened.
const DestinationSearchPanel = dynamic(() => import("./DestinationSearchPanel").then((module) => module.DestinationSearchPanel), { ssr: false });

export function DestinationSearch() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} onPointerEnter={() => import("./DestinationSearchPanel")} onFocus={() => import("./DestinationSearchPanel")} className="flex min-h-11 items-center gap-2 text-micro uppercase tracking-label text-muted transition-colors duration-150 hover:text-ink" aria-label="Search destinations"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.5"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg><span className="hidden xl:inline">Search</span></button>
    {open ? <DestinationSearchPanel onClose={() => setOpen(false)} /> : null}
  </>;
}

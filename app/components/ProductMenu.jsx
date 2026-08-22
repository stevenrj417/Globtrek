"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandMark";

const products = [
  { label: "GlobTrek Trips", href: "/", note: "Personalized journeys" },
  { label: "GlobTrek Cruises", href: "/cruises", note: "Voyages shaped around you" },
  { label: "GlobTrek Road Trips", href: "/road-trips", note: "The open road, considered" },
];

export function ProductMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return <div className="relative z-50" ref={root}>
    <button type="button" aria-expanded={open} aria-haspopup="menu" aria-controls="globtrek-product-menu" onClick={() => setOpen((value) => !value)} className="group inline-flex min-h-12 items-center gap-2.5 text-2xl font-bold tracking-[-0.06em] sm:text-3xl">
      <span>globtrek</span>
      <BrandMark className="transition-transform duration-500 ease-out group-hover:translate-x-0.5" />
      <span className={`ml-0.5 text-[10px] font-medium tracking-normal transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
      <span className="sr-only">Choose a GlobTrek experience</span>
    </button>
    {open ? <div id="globtrek-product-menu" role="menu" className="absolute left-0 top-full mt-3 w-[min(22rem,calc(100vw-2.5rem))] border border-black/12 bg-[#f7f7f4] p-2 shadow-[0_24px_70px_rgba(0,0,0,.16)]">
      {products.map((product, index) => <Link key={product.href} role="menuitem" href={product.href} onClick={() => setOpen(false)} className="group/item flex items-center justify-between gap-5 border-b border-black/10 px-4 py-4 last:border-b-0 hover:bg-white/70 focus-visible:bg-white/70">
        <span><strong className="block text-sm font-medium tracking-[-0.02em]">{product.label}</strong><span className="mt-1 block text-[10px] font-normal tracking-normal text-black/50">{product.note}</span></span>
        <span className="text-xs text-[#9b7b43]" aria-hidden="true">{index === 0 ? "●" : "→"}</span>
      </Link>)}
    </div> : null}
  </div>;
}

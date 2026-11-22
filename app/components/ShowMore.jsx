"use client";

import { useState } from "react";

// Shows the first few items of a list, with a button that opens the rest.
export function ShowMore({ items, first = 3, className = "", label = "Show more" }) {
  const [open, setOpen] = useState(false);
  const visible = open ? items : items.slice(0, first);
  return <>
    <ul className={className}>{visible}</ul>
    {!open && items.length > first ? <button type="button" onClick={() => setOpen(true)} className="mt-10 inline-flex min-h-12 items-center border border-black px-6 text-micro font-medium uppercase tracking-label transition-colors hover:bg-black hover:text-white">{label} ({items.length - first})</button> : null}
  </>;
}

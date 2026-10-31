"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatNights, formatRange } from "../lib/recommendation/tripEstimate";

// "What's included" popover for any non-live trip estimate.
export function EstimateDetails({ estimate, light = false, align = "center" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) { if (!root.current?.contains(event.target)) setOpen(false); }
    function onKey(event) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!estimate?.breakdown?.length) return null;
  const position = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return <span ref={root} className="relative inline-block">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((value) => !value); }} className={`min-h-11 text-xs underline decoration-1 underline-offset-4 transition-colors ${light ? "text-white/85 decoration-white/40 hover:text-white" : "text-muted decoration-black/25 hover:text-ink"}`}>
      What&apos;s included
    </button>
    {open ? <span id={id} role="dialog" aria-label="What this estimate includes" className={`absolute top-full z-30 mt-1 block w-[min(20rem,calc(100vw-2.5rem))] border border-black/10 bg-surface-raised p-5 text-left text-ink shadow-overlay ${position}`}>
      <span className="eyebrow block">Estimate for {estimate.travelers} traveler{estimate.travelers === 1 ? "" : "s"} · {formatNights(estimate.nights)}</span>
      <span className="mt-4 block divide-y divide-black/10 border-y border-black/10">
        {estimate.breakdown.map((item) => <span key={item.key} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
          <span className="text-muted">{item.label}</span>
          <span className="tabular font-medium">{formatRange(item.low, item.high)}</span>
        </span>)}
      </span>
      <span className="flex items-baseline justify-between gap-4 pt-3 text-sm font-semibold">
        <span>Total</span>
        <span className="tabular">{formatRange(estimate.low, estimate.high)}</span>
      </span>
      <span className="mt-4 block text-xs leading-5 text-subtle">Not included: {estimate.excludes.join(", ").toLowerCase()}. {estimate.basis}</span>
    </span> : null}
  </span>;
}

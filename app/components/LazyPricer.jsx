"use client";

import { useState } from "react";
import { TripPricer } from "./TripPricer";

// A price calculator that loads only when the traveler asks for it.
export function LazyPricer({ label = "Price this trip", ...props }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-12 items-center justify-center border border-black px-5 text-micro font-medium uppercase tracking-label hover:bg-black hover:text-white">{label} →</button>;
  return <TripPricer {...props} />;
}

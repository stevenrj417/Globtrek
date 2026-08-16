"use client";

import { useState } from "react";

export function EmailTripButton({ trip, viewUrl, className = "" }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event) {
    event.preventDefault();
    setStatus("Sending…");
    const response = await fetch("/api/email/trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, trip, viewUrl }) });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok ? "Sent. Check your inbox." : data.error || "Could not send.");
  }

  return <><button type="button" onClick={() => setOpen(true)} className={className}>Email this trip</button>{open ? <div className="fixed inset-0 z-[150] grid place-items-center bg-black/35 px-4 backdrop-blur-sm" onMouseDown={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-label="Email my trip" className="w-full max-w-lg bg-[#f7f7f4] p-7 shadow-2xl sm:p-10" onMouseDown={(event) => event.stopPropagation()}><div className="flex justify-between gap-6"><div><p className="text-[9px] uppercase tracking-[0.24em] text-black/40">Take it with you</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.04em]">Email my trip.</h2></div><button type="button" onClick={() => setOpen(false)} className="h-10 w-10 text-xl" aria-label="Close">×</button></div><p className="mt-5 text-sm font-light leading-6 text-black/55">We’ll send the complete itinerary—not only the three-day preview. This does not subscribe you to marketing.</p><form onSubmit={submit} className="mt-8"><label className="sr-only" htmlFor="trip-email">Email address</label><input id="trip-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-14 w-full border-b border-black/25 bg-transparent text-base outline-none focus:border-black" /><button className="mt-6 min-h-14 bg-black px-7 text-[9px] uppercase tracking-[0.2em] text-white">Send full trip →</button><p role="status" className="mt-4 min-h-5 text-xs text-black/50">{status}</p></form></section></div> : null}</>;
}

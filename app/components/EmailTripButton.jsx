"use client";

import { useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

export function EmailTripButton({ trip, viewUrl, className = "" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [sentFingerprint, setSentFingerprint] = useState(null);
  const sendingRef = useRef(false);
  const selectionFingerprint = JSON.stringify(trip?.bookingManifest || trip?.selections || trip?.clientTripKey || null);
  const tripSent = status === "Trip sent" && sentFingerprint === selectionFingerprint;

  async function send(recipient) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setStatus("Sending…");
    try {
      const response = await fetch("/api/email/trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: recipient, trip, viewUrl }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.sent) throw new Error(data.error || "Could not send.");
      setStatus("Trip sent");
      setSentFingerprint(selectionFingerprint);
      setOpen(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function submit(event) { event.preventDefault(); send(email); }
  function begin() {
    if (sending) return;
    const accountEmail = user?.email || null;
    if (accountEmail) {
      setEmail(accountEmail);
      send(accountEmail);
    } else {
      setOpen(true);
    }
  }

  return <><button type="button" onClick={begin} disabled={sending} className={className}>{sending ? "Sending…" : tripSent ? "Trip sent" : "Email this trip"}</button>{open ? <div className="fixed inset-0 z-[150] grid place-items-center bg-black/35 px-4 backdrop-blur-sm" onMouseDown={() => !sending && setOpen(false)}><section role="dialog" aria-modal="true" aria-label="Email my trip" className="w-full max-w-lg bg-[#f7f7f4] p-7 shadow-2xl sm:p-10" onMouseDown={(event) => event.stopPropagation()}><div className="flex justify-between gap-6"><h2 className="font-serif text-4xl tracking-[-0.04em]">Where should we send your trip?</h2><button type="button" onClick={() => setOpen(false)} disabled={sending} className="h-10 w-10 text-xl" aria-label="Close">×</button></div><form onSubmit={submit} className="mt-8"><label className="sr-only" htmlFor="trip-email">Email address</label><input id="trip-email" type="email" required disabled={sending} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="min-h-14 w-full border-b border-black/25 bg-transparent text-base outline-none focus:border-black" /><button disabled={sending} className="mt-6 min-h-14 bg-black px-7 text-[9px] uppercase tracking-[0.2em] text-white disabled:opacity-50">{sending ? "Sending…" : "Send my trip"}</button><p role="status" className="mt-4 min-h-5 text-xs text-black/50">{status}</p></form></section></div> : null}</>;
}

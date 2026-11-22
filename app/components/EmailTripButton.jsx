"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./AuthProvider";

export function EmailTripButton({ trip, viewUrl, className = "" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  // Most visitors see the box ticked; the server says when the law needs it empty.
  const [marketing, setMarketing] = useState(false);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [sentFingerprint, setSentFingerprint] = useState(null);
  const [note, setNote] = useState("");
  const sendingRef = useRef(false);
  const touched = useRef(false);
  const selectionFingerprint = JSON.stringify(trip?.bookingManifest || trip?.selections || trip?.clientTripKey || null);
  const tripSent = status === "Trip sent" && sentFingerprint === selectionFingerprint;

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    fetch("/api/email/consent-default", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!touched.current) setMarketing(data?.checked === true); })
      .catch(() => {});
    const onKey = (event) => { if (event.key === "Escape" && !sendingRef.current) setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { controller.abort(); document.removeEventListener("keydown", onKey); };
  }, [open]);

  async function send(recipient) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setStatus("Sending…");
    try {
      const response = await fetch("/api/email/trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: recipient, trip, viewUrl, marketingConsent: marketing }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.sent) throw new Error(data.error || "Your trip couldn't be sent. Try again in a minute.");
      setStatus("Trip sent");
      setNote(`Sent to ${recipient}. Check your inbox in a minute.`);
      setSentFingerprint(selectionFingerprint);
      setOpen(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Your trip couldn't be sent.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  useEffect(() => {
    if (!note) return undefined;
    const timer = window.setTimeout(() => setNote(""), 7000);
    return () => window.clearTimeout(timer);
  }, [note]);

  function submit(event) { event.preventDefault(); send(email.trim()); }
  function begin() {
    if (sending) return;
    if (!email && user?.email) setEmail(user.email);
    setStatus("");
    setOpen(true);
  }

  return <>
    <button type="button" onClick={begin} disabled={sending} className={className}>{sending ? "Sending…" : tripSent ? "Trip sent ✓" : "Email me this trip"}</button>
    {note ? <p role="status" className="fixed bottom-24 left-1/2 z-[90] w-[min(92vw,30rem)] -translate-x-1/2 bg-ink px-5 py-3 text-center text-sm text-white shadow-xl">{note}</p> : null}
    {open ? createPortal(<div className="fixed inset-0 z-[150] grid place-items-center bg-black/40 px-4 backdrop-blur-sm" onMouseDown={() => !sending && setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="email-trip-title" className="w-full max-w-md bg-bg p-7 shadow-2xl sm:p-9" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-micro uppercase tracking-label text-subtle">Email me this trip</p>
            <h2 id="email-trip-title" className="mt-2 font-serif text-3xl leading-tight tracking-tight-2">Keep this trip in your inbox</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} disabled={sending} className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center text-2xl font-light" aria-label="Close">×</button>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">Your stay, flight, plans and booking links in one email, so you can come back to it anytime.</p>
        <form onSubmit={submit} className="mt-7">
          <label className="text-micro font-medium uppercase tracking-label" htmlFor="trip-email">Email address</label>
          <input id="trip-email" type="email" autoComplete="email" required autoFocus disabled={sending} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 min-h-12 w-full border border-black/20 bg-white px-4 text-base outline-none transition-colors focus:border-black" />
          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input type="checkbox" checked={marketing} disabled={sending} onChange={(event) => { touched.current = true; setMarketing(event.target.checked); }} className="mt-1 h-4 w-4 shrink-0 accent-black" />
            <span>Also send me GlobTrek travel deals and trip ideas, about once a month. Unsubscribe anytime.</span>
          </label>
          <button disabled={sending} className="mt-7 min-h-13 w-full bg-black px-7 py-4 text-micro font-medium uppercase tracking-label text-white transition-opacity hover:opacity-90 disabled:opacity-50">{sending ? "Sending…" : "Send my trip"}</button>
          <p role="status" className="mt-3 min-h-5 text-center text-xs text-black">{status === "Sending…" ? "" : status}</p>
          <p className="text-center text-xs leading-5 text-subtle">We only use your email for what you choose here. <Link href="/privacy" className="underline underline-offset-2">Privacy policy</Link></p>
        </form>
      </section>
    </div>, document.body) : null}
  </>;
}

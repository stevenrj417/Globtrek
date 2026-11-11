"use client";

import { useState } from "react";

function day(iso) {
  return iso ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso)) : null;
}

// Share a saved trip at an expiring link, or stop sharing it. The warning says
// exactly what a viewer will see before any link exists.
export function ShareTripButton({ tripId, initiallyPublic = false, className = "" }) {
  const [shared, setShared] = useState(initiallyPublic);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  async function update(makePublic) {
    if (!tripId || status === "Working…") return;
    setStatus("Working…");
    const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public: makePublic }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setStatus(response.status === 401 ? "Sign in to share" : data.error || "Could not update sharing");
    setShared(makePublic);
    if (!makePublic) return setStatus("Sharing stopped. The old link no longer works.");
    const url = new URL(data.sharePath, window.location.origin).toString();
    try { await navigator.clipboard.writeText(url); setStatus(`Link copied · expires ${day(data.expiresAt)}`); } catch { setStatus(`${url} · expires ${day(data.expiresAt)}`); }
  }
  return <span className="inline-flex flex-col items-start">
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`min-h-11 ${className}`}>{shared ? "Sharing on" : "Share trip"}</button>
    {open ? <span className="mt-2 block max-w-xs text-xs normal-case leading-5 tracking-normal text-black/70">
      Anyone with the link can see this trip&apos;s destination, dates, budget, travelers and departure airport, but not your name or email. Links expire after 90 days.
      <span className="mt-2 flex flex-wrap gap-3">
        <button type="button" onClick={() => update(true)} className="min-h-11 underline underline-offset-4">{shared ? "Create a new link" : "Create link"}</button>
        {shared ? <button type="button" onClick={() => update(false)} className="min-h-11 underline underline-offset-4">Stop sharing</button> : null}
      </span>
      {status ? <span role="status" className="block">{status}</span> : null}
    </span> : null}
  </span>;
}

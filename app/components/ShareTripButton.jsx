"use client";

import { useState } from "react";

export function ShareTripButton({ tripId, initiallyPublic = false, className = "" }) {
  const [shared, setShared] = useState(initiallyPublic);
  const [status, setStatus] = useState("");
  async function share() {
    if (!tripId || status === "Working…") return;
    setStatus("Working…");
    const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public: true }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setStatus(response.status === 401 ? "Sign in to share" : data.error || "Could not share");
    const url = new URL(data.sharePath, window.location.origin).toString();
    try { await navigator.clipboard.writeText(url); setStatus("Link copied"); } catch { setStatus(url); }
    setShared(true);
  }
  return <button type="button" onClick={share} className={className}>{status || (shared ? "Copy share link" : "Share trip")}</button>;
}

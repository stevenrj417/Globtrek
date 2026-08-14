"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { useAuth } from "./AuthProvider";
import { AuthSheet } from "./AuthSheet";

const PENDING_KEY = "globtrekPendingTrip";

export function SaveTripButton({ trip, className = "" }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  async function save(payload = trip) {
    if (!payload) return;
    let selectedHotel = null;
    try {
      const rawStay = window.localStorage.getItem(`globtrekStay:${payload.destination?.city}`);
      selectedHotel = rawStay ? JSON.parse(rawStay) : null;
    } catch {}
    const completePayload = { ...payload, selections: { ...payload.selections, hotel: selectedHotel } };
    setStatus("Saving…");
    const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(completePayload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || "Could not save");
      return;
    }
    window.localStorage.removeItem(PENDING_KEY);
    setStatus("Saved");
    track("trip_saved", { destination: completePayload.destination?.city || "" });
    window.setTimeout(() => setStatus("Saved trip"), 1800);
  }

  useEffect(() => {
    if (!user) return;
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      const timer = window.setTimeout(() => save(pending), 0);
      return () => window.clearTimeout(timer);
    } catch { window.localStorage.removeItem(PENDING_KEY); }
    // Run only when authentication becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleSave() {
    if (loading) return;
    if (user) return save();
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(trip));
    setOpen(true);
  }

  return <>
    <button type="button" onClick={handleSave} className={className}>{status || "Save trip"}</button>
    <AuthSheet open={open} onClose={() => setOpen(false)} returnTo={typeof window === "undefined" ? "/results" : `${window.location.pathname}${window.location.search}`} />
  </>;
}

"use client";

import { useEffect, useState } from "react";
import { isTripRef, newTripRef } from "../anyplace/trip.js";

// The trip's random reference: from the URL when it has one, else kept in this
// browser per trip, else made now. It rides on CJ links as the SID.
export function useTripRef(key, fromUrl = null) {
  const [ref, setRef] = useState(isTripRef(fromUrl) ? fromUrl : null);
  useEffect(() => {
    if (ref) return;
    const timer = setTimeout(() => {
      const storageKey = `globtrek:ref:${key}`;
      let stored = null;
      try { stored = window.localStorage.getItem(storageKey); } catch {}
      const next = isTripRef(stored) ? stored : newTripRef();
      try { window.localStorage.setItem(storageKey, next); } catch {}
      setRef(next);
    });
    return () => clearTimeout(timer);
  }, [key, ref]);
  return ref;
}

// Which kinds of booking Booking.com has reported for this trip through CJ:
// { flight, stay, activity, car, taxi }. Checked on load and when the traveler
// comes back to the tab (after booking in another one), at most once a minute.
export function useConfirmations(ref) {
  const [state, setState] = useState({ available: false, confirmed: {} });
  useEffect(() => {
    if (!isTripRef(ref)) return undefined;
    let last = 0;
    let cancelled = false;
    async function check() {
      if (Date.now() - last < 60000) return;
      last = Date.now();
      try {
        const response = await fetch(`/api/trip-status?ref=${encodeURIComponent(ref)}`);
        const payload = await response.json();
        if (!cancelled && response.ok) setState({ available: Boolean(payload.available), confirmed: payload.confirmed || {} });
      } catch {}
    }
    check();
    const onFocus = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onFocus); };
  }, [ref]);
  return state;
}

// One item's status: "confirmed" (Booking.com reported it), "marked" (the traveler
// ticked it) or "open".
export function itemStatus({ kind, checked, confirmed }) {
  if (kind && confirmed?.[kind]) return "confirmed";
  return checked ? "marked" : "open";
}

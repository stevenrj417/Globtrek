"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

export const BOOK_EVENT = "globtrek:book-trip";

function once(key) {
  try {
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, "1");
  } catch {}
  return true;
}

// For signed-in travelers: sends "Here's your trip" when they land on a new
// trip, and the trip plus the month of check-ins when they press Book.
// Signed-out visitors use Email this trip instead. Renders a short notice only.
export function TripEmailAutomation({ trip, viewUrl, city }) {
  const { user } = useAuth();
  const [notice, setNotice] = useState("");
  const latest = useRef({ trip, viewUrl });
  useEffect(() => { latest.current = { trip, viewUrl }; }, [trip, viewUrl]);
  const destination = trip?.destination?.id || trip?.destination?.name || city || "";
  const day = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user?.email || !destination || !once(`globtrekArrival:${destination}:${day}`)) return;
    const timer = window.setTimeout(() => {
      fetch("/api/email/trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "arrival", trip: latest.current.trip, viewUrl: latest.current.viewUrl() }) })
        .then((response) => response.json().catch(() => ({})))
        .then((data) => { if (data.sent) setNotice(`We emailed this trip to ${user.email}.`); })
        .catch(() => {});
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [user?.email, destination, day]);

  useEffect(() => {
    if (!user?.email) return undefined;
    function onBook() {
      if (!once(`globtrekBook:${destination}:${day}`)) return;
      fetch("/api/email/trip", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "book", trip: latest.current.trip, viewUrl: latest.current.viewUrl() }) })
        .then((response) => response.json().catch(() => ({})))
        .then((data) => { if (data.sent) setNotice("Trip sent to your inbox. We'll check in a few times this month, and you can stop anytime."); })
        .catch(() => {});
    }
    window.addEventListener(BOOK_EVENT, onBook);
    return () => window.removeEventListener(BOOK_EVENT, onBook);
  }, [user?.email, destination, day]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;
  return <p role="status" className="fixed bottom-24 left-1/2 z-[90] w-[min(92vw,30rem)] -translate-x-1/2 bg-ink px-5 py-3 text-center text-sm text-white shadow-xl">{notice}</p>;
}

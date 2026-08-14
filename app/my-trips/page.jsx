"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { useAuth } from "../components/AuthProvider";
import { AuthSheet } from "../components/AuthSheet";

function tripHref(saved) {
  return saved.trip_data?.sharePath || `/results?destination=${encodeURIComponent(saved.destination_airport || "")}`;
}

function restoreTrip(saved) {
  const hotel = saved.trip_data?.selections?.hotel;
  if (hotel && saved.destination_name) window.localStorage.setItem(`globtrekStay:${saved.destination_name}`, JSON.stringify(hotel));
}

export default function MyTripsPage() {
  const { user, loading } = useAuth();
  const [trips, setTrips] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const timer = window.setTimeout(() => setFetching(false), 0);
      return () => window.clearTimeout(timer);
    }
    fetch("/api/trips").then((response) => response.json()).then((data) => setTrips(data.trips || [])).finally(() => setFetching(false));
  }, [user, loading]);

  async function remove(id) {
    const response = await fetch(`/api/trips/${id}`, { method: "DELETE" });
    if (response.ok) setTrips((current) => current.filter((trip) => trip.id !== id));
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  return <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
    <header className="border-b border-black/10"><div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between px-6 sm:px-10"><Link href="/" className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</Link>{user && <button onClick={signOut} className="text-[9px] uppercase tracking-[0.2em] text-black/50">Sign out</button>}</div></header>
    <section className="mx-auto max-w-[1500px] px-6 py-16 sm:px-10 sm:py-24">
      <p className="text-[10px] uppercase tracking-[0.28em] text-black/40">Your account</p>
      <div className="mt-5 flex flex-col gap-8 border-b border-black/15 pb-12 sm:flex-row sm:items-end sm:justify-between"><h1 className="font-serif text-[clamp(3.5rem,8vw,8rem)] leading-[.88] tracking-[-0.055em]">My Trips</h1><Link href="/discover" className="text-[10px] uppercase tracking-[0.2em]">Find another trip →</Link></div>
      {!loading && !user ? <div className="py-20"><h2 className="font-serif text-3xl">Your saved trips live here.</h2><p className="mt-4 max-w-md text-sm leading-6 text-black/50">Sign in to return to trips you have chosen to keep. You never need an account to use GlobTrek.</p><button onClick={() => setAuthOpen(true)} className="mt-8 min-h-14 bg-black px-8 text-[10px] uppercase tracking-[0.18em] text-white">Sign in</button></div> : fetching ? <p className="py-20 text-xs uppercase tracking-[0.2em] text-black/40">Opening your trips…</p> : trips.length ? <div className="grid gap-px bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => <article key={trip.id} className="flex min-h-72 flex-col justify-between bg-[#f7f7f4] p-7 sm:p-9"><div><p className="text-[9px] uppercase tracking-[0.2em] text-black/40">{trip.destination_country || "Saved trip"}</p><h2 className="mt-5 font-serif text-4xl tracking-[-0.04em]">{trip.destination_name}</h2><p className="mt-4 text-xs leading-5 text-black/45">{trip.start_date && trip.end_date ? `${trip.start_date} — ${trip.end_date}` : "Flexible dates"} · {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}</p></div><div className="mt-10 flex items-center justify-between border-t border-black/10 pt-5"><Link href={tripHref(trip)} onClick={() => restoreTrip(trip)} className="text-[10px] uppercase tracking-[0.18em]">Open trip →</Link><button type="button" onClick={() => remove(trip.id)} className="text-[9px] uppercase tracking-[0.16em] text-black/35 hover:text-black">Delete</button></div></article>)}
      </div> : <div className="py-20"><h2 className="font-serif text-3xl">No saved trips yet.</h2><p className="mt-4 text-sm text-black/50">When a result feels right, choose Save trip.</p></div>}
    </section>
    <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} returnTo="/my-trips" />
  </main>;
}

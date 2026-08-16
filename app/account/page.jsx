"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthSheet } from "../components/AuthSheet";
import { useAuth } from "../components/AuthProvider";
import { createClient } from "../lib/supabase/client";

const SECTIONS = ["Trips", "Saved", "Travel profile", "Recently viewed", "Account"];

function tripHref(trip) {
  return trip.trip_data?.sharePath || `/results?destination=${encodeURIComponent(trip.destination_airport || "")}`;
}

function tripImage(trip) {
  return trip.trip_data?.destination?.image || trip.trip_data?.destination?.imageUrl || trip.trip_data?.heroImage || null;
}

function EmptyState({ title, copy, href, action }) {
  return <div className="border-y border-black/10 py-12 sm:py-16"><p className="font-serif text-3xl tracking-[-0.035em]">{title}</p><p className="mt-3 max-w-md text-sm font-light leading-6 text-black/50">{copy}</p>{href ? <Link href={href} className="mt-7 inline-block text-[10px] uppercase tracking-[0.2em]">{action} →</Link> : null}</div>;
}

function SavedGrid({ items }) {
  return <div className="grid gap-px bg-black/10 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="bg-[#f7f7f4] p-5">
    <div className="relative aspect-[4/3] overflow-hidden bg-black/[.04]">{item.image_url ? <Image src={item.image_url} alt="" fill unoptimized sizes="(max-width: 640px) 90vw, 32vw" className="object-cover" /> : <div className="grid h-full place-items-center text-[9px] uppercase tracking-[0.22em] text-black/30">Saved {item.item_type}</div>}</div>
    <p className="mt-5 text-[9px] uppercase tracking-[0.2em] text-black/38">{item.item_type}</p><h3 className="mt-2 font-serif text-2xl tracking-[-0.025em]">{item.title}</h3>{item.subtitle ? <p className="mt-2 text-xs text-black/45">{item.subtitle}</p> : null}
  </article>)}</div>;
}

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ displayName: "", homeAirport: "", currency: "USD" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    let active = true;
    fetch("/api/account").then((response) => response.json()).then((next) => {
      if (!active) return;
      setData(next);
      setForm({ displayName: next.profile?.display_name || "", homeAirport: next.profile?.home_airport || "", currency: next.profile?.currency || "USD" });
    }).finally(() => active && setFetching(false));
    return () => { active = false; };
  }, [loading, user]);

  const savedDestinations = useMemo(() => (data?.saved || []).filter((item) => item.item_type === "destination"), [data]);
  const savedHotels = useMemo(() => (data?.saved || []).filter((item) => item.item_type === "hotel"), [data]);
  const metadata = user?.user_metadata || {};
  const avatar = data?.profile?.avatar_url || metadata.avatar_url || metadata.picture;

  async function saveProfile(event) {
    event.preventDefault();
    setStatus("Saving…");
    const response = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const next = await response.json();
    if (response.ok) { setData((current) => ({ ...current, profile: next.profile })); setStatus("Saved"); } else setStatus(next.error || "Could not save");
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  async function deleteAccount() {
    const confirmation = window.prompt('Type "DELETE MY ACCOUNT" to permanently delete your Globtrek account and saved data.');
    if (confirmation !== "DELETE MY ACCOUNT") return;
    setStatus("Deleting account…");
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const next = await response.json().catch(() => ({}));
    if (!response.ok) return setStatus(next.error || "Could not delete account");
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  return <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
    <header className="border-b border-black/10"><div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between px-5 sm:px-10"><Link href="/" className="text-xl font-semibold tracking-[-0.055em]">GLOBTREK</Link><Link href="/discover" className="text-[9px] uppercase tracking-[0.2em] text-black/50">Plan a trip</Link></div></header>
    {!loading && !user ? <section className="grid min-h-[calc(100vh-5rem)] place-items-center px-6 py-16 text-center"><div><p className="text-[9px] uppercase tracking-[0.28em] text-black/40">Your Globtrek</p><h1 className="mt-5 font-serif text-5xl tracking-[-0.05em] sm:text-7xl">Keep the places<br />that feel like you.</h1><p className="mx-auto mt-6 max-w-md text-sm font-light leading-6 text-black/50">Trips, saved stays and your travel preferences—quietly kept in one place.</p><button type="button" onClick={() => setAuthOpen(true)} className="mt-9 min-h-14 bg-black px-9 text-[10px] uppercase tracking-[0.2em] text-white">Sign in</button></div></section> : <>
      <section className="mx-auto max-w-[1500px] px-5 pb-10 pt-14 sm:px-10 sm:pb-14 sm:pt-20"><div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] uppercase tracking-[0.28em] text-black/40">Your travel archive</p><h1 className="mt-5 font-serif text-[clamp(3.8rem,8vw,8.5rem)] leading-[.84] tracking-[-0.06em]">Account</h1></div>{avatar ? <Image src={avatar} alt="Your profile" width={72} height={72} unoptimized className="h-16 w-16 rounded-full object-cover ring-1 ring-black/10 sm:h-[72px] sm:w-[72px]" /> : null}</div>
        <nav aria-label="Account sections" className="mt-12 flex gap-7 overflow-x-auto border-t border-black/12 pt-5 [scrollbar-width:none]">{SECTIONS.map((section) => <a key={section} href={`#${section.toLowerCase().replaceAll(" ", "-")}`} className="shrink-0 text-[9px] uppercase tracking-[0.2em] text-black/48 hover:text-black">{section}</a>)}</nav>
      </section>
      {fetching ? <div className="mx-auto max-w-[1500px] px-5 py-24 text-[9px] uppercase tracking-[0.22em] text-black/35 sm:px-10">Opening your archive…</div> : <div className="mx-auto max-w-[1500px] px-5 pb-28 sm:px-10">
        <section id="trips" className="scroll-mt-8 border-t border-black/15 py-14 sm:py-20"><div className="mb-10 flex items-end justify-between"><div><p className="text-[9px] uppercase tracking-[0.24em] text-black/38">01</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">My trips</h2></div><Link href="/discover" className="text-[9px] uppercase tracking-[0.2em]">New trip →</Link></div>
          {data?.trips?.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.trips.map((trip) => <article key={trip.id} className="overflow-hidden border border-black/10 bg-white"><div className="relative aspect-[4/3] bg-black/[.04]">{tripImage(trip) ? <Image src={tripImage(trip)} alt="" fill unoptimized sizes="(max-width: 640px) 90vw, 32vw" className="object-cover" /> : <div className="grid h-full place-items-center text-[9px] uppercase tracking-[0.2em] text-black/30">{trip.destination_country || "Saved trip"}</div>}</div><div className="p-6"><p className="text-[9px] uppercase tracking-[0.2em] text-black/38">{trip.start_date && trip.end_date ? `${trip.start_date} — ${trip.end_date}` : "Flexible dates"}</p><h3 className="mt-3 font-serif text-3xl tracking-[-0.035em]">{trip.destination_name}</h3><Link href={tripHref(trip)} className="mt-7 inline-block text-[9px] uppercase tracking-[0.2em]">Continue planning →</Link></div></article>)}</div> : <EmptyState title="Nothing saved yet." copy="When a trip feels right, save it and it will wait for you here." href="/discover" action="Find your next place" />}
        </section>
        <section id="saved" className="scroll-mt-8 border-t border-black/15 py-14 sm:py-20"><p className="text-[9px] uppercase tracking-[0.24em] text-black/38">02</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Saved</h2><div className="mt-10 grid gap-14"><div><h3 className="mb-5 text-[9px] uppercase tracking-[0.22em] text-black/45">Destinations</h3>{savedDestinations.length ? <SavedGrid items={savedDestinations} /> : <EmptyState title="No places tucked away." copy="Save a destination when you want to remember it without planning it yet." />}</div><div><h3 className="mb-5 text-[9px] uppercase tracking-[0.22em] text-black/45">Hotels</h3>{savedHotels.length ? <SavedGrid items={savedHotels} /> : <EmptyState title="No stays saved." copy="Hotels you heart on a result will collect here." />}</div></div></section>
        <section id="travel-profile" className="scroll-mt-8 border-t border-black/15 py-14 sm:py-20"><p className="text-[9px] uppercase tracking-[0.24em] text-black/38">03</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Travel profile</h2>{Object.keys(data?.profile?.travel_preferences || {}).length ? <div className="mt-10 grid border-l border-t border-black/10 sm:grid-cols-2 lg:grid-cols-4">{[["Pace", data.profile.travel_preferences.pace], ["Budget", data.profile.travel_preferences.budget], ["Discovery", data.profile.travel_preferences.familiarity == null ? null : Number(data.profile.travel_preferences.familiarity) > 65 ? "Off the radar" : Number(data.profile.travel_preferences.familiarity) < 35 ? "Iconic" : "A mix"], ["Stay", data.profile.travel_preferences.quizAnswers?.hotel], ["Setting", data.profile.travel_preferences.quizAnswers?.alive], ["Trip length", data.profile.travel_preferences.quizAnswers?.duration]].filter(([, value]) => value).map(([label, value]) => <div key={label} className="border-b border-r border-black/10 p-5 sm:p-6"><p className="text-[8px] uppercase tracking-[0.2em] text-black/35">{label}</p><p className="mt-3 font-serif text-xl tracking-[-0.02em]">{value}</p></div>)}</div> : <EmptyState title="Your profile is still becoming yours." copy="Complete the quiz and save a trip to start shaping future recommendations." href="/discover" action="Take the quiz" />}</section>
        <section id="recently-viewed" className="scroll-mt-8 border-t border-black/15 py-14 sm:py-20"><p className="text-[9px] uppercase tracking-[0.24em] text-black/38">04</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Recently viewed</h2>{data?.recent?.length ? <div className="mt-10"><SavedGrid items={data.recent} /></div> : <EmptyState title="A clean slate." copy="Places and stays you explore will appear here, ready to revisit." />}</section>
        <section id="account" className="scroll-mt-8 border-t border-black/15 py-14 sm:py-20"><p className="text-[9px] uppercase tracking-[0.24em] text-black/38">05</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Account</h2><div className="mt-10 grid gap-12 lg:grid-cols-[1fr_.7fr]"><form onSubmit={saveProfile} className="grid gap-6 sm:grid-cols-2"><label className="grid gap-2 text-[9px] uppercase tracking-[0.18em] text-black/45">Name<input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} className="min-h-12 border-b border-black/20 bg-transparent text-sm normal-case tracking-normal outline-none focus:border-black" /></label><label className="grid gap-2 text-[9px] uppercase tracking-[0.18em] text-black/45">Email<input value={data?.user?.email || ""} readOnly className="min-h-12 border-b border-black/10 bg-transparent text-sm normal-case tracking-normal text-black/45 outline-none" /></label><label className="grid gap-2 text-[9px] uppercase tracking-[0.18em] text-black/45">Home airport<input maxLength={3} value={form.homeAirport} onChange={(event) => setForm((current) => ({ ...current, homeAirport: event.target.value.toUpperCase() }))} placeholder="PDX" className="min-h-12 border-b border-black/20 bg-transparent text-sm normal-case tracking-normal outline-none focus:border-black" /></label><label className="grid gap-2 text-[9px] uppercase tracking-[0.18em] text-black/45">Currency<select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} className="min-h-12 border-b border-black/20 bg-transparent text-sm normal-case tracking-normal outline-none"><option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option><option>AUD</option><option>JPY</option></select></label><div className="flex items-center gap-5 sm:col-span-2"><button className="min-h-12 bg-black px-7 text-[9px] uppercase tracking-[0.2em] text-white">Save profile</button><span role="status" className="text-xs text-black/45">{status}</span></div></form><div className="border-t border-black/10 pt-7 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0"><p className="text-[9px] uppercase tracking-[0.2em] text-black/40">Connected with</p><p className="mt-3 font-serif text-2xl capitalize">{data?.user?.provider || "Email"}</p><button type="button" onClick={signOut} className="mt-10 text-[9px] uppercase tracking-[0.2em]">Sign out →</button><button type="button" onClick={deleteAccount} className="mt-8 block text-[9px] uppercase tracking-[0.2em] text-red-800/70">Delete account →</button><p className="mt-4 max-w-xs text-[10px] leading-5 text-black/35">Deletion permanently removes your authentication record and cascades through saved Globtrek data.</p></div></div></section>
      </div>}
    </>}
    <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} returnTo="/account" />
  </main>;
}

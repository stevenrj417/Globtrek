"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthSheet } from "../components/AuthSheet";
import { useAuth } from "../components/AuthProvider";
import { HotelPropertyPhoto } from "../components/HotelPropertyPhoto";
import { createClient } from "../lib/supabase/client";
import { ShareTripButton } from "../components/ShareTripButton";
import { TripActions } from "../components/TripActions";
import { ResumeSearchButton } from "../components/ResumeSearchButton";

const SECTIONS = [["Trips", "trips"], ["Saved", "saved"], ["Travel profile", "travel-profile"], ["Recently viewed", "recently-viewed"], ["Settings", "settings"]];
const FALLBACK_HERO = "/quiz/v2/one-week.jpg";
const label = "text-micro uppercase tracking-label text-subtle";
const field = "mt-2 min-h-12 w-full border-b border-black/20 bg-transparent text-base outline-none transition-colors focus:border-ink";

function tripHref(trip) {
  return `/trip/${encodeURIComponent(trip.id)}`;
}

function tripImage(trip) {
  return trip.trip_data?.destination?.image || trip.trip_data?.destination?.imageUrl || trip.trip_data?.heroImage || null;
}

function formatDay(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function tripDates(trip) {
  return trip.start_date && trip.end_date ? `${formatDay(trip.start_date)} – ${formatDay(trip.end_date)}` : "Flexible dates";
}

function SectionHeading({ title, note, action }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
    <div>
      <h2 className="font-serif text-3xl font-normal tracking-tight-2 sm:text-[2.6rem]">{title}</h2>
      {note ? <p className="mt-2 max-w-lg text-sm leading-6 text-muted">{note}</p> : null}
    </div>
    {action}
  </div>;
}

// An empty section still gets a picture, so a new account doesn't look broken.
function PhotoPrompt({ image, alt, title, copy, href, action }) {
  const body = <>
    <div className="relative aspect-[16/10] overflow-hidden bg-placeholder sm:aspect-auto sm:min-h-[220px]">
      <Image src={image} alt={alt} fill className="image-calm object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" sizes="(min-width: 640px) 40vw, 100vw" />
    </div>
    <div className="flex flex-col justify-center p-6 sm:p-10">
      <p className="font-serif text-2xl leading-tight tracking-tight-1 sm:text-3xl">{title}</p>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{copy}</p>
      {href ? <span className="mt-6 text-micro uppercase tracking-label">{action} <span aria-hidden="true">→</span></span> : null}
    </div>
  </>;
  const className = "group grid overflow-hidden border border-black/10 bg-surface sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]";
  return href ? <Link href={href} className={className}>{body}</Link> : <div className={className}>{body}</div>;
}

function SavedGrid({ items }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <article key={item.id} className="group">
    <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
      {item.item_type === "hotel" ? <HotelPropertyPhoto hotel={{ name: item.title, googlePhotoManifestUrl: `/api/hotels/${item.item_key}/google-photos` }} destination={{ city: item.subtitle || "saved destination" }} index={0} /> : item.image_url ? <Image src={item.image_url} alt="" fill unoptimized sizes="(max-width: 640px) 90vw, 25vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-micro uppercase tracking-label text-subtle">Saved {item.item_type}</div>}
      <span className="absolute left-3 top-3 bg-white/90 px-2 py-1 text-micro uppercase tracking-label">{item.item_type}</span>
    </div>
    <h3 className="mt-4 font-serif text-xl tracking-tight-1">{item.title}</h3>
    {item.subtitle ? <p className="mt-1 text-sm text-muted">{item.subtitle}</p> : null}
  </article>)}</div>;
}

function SignedOut({ onSignIn }) {
  return <section className="mx-auto grid max-w-[1500px] gap-10 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16 lg:pb-28 lg:pt-16">
    <div className="rise">
      <p className="text-micro uppercase tracking-editorial text-subtle">Your GlobTrek</p>
      <h1 className="mt-5 max-w-[12ch] font-serif text-[clamp(2.6rem,6vw,5rem)] font-normal leading-[0.98] tracking-tight-2">Every trip, kept in one place.</h1>
      <p className="mt-6 max-w-md text-lg leading-8 text-muted">Save trips and stays, pick up a search where you left it, and keep your home airport ready for next time.</p>
      <button type="button" onClick={onSignIn} className="btn btn-primary mt-9 min-h-12 px-8">Sign in</button>
      <p className="mt-4 text-sm text-subtle">Free, and optional. Planning works without an account.</p>
    </div>
    <div className="grid grid-cols-[1.25fr_1fr] gap-3 sm:gap-4">
      <div className="relative row-span-2 aspect-[3/4] overflow-hidden bg-placeholder">
        <Image src="/quiz/v2/one-week.jpg" alt="Blue domes above the caldera in Oia, Santorini" fill preload className="image-calm hero-drift object-cover" sizes="(min-width: 1024px) 30vw, 55vw" />
      </div>
      <div className="relative aspect-square overflow-hidden bg-placeholder">
        <Image src="/quiz/v2/mountains.jpg" alt="Lago di Carezza below the Latemar, Dolomites" fill className="image-calm object-cover" sizes="(min-width: 1024px) 22vw, 45vw" />
      </div>
      <div className="relative aspect-square overflow-hidden bg-placeholder">
        <Image src="/quiz/v2/food.jpg" alt="A fruit stall at La Boqueria, Barcelona" fill className="image-calm object-cover" sizes="(min-width: 1024px) 22vw, 45vw" />
      </div>
    </div>
  </section>;
}

export function AccountClient() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ displayName: "", homeAirport: "", currency: "USD" });
  const [status, setStatus] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    let active = true;
    fetch("/api/account").then((response) => response.json()).then((next) => {
      if (!active) return;
      setData(next);
      setForm({ displayName: next.profile?.display_name || "", homeAirport: next.profile?.home_airport || "", currency: next.profile?.currency || "USD" });
    }).finally(() => active && setFetching(false));
    fetch("/api/email/preferences").then((response) => response.ok ? response.json() : null).then((preferences) => { if (active && preferences) setMarketingConsent(Boolean(preferences.marketingConsent)); }).catch(() => {});
    return () => { active = false; };
  }, [loading, user]);

  const saved = useMemo(() => data?.saved || [], [data]);
  const savedDestinations = useMemo(() => saved.filter((item) => item.item_type === "destination"), [saved]);
  const savedHotels = useMemo(() => saved.filter((item) => item.item_type === "hotel"), [saved]);
  const metadata = user?.user_metadata || {};
  const avatar = data?.profile?.avatar_url || metadata.avatar_url || metadata.picture;
  const name = form.displayName || metadata.full_name || metadata.name || "";
  const firstName = name.split(/\s/)[0];
  const trips = data?.trips || [];
  const heroTrip = trips.find((trip) => tripImage(trip));
  const preferences = data?.profile?.travel_preferences || {};
  const profileFacts = [["Pace", preferences.pace], ["Budget", preferences.budget], ["Discovery", preferences.familiarity == null ? null : Number(preferences.familiarity) > 65 ? "Off the radar" : Number(preferences.familiarity) < 35 ? "Iconic" : "A mix"], ["Stay", preferences.quizAnswers?.hotel], ["Setting", preferences.quizAnswers?.alive], ["Trip length", preferences.quizAnswers?.duration]].filter(([, value]) => value);

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

  function changeTrips(change) {
    setData((current) => {
      const list = current?.trips || [];
      if (change.type === "remove") return { ...current, trips: list.filter((item) => item.id !== change.id) };
      if (change.type === "add") return { ...current, trips: [change.trip, ...list] };
      return { ...current, trips: list.map((item) => (item.id === change.trip.id ? change.trip : item)) };
    });
  }

  async function deleteAccount() {
    const confirmation = window.prompt('This permanently deletes your GlobTrek account, saved trips, saved places, recent searches and share links. It can\'t be undone. Type "DELETE MY ACCOUNT" to continue.');
    if (confirmation !== "DELETE MY ACCOUNT") return;
    setStatus("Deleting account…");
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation }) });
    const next = await response.json().catch(() => ({}));
    if (!response.ok) return setStatus(next.error || "Could not delete account");
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  async function updateMarketing(event) {
    const nextValue = event.target.checked;
    setMarketingConsent(nextValue);
    const response = await fetch(nextValue ? "/api/email/subscribe" : "/api/email/preferences", { method: nextValue ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextValue ? { email: data?.user?.email, marketingConsent: true } : { marketingConsent: false }) });
    if (!response.ok) { setMarketingConsent(!nextValue); setStatus("Could not update email preference"); } else setStatus("Email preference saved");
  }

  if (!loading && !user) return <>
    <SignedOut onSignIn={() => setAuthOpen(true)} />
    <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} returnTo="/account" />
  </>;

  return <>
    <section className="px-4 pt-4 sm:px-6">
      <div className="relative mx-auto min-h-[340px] max-w-[1880px] overflow-hidden bg-placeholder sm:min-h-[420px]">
        <Image src={heroTrip ? tripImage(heroTrip) : FALLBACK_HERO} alt="" fill preload unoptimized={Boolean(heroTrip)} className="image-calm hero-drift object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" aria-hidden="true" />
        <div className="rise absolute inset-x-0 bottom-0 mx-auto flex max-w-[1500px] flex-col gap-6 px-6 pb-9 text-white sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pb-12">
          <div className="flex items-end gap-5">
            {avatar ? <Image src={avatar} alt="" width={72} height={72} unoptimized className="h-14 w-14 rounded-full object-cover ring-2 ring-white/70 sm:h-[72px] sm:w-[72px]" /> : null}
            <div>
              <p className="text-micro uppercase tracking-editorial text-white/75">{heroTrip ? `Last planned · ${heroTrip.trip_data?.title || heroTrip.destination_name}` : "Your GlobTrek"}</p>
              <h1 className="mt-3 font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-normal leading-none tracking-tight-2 [text-shadow:0_2px_24px_rgba(0,0,0,.3)]">{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}</h1>
            </div>
          </div>
          <Link href="/discover" className="inline-flex min-h-12 shrink-0 items-center gap-2 self-start bg-white px-7 text-micro font-medium uppercase tracking-label text-black transition-opacity hover:opacity-90 sm:self-auto">Plan a new trip <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>

    <nav aria-label="Account sections" className="sticky top-[var(--header-height)] z-30 border-b border-black/10 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] sm:px-8">
        {SECTIONS.map(([title, id]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-black/12 px-4 py-2 text-sm text-muted transition-colors hover:border-ink hover:text-ink">{title}{id === "trips" && trips.length ? <span className="tabular ml-1.5 text-subtle">{trips.length}</span> : id === "saved" && saved.length ? <span className="tabular ml-1.5 text-subtle">{saved.length}</span> : null}</a>)}
      </div>
    </nav>

    {fetching ? <div className="mx-auto grid max-w-[1500px] gap-5 px-5 py-16 sm:grid-cols-3 sm:px-8" aria-label="Loading your account">{[0, 1, 2].map((index) => <div key={index} className="aspect-[4/3] animate-pulse bg-placeholder" />)}</div> : <div className="mx-auto max-w-[1500px] px-5 pb-24 sm:px-8">
      <section id="trips" className="scroll-mt-40 py-14 sm:py-20">
        <SectionHeading title="Your trips" note={trips.length ? "Open a trip to book it, share it or change the dates." : null} action={trips.length ? <Link href="/discover" className="text-micro uppercase tracking-label">New trip <span aria-hidden="true">→</span></Link> : null} />
        {trips.length ? <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{trips.map((trip) => <article key={trip.id} className="group">
          <Link href={tripHref(trip)} className="relative block aspect-[4/3] overflow-hidden bg-placeholder">
            {tripImage(trip) ? <Image src={tripImage(trip)} alt="" fill unoptimized sizes="(max-width: 640px) 90vw, 32vw" className="image-calm object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-micro uppercase tracking-label text-subtle">{trip.destination_country || "Saved trip"}</div>}
            <span className="tabular absolute left-3 top-3 bg-white/90 px-2 py-1 text-micro uppercase tracking-label">{tripDates(trip)}</span>
          </Link>
          <h3 className="mt-5 font-serif text-2xl tracking-tight-1 sm:text-[1.7rem]"><Link href={tripHref(trip)} className="hover:underline hover:decoration-black/25 hover:underline-offset-4">{trip.trip_data?.title || trip.destination_name}</Link></h3>
          {trip.destination_country ? <p className="mt-1 text-sm text-muted">{trip.destination_country}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-5"><Link href={tripHref(trip)} className="text-micro uppercase tracking-label">See trip <span aria-hidden="true">→</span></Link><ShareTripButton tripId={trip.id} initiallyPublic={trip.is_public} className="text-micro uppercase tracking-label text-muted" /></div>
          <TripActions trip={trip} onChanged={changeTrips} />
        </article>)}</div> : <PhotoPrompt image="/quiz/v2/surprise-me.jpg" alt="Hot-air balloons lifting off over Cappadocia" title="Your first trip is a few questions away." copy="Take the quiz, save the trip you like, and it will wait for you here." href="/discover" action="Find my trip" />}
      </section>

      <section id="saved" className="scroll-mt-40 border-t border-black/10 py-14 sm:py-20">
        <SectionHeading title="Saved" note="Places and stays you've hearted, without planning them yet." />
        {saved.length ? <div className="grid gap-14">
          {savedDestinations.length ? <div><h3 className={`${label} mb-5`}>Destinations</h3><SavedGrid items={savedDestinations} /></div> : null}
          {savedHotels.length ? <div><h3 className={`${label} mb-5`}>Stays</h3><SavedGrid items={savedHotels} /></div> : null}
        </div> : <PhotoPrompt image="/quiz/v2/private-room.jpg" alt="A canopy bed in a quiet hotel suite" title="Nothing saved yet." copy="Tap the heart on a destination or a stay and it collects here." href="/destinations" action="Browse destinations" />}
      </section>

      <section id="travel-profile" className="scroll-mt-40 border-t border-black/10 py-14 sm:py-20">
        <SectionHeading title="Travel profile" note="Built from your quiz answers. Retake the quiz any time to change it." action={profileFacts.length ? <Link href="/discover" className="text-micro uppercase tracking-label">Retake quiz <span aria-hidden="true">→</span></Link> : null} />
        {profileFacts.length ? <dl className="grid grid-cols-2 gap-px overflow-hidden border border-black/10 bg-black/10 lg:grid-cols-6">{profileFacts.map(([title, value]) => <div key={title} className="bg-surface p-5 sm:p-6"><dt className={label}>{title}</dt><dd className="mt-3 font-serif text-xl tracking-tight-1">{value}</dd></div>)}</dl> : <PhotoPrompt image="/quiz/v2/adventure-days.jpg" alt="A hiker on the ridge of Mangart, Slovenia" title="Tell us how you travel." copy="Your pace, budget and favorite settings appear here after the quiz." href="/discover" action="Take the quiz" />}
      </section>

      <section id="recently-viewed" className="scroll-mt-40 border-t border-black/10 py-14 sm:py-20">
        <SectionHeading title="Recently viewed" />
        {data?.recentSearches?.length ? <div><h3 className={`${label} mb-5`}>Searches</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.recentSearches.map((search) => <article key={search.id} className="border border-black/10 bg-surface p-6"><h4 className="font-serif text-2xl tracking-tight-1">{search.title}</h4><div className="mt-5"><ResumeSearchButton search={search} /></div></article>)}</div></div> : null}
        {data?.recent?.length ? <div className="mt-12"><h3 className={`${label} mb-5`}>Places and trips</h3><SavedGrid items={data.recent} /></div> : null}
        {!data?.recentSearches?.length && !data?.recent?.length ? <p className="text-base text-muted">Places, stays and searches you open will show up here.</p> : null}
      </section>

      <section id="settings" className="scroll-mt-40 border-t border-black/10 py-14 sm:py-20">
        <SectionHeading title="Settings" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
          <form onSubmit={saveProfile} className="grid gap-x-8 gap-y-7 border border-black/10 bg-surface p-6 sm:grid-cols-2 sm:p-8">
            <label className={label}>Name<input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} autoComplete="name" className={`${field} normal-case tracking-normal text-ink`} /></label>
            <label className={label}>Email<input value={data?.user?.email || ""} readOnly className={`${field} border-black/10 normal-case tracking-normal text-muted`} /></label>
            <label className={label}>Home airport<input maxLength={3} value={form.homeAirport} onChange={(event) => setForm((current) => ({ ...current, homeAirport: event.target.value.toUpperCase() }))} placeholder="PDX" className={`${field} uppercase tracking-normal text-ink`} /></label>
            <label className={label}>Currency<select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} className={`${field} normal-case tracking-normal text-ink`}><option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option><option>AUD</option><option>JPY</option></select></label>
            <label className="flex cursor-pointer items-start gap-4 border-t border-black/10 pt-6 sm:col-span-2">
              <input type="checkbox" checked={marketingConsent} onChange={updateMarketing} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
              <span className="text-sm leading-6 text-muted"><strong className="block font-medium text-ink">Monthly trip ideas</strong>A short email once a month with places that fit a small budget. Emails about trips you send yourself are separate.</span>
            </label>
            <div className="flex items-center gap-5 sm:col-span-2"><button className="btn btn-primary min-h-12 px-8">Save</button><span role="status" className="text-sm text-muted">{status}</span></div>
          </form>
          <div className="grid content-start gap-8">
            <div><p className={label}>Signed in with</p><p className="mt-2 font-serif text-2xl capitalize">{data?.user?.provider || "Email"}</p><button type="button" onClick={signOut} className="btn btn-secondary mt-5 min-h-11 px-6">Sign out</button></div>
            <div className="border-t border-black/10 pt-6">
              <p className={label}>Your data</p>
              <a href="/api/account/export" download className="mt-3 flex min-h-11 items-center text-sm underline decoration-black/25 underline-offset-4 hover:decoration-black">Download my data</a>
              <button type="button" onClick={deleteAccount} className="flex min-h-11 items-center text-sm text-danger underline decoration-current/30 underline-offset-4">Delete account</button>
              <p className="mt-2 max-w-xs text-sm leading-6 text-subtle">Deleting removes your sign-in and everything saved to it. It can&apos;t be undone.</p>
            </div>
          </div>
        </div>
      </section>
    </div>}
    <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} returnTo="/account" />
  </>;
}

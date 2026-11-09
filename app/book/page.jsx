import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { BookingLogo } from "../components/PartnerLogo";
import { decodeBookingPage } from "../lib/booking/bookPage";
import { BookingChecklist } from "../components/BookingChecklist";
import { TravelerDetails } from "./TravelerDetails";

export const metadata = { title: "Book your trip", robots: { index: false, follow: false } };

function formatDay(value) {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : null;
}

export default async function BookPage({ searchParams }) {
  const { b } = await searchParams;
  const trip = decodeBookingPage(b);

  if (!trip) return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <section className="mx-auto max-w-[var(--width-reading)] px-5 py-[var(--section-space)] text-center">
      <h1 className="text-3xl font-semibold tracking-tight-2">This booking link has expired or is incomplete.</h1>
      <p className="mt-3 text-muted">Open your trip again and choose Book now, or start a new one.</p>
      <Link href="/discover" className="btn btn-primary mt-8">Find my trip</Link>
    </section>
    <SiteFooter />
  </main>;

  const items = trip.items;
  const dates = trip.start && trip.end ? `${formatDay(trip.start)} – ${formatDay(trip.end)}` : null;
  const summary = [dates, trip.travelers ? `${trip.travelers} traveler${trip.travelers === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ");

  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <section className="mx-auto max-w-[var(--width-reading)] px-5 py-[var(--section-space)]">
      <p className="eyebrow">Book your trip</p>
      <h1 className="mt-3 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight-3">{trip.city || "Your trip"}{trip.country ? <span className="text-muted">, {trip.country}</span> : null}</h1>
      {summary ? <p className="tabular mt-3 text-muted">{summary}</p> : null}
      <ol className="mt-8 space-y-3 border border-black/15 bg-surface p-5 text-sm leading-6">
        <li><strong className="font-semibold">1. Open each booking below.</strong> Each one opens on the partner&apos;s site in a new tab with your dates and travelers filled in where the partner&apos;s link supports it. This page stays open.</li>
        <li><strong className="font-semibold">2. Check the current price and availability</strong> on the partner&apos;s site. GlobTrek&apos;s numbers are estimates; the partner&apos;s price is the one you pay.</li>
        <li><strong className="font-semibold">3. Book and pay on the partner&apos;s site,</strong> then come back and check it off. GlobTrek never sees your payment details. If you&apos;re signed in to <BookingLogo className="mx-0.5 h-3 w-auto" />, it may fill in details saved to your account.</li>
      </ol>
      <div className="mt-8"><BookingChecklist entries={items} tripKey={`book:${trip.city}:${trip.start || ""}:${items.map((item) => item.exactUrl.length).join("-")}`} heading="Your bookings" details={<TravelerDetails />} trip={{ city: trip.city, country: trip.country, start: trip.start, end: trip.end, adults: trip.travelers }} /></div>
      {items.some((item) => item.officialUrl) ? <ul className="mt-4 space-y-1 text-xs text-subtle">{items.filter((item) => item.officialUrl).map((item) => <li key={item.id}>{item.name}: <a href={item.officialUrl} rel="noopener" target="_blank" className="underline decoration-black/25 underline-offset-2 hover:decoration-ink">official site</a></li>)}</ul> : null}
    </section>
    <SiteFooter />
  </main>;
}

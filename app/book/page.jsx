import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { BookingLogo } from "../components/PartnerLogo";
import { decodeBookingPage } from "../lib/booking/bookPage";
import { isCjUrl } from "../lib/booking/cj";
import { OpenAllBookings } from "./OpenAllBookings";

export const metadata = { title: "Book your trip", robots: { index: false, follow: false } };

const LABELS = { hotel: "Stay", flight: "Flight", experience: "Activity", restaurant: "Dinner" };
const ORDER = ["flight", "hotel", "experience", "restaurant"];

function host(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function partnerFor(item) {
  return isCjUrl(item.exactUrl) ? "Booking.com" : host(item.exactUrl);
}

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

  const items = [...trip.items].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  const dates = trip.start && trip.end ? `${formatDay(trip.start)} – ${formatDay(trip.end)}` : null;
  const summary = [dates, trip.travelers ? `${trip.travelers} traveler${trip.travelers === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ");

  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <section className="mx-auto max-w-[var(--width-reading)] px-5 py-[var(--section-space)]">
      <p className="eyebrow">Book your trip</p>
      <h1 className="mt-3 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-tight-3">{trip.city || "Your trip"}{trip.country ? <span className="text-muted">, {trip.country}</span> : null}</h1>
      {summary ? <p className="tabular mt-3 text-muted">{summary}</p> : null}
      <p className="mt-6 text-base leading-7 text-muted">Each booking opens in its own tab with your dates and travelers already filled in. Review the details and confirm on each partner&apos;s site. You pay the partner directly.</p>

      <div className="mt-8"><OpenAllBookings items={items} /></div>

      <ol className="mt-10 divide-y divide-black/10 border-y border-black/10">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">{LABELS[item.type]}</p>
              <p className="mt-1 text-lg font-medium tracking-tight-1">{item.name}</p>
              <p className="mt-0.5 text-sm text-subtle">{partnerFor(item) === "Booking.com" ? <>on <BookingLogo className="h-3 w-auto" /></> : <>on {partnerFor(item)}</>}{item.officialUrl ? <> · <a href={item.officialUrl} rel="noopener" target="_blank" className="underline decoration-black/25 underline-offset-2 hover:decoration-ink">Official site</a></> : null}</p>
            </div>
            <a href={item.exactUrl} target="_blank" rel="noopener sponsored" className="btn btn-secondary shrink-0">Open ↗</a>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs leading-5 text-subtle">GlobTrek may earn a commission when you book through these links. Your price doesn&apos;t change. Prices and availability are confirmed on each partner&apos;s site.</p>
    </section>
    <SiteFooter />
  </main>;
}

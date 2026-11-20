import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { decodeBookingPage } from "../lib/booking/bookPage";
import { BookingChecklist } from "../components/BookingChecklist";
import { TravelerDetails } from "./TravelerDetails";

export const metadata = { title: "Your booking checklist", robots: { index: false, follow: false } };

// Some catalog city names are stored in capitals ("MEXICO CITY").
function titleCase(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (letter) => letter.toUpperCase());
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
      <p className="mt-3 text-muted">Open your trip again and open the booking checklist, or start a new one.</p>
      <Link href="/discover" className="btn btn-primary mt-8">Find my trip</Link>
    </section>
    <SiteFooter />
  </main>;

  const items = trip.items;
  const dates = trip.start && trip.end ? `${formatDay(trip.start)} – ${formatDay(trip.end)}` : null;
  const summary = [dates, trip.travelers ? `${trip.travelers} traveler${trip.travelers === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ");

  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <section className="mx-auto max-w-[1080px] px-5 py-[var(--section-space)] sm:px-8">
      <h1 className="font-serif text-[clamp(2.75rem,6vw,4.5rem)] leading-[.95] tracking-tight-3">{trip.city ? `Book ${titleCase(trip.city)}` : "Book your trip"}</h1>
      {summary ? <p className="tabular mt-4 text-base">{summary}</p> : null}
      <p className="mt-2 max-w-2xl text-sm leading-6">GlobTrek&apos;s prices are estimates. You book and pay on each partner&apos;s site, and GlobTrek never sees your payment details.</p>
      <div className="mt-2"><BookingChecklist entries={items} tripKey={`book:${trip.city}:${trip.start || ""}:${items.map((item) => item.exactUrl.length).join("-")}`} heading="Your bookings" details={<TravelerDetails />} trip={{ city: trip.city, country: trip.country, start: trip.start, end: trip.end, adults: trip.travelers }} /></div>
      {items.some((item) => item.officialUrl) ? <ul className="mt-4 space-y-1 text-xs">{items.filter((item) => item.officialUrl).map((item) => <li key={item.id}>{item.name}: <a href={item.officialUrl} rel="noopener" target="_blank" className="underline decoration-black/25 underline-offset-2 hover:decoration-ink">official site</a></li>)}</ul> : null}
    </section>
    <SiteFooter />
  </main>;
}

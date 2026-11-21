import Image from "next/image";
import Link from "next/link";
import { destinations } from "../data/destinations";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { decodeBookingPage } from "../lib/booking/bookPage";
import { BookingChecklist } from "../components/BookingChecklist";
import { TravelerDetails } from "./TravelerDetails";

export const metadata = { title: "Book your trip", robots: { index: false, follow: false } };

// Some catalog city names are stored in capitals ("MEXICO CITY").
function titleCase(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s'(-])\p{L}/gu, (letter) => letter.toUpperCase());
}

function formatDay(value, year = true) {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : null;
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
  const city = titleCase(trip.city) || "Your trip";
  const place = destinations.find((item) => item.city?.toLowerCase() === trip.city?.toLowerCase() && (!trip.country || item.country?.toLowerCase() === trip.country.toLowerCase()));
  const nights = trip.start && trip.end ? Math.round((Date.parse(trip.end) - Date.parse(trip.start)) / 86400000) : null;
  const sameYear = trip.start?.slice(0, 4) === trip.end?.slice(0, 4);
  const when = trip.start && trip.end ? `${formatDay(trip.start, !sameYear)} – ${formatDay(trip.end)}` : "Flexible dates";
  const stay = items.find((item) => item.type === "hotel");
  const flight = items.find((item) => item.type === "flight");
  const plans = [["experience", "activity", "activities"], ["restaurant", "dinner", "dinners"]].map(([type, one, many]) => { const count = items.filter((item) => item.type === type).length; return count ? `${count} ${count === 1 ? one : many}` : null; }).filter(Boolean).join(", ");
  const overview = [
    ["When", when, [nights ? `${nights} night${nights === 1 ? "" : "s"}` : null, trip.suggested ? "suggested in your season" : null].filter(Boolean).join(", ") || null],
    ["Who", trip.travelers ? `${trip.travelers} traveler${trip.travelers === 1 ? "" : "s"}` : "Travelers", null],
    ["Stay", stay?.name || "Your own place", stay ? "Booking.com" : null],
    flight ? ["Flight", flight.name, "Round trip"] : plans ? ["Plans", plans, null] : null,
  ].filter(Boolean);

  return <main className="min-h-screen bg-canvas text-ink">
    <SiteHeader />
    {place?.image ? <section className="relative mx-auto mt-2 h-[min(62svh,560px)] max-w-[1440px] overflow-hidden sm:mx-6">
      <Image src={place.image} alt={place.imageAlt || `${city}, ${titleCase(trip.country)}`} fill priority sizes="100vw" quality={85} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1080px] px-5 pb-10 text-white sm:px-8 sm:pb-14">
        {trip.country ? <p className="text-micro uppercase tracking-editorial">{titleCase(trip.country)}</p> : null}
        <h1 className="mt-3 font-serif text-[clamp(3.25rem,8vw,6.5rem)] leading-[.9] tracking-tight-3 [text-shadow:0_2px_24px_rgba(0,0,0,.35)]">{city}</h1>
      </div>
    </section> : <section className="mx-auto max-w-[1080px] px-5 pt-16 sm:px-8"><h1 className="font-serif text-[clamp(3rem,7vw,5.5rem)] leading-[.92] tracking-tight-3">{city}</h1></section>}
    <section className="mx-auto max-w-[1080px] px-5 pb-[var(--section-space)] pt-10 sm:px-8 sm:pt-14">
      <h2 className="text-micro uppercase tracking-editorial">Your trip</h2>
      <dl className="mt-4 grid grid-cols-2 border-t border-black md:grid-cols-4">
        {overview.map(([label, value, note], index) => <div key={label} className={`border-b border-black/15 py-5 pr-5 md:border-b-0 ${index ? "md:border-l md:border-black/15 md:pl-6" : ""}`}>
          <dt className="text-micro uppercase tracking-label">{label}</dt>
          <dd className="mt-2 font-serif text-[1.4rem] leading-tight tracking-tight-2">{value}</dd>
          {note ? <dd className="mt-1 text-sm">{note}</dd> : null}
        </div>)}
      </dl>
      {trip.suggested ? <p className="mt-6 max-w-2xl text-sm leading-6">Your dates were flexible, so we picked a weekend in your season. Every link below opens on these dates; change them on the partner&apos;s site if another week suits you.</p> : null}
      <p className={`${trip.suggested ? "mt-2" : "mt-6"} max-w-2xl text-sm leading-6`}>Prices on GlobTrek are estimates. You book and pay on each partner&apos;s site; GlobTrek never sees your card.</p>
      <div className="mt-14"><BookingChecklist entries={items} tripKey={`book:${trip.city}:${trip.start || ""}:${items.map((item) => item.exactUrl.length).join("-")}`} details={<TravelerDetails />} /></div>
      {items.some((item) => item.officialUrl) ? <ul className="mt-4 space-y-1 text-xs">{items.filter((item) => item.officialUrl).map((item) => <li key={item.id}>{item.name}: <a href={item.officialUrl} rel="noopener" target="_blank" className="underline underline-offset-2">official site</a></li>)}</ul> : null}
    </section>
    <SiteFooter />
  </main>;
}

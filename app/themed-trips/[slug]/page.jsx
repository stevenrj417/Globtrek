import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, PageHero } from "../../components/TravelPage";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { ThemeCard } from "../../components/ThemeCard";
import { TrustStrip } from "../../components/TrustStrip";
import { TripPricer } from "../../components/TripPricer";
import { THEME_GROUPS, THEMED_TRIPS, themedTrip } from "../../data/themedTrips";
import { photoFor, themedCard } from "../../lib/themed/cards";
import { AFFILIATE_DISCLOSURE } from "../../lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return THEMED_TRIPS.map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({ params }) {
  const trip = themedTrip((await params).slug);
  if (!trip) return {};
  return { title: `${trip.title}: ${trip.place}, ${trip.days >= 28 ? "1 month" : `${trip.days} days`}`, description: `${trip.hook} Priced from your airport: stays, food, flights and tickets.`, alternates: { canonical: `/themed-trips/${trip.slug}` } };
}

const length = (trip) => (trip.days >= 28 ? "1 month" : `${trip.days} days`);

export default async function ThemedTripPage({ params }) {
  const trip = themedTrip((await params).slug);
  if (!trip) notFound();
  const photo = photoFor(trip);
  const group = THEME_GROUPS.find((item) => item.id === trip.group);
  const more = THEMED_TRIPS.filter((item) => item.group === trip.group && item.slug !== trip.slug).slice(0, 4);
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Trip ideas", "/trip-ideas"], [trip.title, null]]} />
    <PageHero image={photo.url} alt={photo.alt} credit={photo.credit} chips={[group?.short, length(trip)].filter(Boolean)} title={trip.title} subtitle={`${trip.place}. ${trip.hook}`} />
    <section className="mx-auto mt-10 grid max-w-[1280px] gap-10 px-5 sm:mt-14 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      <div>
        <p className="eyebrow">What you&apos;ll do</p>
        <ul className="mt-4 grid gap-px bg-black/10">
          {trip.highlights.map((line, index) => <li key={line} className="flex gap-4 bg-bg py-3 text-base leading-7"><span className="tabular w-6 shrink-0 font-medium">{String(index + 1).padStart(2, "0")}</span>{line}</li>)}
        </ul>
        {trip.pricedFrom ? <p className="mt-5 text-sm leading-6">Priced from {trip.pricedFrom}. GlobTrek doesn&apos;t have its own price data for {trip.place.split(",")[0]} yet.</p> : null}
      </div>
      <div>
        <p className="eyebrow">How it works</p>
        <ol className="mt-4 space-y-4 text-base leading-7">
          <li><strong className="font-medium">1. See the real cost.</strong> Pick your airport, dates and group below. The total includes flights, where you sleep, food, things to do and tickets.</li>
          <li><strong className="font-medium">2. Plan each stop.</strong> &ldquo;Plan and book this stop&rdquo; opens GlobTrek&apos;s planner with your dates, where you choose your stay, flights and dinners.</li>
          <li><strong className="font-medium">3. Book in order.</strong> You book each piece directly on Booking.com or with the operator, and pay them.</li>
        </ol>
      </div>
    </section>
    <div className="mx-auto mt-12 max-w-[1280px] px-5 sm:px-8"><TripPricer kind="trip" slug={trip.slug} bestMonths={trip.bestMonths} /></div>
    <TrustStrip className="mx-auto mt-10 max-w-[1280px] px-5 sm:px-8" />
    {more.length ? <section className="mx-auto mt-[var(--section-space)] max-w-[1520px] px-5 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><h2 className="font-serif text-3xl tracking-tight-3 sm:text-5xl">More trips to {group?.short.toLowerCase()}</h2><Link href={`/trip-ideas#${trip.group}`} className="inline-flex min-h-11 items-center text-micro font-medium uppercase tracking-label underline">All trip ideas</Link></div>
      <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">{more.map((item) => <li key={item.slug}><ThemeCard card={themedCard(item)} /></li>)}</ul>
    </section> : null}
    <p className="mx-auto mt-12 max-w-[1280px] px-5 text-xs leading-5 sm:px-8">{AFFILIATE_DISCLOSURE}</p>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

import Link from "next/link";
import { Breadcrumb, PageHero } from "../components/TravelPage";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ThemeCard } from "../components/ThemeCard";
import { TrustStrip } from "../components/TrustStrip";
import { THEMED_TRIPS } from "../data/themedTrips";
import { photoFor, themedCard, themedGroups } from "../lib/themed/cards";

export const metadata = {
  title: "Themed trips",
  description: "Green juice and yoga in Bali, a month in Kyoto, the northern lights in Tromsø, Petra by candlelight: 51 trips built around a feeling, each priced from your airport.",
  alternates: { canonical: "/themed-trips" },
};

export default function ThemedTripsPage() {
  const groups = themedGroups();
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Themed trips", null]]} width="max-w-[1520px]" />
    <PageHero short centered image={photoFor(THEMED_TRIPS[0]).url} alt={photoFor(THEMED_TRIPS[0]).alt} chips={[`${THEMED_TRIPS.length} trips`]} title="Pick a feeling. We'll price the trip." subtitle="Every trip here is planned stop by stop and priced from your airport, for your dates: stays, food, flights, tickets and all." />
    <nav aria-label="Trip themes" className="mx-auto mt-10 flex max-w-[1520px] flex-wrap justify-center gap-2 px-5 sm:px-8">
      {groups.map((group) => <a key={group.id} href={`#${group.id}`} className="inline-flex min-h-11 items-center gap-2 border border-black/15 px-4 text-micro font-medium uppercase tracking-label transition-colors hover:border-ink">{group.short} <span className="tabular">{group.trips.length}</span></a>)}
      <Link href="/expeditions" className="inline-flex min-h-11 items-center border border-black bg-black px-4 text-micro font-medium uppercase tracking-label text-white">Expeditions →</Link>
    </nav>
    <TrustStrip className="mx-auto mt-10 max-w-[1520px] px-5 sm:px-8" />
    <div className="mx-auto max-w-[1520px] px-5 pb-[var(--section-space)] sm:px-8">
      {groups.map((group, groupIndex) => <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="reveal mt-[var(--section-space)] scroll-mt-24">
        <h2 id={`${group.id}-heading`} className="font-serif text-3xl tracking-tight-3 sm:text-5xl">{group.title}</h2>
        <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {group.trips.map((trip, index) => <li key={trip.slug}><ThemeCard card={themedCard(trip)} eager={groupIndex === 0 && index < 4} /></li>)}
        </ul>
      </section>)}
      <section className="mt-[var(--section-space)] grid gap-8 border border-black bg-white p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div><p className="eyebrow">Can&apos;t choose?</p><h2 className="mt-3 font-serif text-3xl tracking-tight-3 sm:text-5xl">Let GlobTrek surprise you.</h2><p className="mt-3 max-w-xl text-base leading-7">Tell us your budget and how long you have. We&apos;ll pick a place that actually fits it, and show you exactly why.</p></div>
        <Link href="/surprise" className="btn btn-primary min-h-14 justify-self-start lg:justify-self-end">Surprise me</Link>
      </section>
    </div>
    <SiteFooter />
  </main>;
}

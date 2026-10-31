import Link from "next/link";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { TripCard } from "./components/TripCard";
import { trendingTrips } from "./data/trending";

export const metadata = { title: "Page not found · GlobTrek", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-[var(--width-reading)] px-5 py-[var(--section-space)] text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-tight-3">This page took a wrong turn.</h1>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/discover" className="btn btn-primary">Find my trip</Link>
          <Link href="/" className="btn btn-secondary">Go home</Link>
        </div>
      </section>
      <section aria-labelledby="trending-heading" className="border-t border-black/10 py-[var(--section-space)]">
        <div className="mx-auto max-w-[1520px] px-5 sm:px-8">
          <h2 id="trending-heading" className="eyebrow mb-8 text-center">Good-value trips to start from</h2>
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-3 lg:gap-x-8">
            {trendingTrips.map((trip) => <TripCard key={trip.id} trip={trip} href={`/discover/quick?destination=${trip.id}&destinationName=${encodeURIComponent(trip.name)}&source=not_found`} />)}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

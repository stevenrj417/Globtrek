import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { CONTINENTS, SETTING_FILTERS, publishedDestinations } from "../data/destinationCatalog";
import { DestinationBrowser } from "./DestinationBrowser";
import { BookingLogo } from "../components/PartnerLogo";

export const metadata = {
  title: "Destinations on a budget",
  description: "Good-value destinations with estimated trip costs before flights. Filter by continent and vibe.",
  alternates: { canonical: "/destinations" },
};

export default function DestinationsPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-[1520px] px-5 py-[var(--section-space)] sm:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-subtle"><Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">›</span> <span aria-current="page">Destinations</span></nav>
        <h1 className="mt-6 font-serif text-[clamp(2.5rem,5.4vw,5rem)] font-normal leading-[1.02] tracking-tight-2">Destinations</h1>
        <p className="mt-4 max-w-[var(--width-reading)] text-lg leading-8 text-muted">Rock-bottom estimates for one person, 5 nights, before flights: a hostel bed, cheap eats and free things to do. Open one to see what&apos;s included and plan it as your trip.</p>
        <p className="mt-2 text-sm text-subtle">Book stays, flights and attractions on <BookingLogo className="h-3.5 w-auto" /></p>
        <div className="mt-12">
          <DestinationBrowser destinations={publishedDestinations} continents={CONTINENTS} settings={SETTING_FILTERS} />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

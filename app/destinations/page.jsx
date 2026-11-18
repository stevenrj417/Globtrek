import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { CONTINENTS, SETTING_FILTERS, publishedDestinations } from "../data/destinationCatalog";
import { DestinationBrowser } from "./DestinationBrowser";
import { BookingLogo } from "../components/PartnerLogo";
import { SITE_URL } from "../lib/site";
import { Breadcrumb, PageHero } from "../components/TravelPage";

export const metadata = {
  title: "Destinations on a budget",
  description: "Good-value destinations with estimated trip costs before flights. Filter by continent and vibe.",
  alternates: { canonical: "/destinations" },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/destinations`,
      url: `${SITE_URL}/destinations`,
      name: "Destinations on a budget",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: publishedDestinations.length,
        itemListElement: publishedDestinations.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: `${item.name}, ${item.country}`, url: `${SITE_URL}/destinations/${item.slug}` })),
      },
    },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
    ] },
  ],
};

// Only what the cards and filters use: the full records (monthly planning data,
// photo credits, climate text) would ship to the browser for all of them.
const cards = publishedDestinations.map(({ id, slug, name, country, continent, settings, vibe, image, alt, knownness, estimate: { source, lastUpdated, ...estimate } }) => ({ id, slug, name, country, continent, settings, vibe, image, alt, knownness, estimate }));

export default function DestinationsPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader />
      <Breadcrumb items={[["Home", "/"], ["Destinations", null]]} width="max-w-[1520px]" />
      <PageHero short centered image="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" alt="A bright alpine lake and green mountains" chips={[`${publishedDestinations.length} places`]} title="Destinations" subtitle="Lowest-cost estimates for one person, 5 nights, before flights. Open one to see what's included and make it your trip." />
      <div className="mx-auto max-w-[1520px] px-5 pb-[var(--section-space)] sm:px-8">
        <p className="mt-8 text-center text-sm text-subtle">Book stays, flights and attractions on <BookingLogo className="h-3.5 w-auto" /></p>
        <div className="mt-12">
          <DestinationBrowser destinations={cards} continents={CONTINENTS} settings={SETTING_FILTERS} />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

import Link from "next/link";
import { Breadcrumb, PageHero } from "../../components/TravelPage";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { TrustStrip } from "../../components/TrustStrip";
import { TripPricer } from "../../components/TripPricer";
import { PACKAGES, THEMED_PHOTOS, themedTrip } from "../../data/themedTrips";
import { formatMoney } from "../../lib/format";
import { AFFILIATE_DISCLOSURE } from "../../lib/site";

export const metadata = {
  title: "Antarctica expeditions: what a trip really costs",
  description: "Expedition ships from Ushuaia to the Antarctic Peninsula, from about $9,000 a person, with flights and a night at the end of the world priced from your airport.",
  alternates: { canonical: "/expeditions/antarctica" },
};

// Published fares seen for 2026–27 sailings, per person sharing a cabin.
const TIERS = [
  { name: "Small expedition ship", price: "From $9,006", body: "Under 200 passengers, so everyone gets more time ashore. Ocean Victory and Ocean Nova sailings were listed at $9,006 and $10,075.", source: "https://chimuadventures.com/en/antarctica/next-season-cruises" },
  { name: "Premium expedition ship", price: "$16,500 – $18,800", body: "Newer ships with balconies and more space. Quark's 10-night Ocean Explorer sailings were listed in this range.", source: "https://www.taoticket.com/en_AU/co/quark-expeditions/na/ocean-explorer/december" },
  { name: "Luxury expedition", price: "From $26,600", body: "National Geographic Endurance with Lindblad, 10 nights, including taxes and fees.", source: "https://m.icruise.com/itineraries/10-night-voyage-to-antarctica-cruise_national-geographic-endurance_1-2-2027.html" },
];

export default function AntarcticaPage() {
  const photo = THEMED_PHOTOS.antarctica;
  const trip = themedTrip("the-last-continent");
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Expeditions", "/expeditions"], ["Antarctica", null]]} />
    <PageHero image={photo.url} alt={photo.subject} credit={{ artist: photo.artist, source: photo.source, license: photo.license, licenseUrl: photo.licenseUrl }} chips={["November to March", "12 days"]} title="The last continent." subtitle={trip.hook} />
    <section className="mx-auto mt-12 max-w-[1280px] px-5 sm:px-8">
      <p className="eyebrow">Pick your ship</p>
      <h2 className="mt-3 font-serif text-4xl tracking-tight-3 sm:text-5xl">Three ways to go.</h2>
      <ul className="mt-8 grid gap-px bg-black/10 lg:grid-cols-3">{TIERS.map((tier) => <li key={tier.name} className="bg-white p-6"><p className="text-micro font-medium uppercase tracking-label">{tier.name}</p><p className="tabular mt-2 font-serif text-3xl">{tier.price}</p><p className="mt-1 text-sm">a person, sharing a cabin</p><p className="mt-4 text-sm leading-6">{tier.body}</p><a href={tier.source} target="_blank" rel="noopener" className="mt-3 inline-flex min-h-11 items-center text-sm underline">Where we saw this price ↗</a></li>)}</ul>
      <p className="mt-4 text-sm leading-6">The full trip below uses {formatMoney(PACKAGES.antarctica.perPerson.typical)} a person, a typical small-ship fare. All ships include meals on board and the landings. Travel insurance with evacuation cover is required.</p>
    </section>
    <div className="mx-auto mt-12 max-w-[1280px] px-5 sm:px-8"><TripPricer kind="trip" slug={trip.slug} bestMonths={trip.bestMonths} heading="Your Antarctic trip, door to door" /></div>
    <TrustStrip className="mx-auto mt-10 max-w-[1280px] px-5 sm:px-8" />
    <section className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8"><div className="grid gap-6 border border-black bg-white p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center"><div><p className="eyebrow">Going further?</p><h2 className="mt-3 font-serif text-3xl tracking-tight-3 sm:text-5xl">Make it all seven continents.</h2></div><Link href="/expeditions/seven-continents" className="btn btn-primary min-h-14 justify-self-start lg:justify-self-end">Plan seven continents</Link></div></section>
    <p className="mx-auto mt-12 max-w-[1280px] px-5 text-xs leading-5 sm:px-8">{AFFILIATE_DISCLOSURE} GlobTrek isn&apos;t paid by any of these ship operators.</p>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

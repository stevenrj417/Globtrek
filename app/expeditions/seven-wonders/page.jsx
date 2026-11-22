import Image from "../../components/Photo";
import { Breadcrumb, PageHero } from "../../components/TravelPage";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { TrustStrip } from "../../components/TrustStrip";
import { TripPricer } from "../../components/TripPricer";
import { LazyPricer } from "../../components/LazyPricer";
import { EXTRAS, THEMED_PHOTOS } from "../../data/themedTrips";
import { allWonderCards } from "../../lib/themed/cards";
import { formatMoney } from "../../lib/format";
import { priceExtra } from "../../lib/themed/price";
import { AFFILIATE_DISCLOSURE } from "../../lib/site";

export const metadata = {
  title: "The New Seven Wonders: prices to visit each, or all seven in one trip",
  description: "The Colosseum, Petra, the Taj Mahal, the Great Wall, Chichén Itzá, Machu Picchu and Christ the Redeemer: entry tickets, a few nights nearby, and a full round-the-world price from your airport.",
  alternates: { canonical: "/expeditions/seven-wonders" },
};

export default function SevenWondersPage() {
  const wonders = allWonderCards();
  const hero = THEMED_PHOTOS.petra;
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Expeditions", "/expeditions"], ["The Seven Wonders", null]]} />
    <PageHero image={hero.url} alt={hero.subject} credit={{ artist: hero.artist, source: hero.source, license: hero.license, licenseUrl: hero.licenseUrl }} chips={["7 wonders", "5 continents", "About 3 weeks"]} title="All seven wonders, one trip." subtitle="Rome, Petra, Agra, Beijing, the Yucatán, Cusco and Rio, in an order that follows the planet around. Every ticket, flight and night is in the price." />
    <div className="mx-auto mt-12 max-w-[1280px] px-5 sm:px-8"><TripPricer kind="wonders" heading="All seven: your full price" /></div>
    <TrustStrip className="mx-auto mt-10 max-w-[1280px] px-5 sm:px-8" />
    <section aria-labelledby="each-heading" className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
      <p className="eyebrow">Or pick one</p>
      <h2 id="each-heading" className="mt-3 font-serif text-4xl tracking-tight-3 sm:text-6xl">What each wonder costs to visit.</h2>
      <ol className="mt-12 grid gap-16">
        {wonders.map((wonder, index) => {
          const ticket = priceExtra(wonder.extra, { start: new Date().toISOString().slice(0, 10), travelers: 1 });
          return <li key={wonder.slug} id={wonder.slug} className="grid scroll-mt-24 gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
            <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">{wonder.photo.url ? <Image src={wonder.photo.url} alt={wonder.photo.alt} fill className="image-calm object-cover" sizes="(min-width: 1024px) 45vw, 100vw" quality={78} /> : null}{wonder.photo.credit?.artist ? <p className="absolute bottom-2 right-3 text-[10px] text-white">Photo: {wonder.photo.credit.artist}, {wonder.photo.credit.license}</p> : null}</div>
            <div>
              <p className="tabular text-micro font-medium uppercase tracking-label">{String(index + 1).padStart(2, "0")} · {wonder.where}</p>
              <h3 className="mt-2 font-serif text-4xl tracking-tight-3">{wonder.name}</h3>
              <p className="mt-3 text-lg leading-8">{wonder.line}</p>
              <dl className="mt-6 grid gap-px bg-black/10 sm:grid-cols-2">
                <div className="bg-bg py-3 sm:pr-4"><dt className="text-micro uppercase tracking-label">Entry</dt><dd className="tabular mt-1 text-xl font-medium">{ticket ? formatMoney(ticket.perPerson) : "Check locally"}</dd><dd className="text-xs">{ticket?.local ? `${ticket.local} · ` : ""}<a href={EXTRAS[wonder.extra].source} target="_blank" rel="noopener" className="underline">Source ↗</a></dd></div>
                <div className="bg-bg py-3"><dt className="text-micro uppercase tracking-label">{wonder.nights} nights there, before flights</dt><dd className="tabular mt-1 text-xl font-medium">{wonder.landFrom ? formatMoney(wonder.landFrom) : "—"}</dd><dd className="text-xs">One person, good-value stay, food and the ticket</dd></div>
              </dl>
              <p className="mt-3 text-sm">{EXTRAS[wonder.extra].note}</p>
              <div className="mt-6"><LazyPricer label={`Price a trip to ${wonder.name.replace(/^The /, "the ")}`} kind="wonder" slug={wonder.slug} heading={`${wonder.name}: your price`} /></div>
            </div>
          </li>;
        })}
      </ol>
    </section>
    <p className="mx-auto mt-16 max-w-[1280px] px-5 text-xs leading-5 sm:px-8">{AFFILIATE_DISCLOSURE} The New Seven Wonders were chosen in a 2007 public vote run by the New7Wonders Foundation.</p>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

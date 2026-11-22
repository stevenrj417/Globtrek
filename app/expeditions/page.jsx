import Image from "../components/Photo";
import Link from "next/link";
import { Breadcrumb, PageHero } from "../components/TravelPage";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { TrustStrip } from "../components/TrustStrip";
import { THEMED_PHOTOS, PACKAGES, themedTrip } from "../data/themedTrips";
import { allWonderCards, photoFor } from "../lib/themed/cards";
import { formatMoney } from "../lib/format";

export const metadata = {
  title: "Expeditions",
  description: "All seven wonders in one trip, every continent in the months you have, Antarctica by expedition ship and the Sahara by 4x4, priced from your airport.",
  alternates: { canonical: "/expeditions" },
};

function Feature({ href, image, alt, credit, eyebrow, title, body, cta, flip = false }) {
  return <section className="mx-auto mt-[var(--section-space)] grid max-w-[1520px] gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-16">
    <Link href={href} className={`group relative block aspect-[4/3] overflow-hidden bg-placeholder ${flip ? "lg:order-2" : ""}`}>
      {image ? <Image src={image} alt={alt} fill className="image-calm object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="(min-width: 1024px) 50vw, 100vw" quality={78} /> : null}
      {credit?.artist ? <p className="absolute bottom-2 right-3 text-[10px] text-white">Photo: {credit.artist}, {credit.license}</p> : null}
    </Link>
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-4xl tracking-tight-3 sm:text-6xl">{title}</h2>
      <p className="mt-4 max-w-xl text-lg leading-8">{body}</p>
      <Link href={href} className="btn btn-primary mt-8 min-h-14">{cta}</Link>
    </div>
  </section>;
}

export default function ExpeditionsPage() {
  const wonders = allWonderCards();
  const sevenLand = wonders.reduce((all, item) => all + (item.landFrom || 0), 0);
  const ice = PACKAGES.antarctica;
  const sahara = themedTrip("the-great-sahara-crossing");
  const disney = themedTrip("disneyland-just-because");
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Expeditions", null]]} width="max-w-[1520px]" />
    <PageHero centered image={THEMED_PHOTOS.antarctica.url} alt={THEMED_PHOTOS.antarctica.subject} credit={{ artist: THEMED_PHOTOS.antarctica.artist, source: THEMED_PHOTOS.antarctica.source, license: THEMED_PHOTOS.antarctica.license, licenseUrl: THEMED_PHOTOS.antarctica.licenseUrl }} chips={["The big ones"]} title="Trips you'll tell people about for the rest of your life." subtitle="Every wonder, every continent, the bottom of the world. Planned stop by stop and priced from your airport." />
    <TrustStrip className="mx-auto mt-10 max-w-[1520px] px-5 sm:px-8" />

    <section aria-labelledby="wonders-heading" className="mx-auto mt-[var(--section-space)] max-w-[1520px] px-5 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow">The New Seven Wonders</p><h2 id="wonders-heading" className="mt-3 font-serif text-4xl tracking-tight-3 sm:text-6xl">See one. Or see them all.</h2><p className="mt-4 max-w-2xl text-lg leading-8">Each wonder with its entry ticket and a few nights nearby, or all seven in one trip around the world, from about {formatMoney(sevenLand)} a person before flights.</p></div><Link href="/expeditions/seven-wonders" className="btn btn-primary min-h-14">Price all seven</Link></div>
      <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {wonders.map((wonder) => <li key={wonder.slug}><Link href={`/expeditions/seven-wonders#${wonder.slug}`} className="group block"><div className="relative aspect-[4/5] overflow-hidden bg-placeholder">{wonder.photo.url ? <Image src={wonder.photo.url} alt={wonder.photo.alt} fill className="image-calm object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="(min-width: 1024px) 25vw, 50vw" quality={75} /> : null}</div><h3 className="mt-4 text-center text-xl font-medium tracking-tight-2">{wonder.name}</h3><p className="mt-1 text-center text-xs">{wonder.where}</p>{wonder.landFrom ? <p className="tabular mt-2 text-center text-sm font-medium">From {formatMoney(wonder.landFrom)} a person, before flights</p> : null}</Link></li>)}
      </ul>
    </section>

    <Feature href="/expeditions/seven-continents" image={photoFor({ id: "SYD" }).url} alt="Sydney Harbour" eyebrow="Round the world" title="All seven continents." body="Tell us how many months you have. GlobTrek builds the route, the stops, the flights and an Antarctic ship, and prices every night of it." cta="Plan my seven continents" />
    <Feature flip href="/expeditions/antarctica" image={THEMED_PHOTOS.antarctica.url} alt={THEMED_PHOTOS.antarctica.subject} credit={THEMED_PHOTOS.antarctica} eyebrow="Antarctica" title="The last continent." body={`Ten nights on an expedition ship from Ushuaia: penguins, whales and ice. Ships list from ${formatMoney(ice.perPerson.low)} a person, November to March.`} cta="See Antarctica" />
    <Feature href={`/themed-trips/${sahara.slug}`} image={THEMED_PHOTOS.chinguetti.url} alt={THEMED_PHOTOS.chinguetti.subject} credit={THEMED_PHOTOS.chinguetti} eyebrow="Mauritania" title={sahara.title} body={sahara.hook} cta="Price the Sahara" />
    <Feature flip href={`/themed-trips/${disney.slug}`} image={THEMED_PHOTOS.disneyland.url} alt={THEMED_PHOTOS.disneyland.subject} credit={THEMED_PHOTOS.disneyland} eyebrow="Just because" title={disney.title} body={disney.hook} cta="Price Disneyland" />

    <section className="mx-auto mt-[var(--section-space)] max-w-[1520px] px-5 sm:px-8"><div className="grid gap-6 border border-black bg-white p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center"><div><p className="eyebrow">Smaller, softer, still special</p><h2 className="mt-3 font-serif text-3xl tracking-tight-3 sm:text-5xl">51 themed trips.</h2><p className="mt-3 text-base leading-7">Green juice in Bali, a month in Kyoto, Paris mornings, Tromsø nights.</p></div><Link href="/themed-trips" className="btn btn-primary min-h-14 justify-self-start lg:justify-self-end">See themed trips</Link></div></section>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

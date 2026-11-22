import Link from "next/link";
import { Breadcrumb, PageHero } from "../components/TravelPage";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { ShowMore } from "../components/ShowMore";
import { ThemeCard } from "../components/ThemeCard";
import { PACKAGES, THEMED_PHOTOS, THEMED_TRIPS } from "../data/themedTrips";
import { allWonderCards, photoFor, themedCard, themedGroups } from "../lib/themed/cards";

export const metadata = {
  title: "Trip ideas",
  description: "Yoga in Bali, a month in Kyoto, the northern lights in Tromsø, all seven wonders in one trip, Antarctica by ship. Every trip priced from your airport.",
  alternates: { canonical: "/trip-ideas" },
};

const grid = "mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3";
const sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw";

function bigOnes() {
  const wonders = allWonderCards();
  const ice = PACKAGES.antarctica;
  const sydney = photoFor({ id: "SYD" });
  return [
    { href: "/expeditions/seven-wonders", image: wonders[0]?.photo.url, imageAlt: wonders[0]?.photo.alt, chips: ["Expedition"], title: "All seven wonders", place: "One trip around the world", landFrom: wonders.reduce((all, item) => all + (item.landFrom || 0), 0) },
    { href: "/expeditions/seven-continents", image: sydney.url, imageAlt: sydney.alt, chips: ["Expedition"], title: "All seven continents", place: "In the months you have" },
    { href: "/expeditions/antarctica", image: THEMED_PHOTOS.antarctica.url, imageAlt: THEMED_PHOTOS.antarctica.subject, chips: ["Expedition", "Nov–Mar"], title: "Antarctica", place: "Ten nights by ship from Ushuaia", landFrom: ice.perPerson.low },
  ];
}

export default function TripIdeasPage() {
  const groups = themedGroups();
  const hero = photoFor(THEMED_TRIPS[0]);
  const sections = [{ id: "the-big-ones", title: "The big ones", short: "The big ones", cards: bigOnes() }, ...groups.map((group) => ({ ...group, cards: group.trips.map(themedCard) }))];
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Trip ideas", null]]} width="max-w-[1520px]" />
    <PageHero short centered image={hero.url} alt={hero.alt} title="Pick a feeling. We'll price the trip." subtitle="Every trip here is planned stop by stop and priced from your airport, for your dates." />
    <nav aria-label="Trip themes" className="mx-auto mt-10 flex max-w-[1520px] flex-wrap justify-center gap-2 px-5 sm:px-8">
      {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="inline-flex min-h-11 items-center border border-black/15 px-4 text-micro font-medium uppercase tracking-label transition-colors hover:border-ink">{section.short}</a>)}
    </nav>
    <div className="mx-auto max-w-[1520px] px-5 pb-[var(--section-space)] sm:px-8">
      {sections.map((section, sectionIndex) => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="mt-[var(--section-space)] scroll-mt-24">
        <h2 id={`${section.id}-heading`} className="font-serif text-3xl tracking-tight-3 sm:text-5xl">{section.title}</h2>
        <ShowMore className={grid} label="Show more" items={section.cards.map((card, index) => <li key={card.href}><ThemeCard card={card} sizes={sizes} eager={sectionIndex === 0 && index < 3} /></li>)} />
      </section>)}
      <section className="mt-[var(--section-space)] grid gap-8 border border-black bg-white p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div><p className="eyebrow">Can&apos;t choose?</p><h2 className="mt-3 font-serif text-3xl tracking-tight-3 sm:text-5xl">Let GlobTrek surprise you.</h2><p className="mt-3 max-w-xl text-base leading-7">Tell us your budget and how long you have. We&apos;ll pick a place that fits it.</p></div>
        <Link href="/surprise" className="btn btn-primary min-h-14 justify-self-start lg:justify-self-end">Surprise me</Link>
      </section>
    </div>
    <SiteFooter />
  </main>;
}

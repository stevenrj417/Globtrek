import Link from "next/link";
import { GuideCard } from "./GuideCard";
import { Breadcrumb, PageHero } from "../components/TravelPage";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { guideCard, publishedGuides } from "../lib/guides/buildGuide";
import { SITE_URL } from "../lib/site";

export const metadata = {
  title: "Budget travel guides",
  description: "Weekend plans, cheap hotels near the places you want to be, and lists of the cheapest places to go, built from real stays and GlobTrek's trip cost estimates.",
  alternates: { canonical: "/guides" },
};

const GROUPS = [
  ["weekends", "Weekends", "Two nights, a Saturday and Sunday plan, and what it all costs.", (guide) => guide.kind === "weekend"],
  ["hotels", "Cheap hotels", "Budget stays near the places people want to be.", (guide) => guide.kind === "hotels" || guide.kind === "feature"],
  ["budget", "On a budget", "Longer trips, day by day, on as little as possible.", (guide) => guide.kind === "budget" || guide.kind === "versus"],
  ["lists", "Where to go", "The cheapest places for a month, a season or a starting point.", (guide) => guide.kind === "list"],
];

export default function GuidesPage() {
  const guides = publishedGuides();
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: `${SITE_URL}/guides`,
    name: "Budget travel guides",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: { "@type": "ItemList", numberOfItems: guides.length, itemListElement: guides.map((guide, index) => ({ "@type": "ListItem", position: index + 1, name: guide.title, url: `${SITE_URL}/guides/${guide.slug}` })) },
  };
  return (
    <main className="min-h-screen bg-bg text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader />
      <Breadcrumb items={[["Home", "/"], ["Guides", null]]} width="max-w-[1520px]" />
      <PageHero short centered image="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" alt="A bright alpine lake and green mountains" chips={[`${guides.length} guides`]} title="Budget travel guides" subtitle="Real stays, cheap dinners, a day-by-day plan and what the trip costs, for the trips people search for." />
      <nav aria-label="Guide types" className="mx-auto mt-10 flex max-w-[1520px] flex-wrap justify-center gap-2 px-5 sm:px-8">
        {GROUPS.map(([id, title, , test]) => <a key={id} href={`#${id}`} className="inline-flex min-h-10 items-center gap-2 border border-black/15 px-4 text-micro font-medium uppercase tracking-label transition-colors hover:border-ink">{title} <span className="tabular text-subtle">{guides.filter(test).length}</span></a>)}
      </nav>
      <div className="mx-auto max-w-[1520px] px-5 pb-[var(--section-space)] sm:px-8">
        {GROUPS.map(([id, title, intro, test]) => {
          const items = guides.filter(test);
          if (!items.length) return null;
          return <section key={id} id={id} aria-labelledby={`${id}-heading`} className="reveal mt-[var(--section-space)] scroll-mt-24">
            <h2 id={`${id}-heading`} className="font-serif text-3xl tracking-tight-3 sm:text-5xl">{title}</h2>
            <p className="mt-3 max-w-[var(--width-reading)] text-base text-muted">{intro}</p>
            <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((guide, index) => <li key={guide.slug}><GuideCard card={guideCard(guide)} eager={id === "weekends" && index < 4} /></li>)}
            </ul>
          </section>;
        })}
      </div>
      <SiteFooter />
    </main>
  );
}

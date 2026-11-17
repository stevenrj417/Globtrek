import Image from "../components/Photo";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { publishedGuides } from "../lib/guides/buildGuide";
import { SITE_URL } from "../lib/site";

export const metadata = {
  title: "Budget travel guides",
  description: "Weekend plans, cheap hotels near the places you want to be, and lists of the cheapest places to go, built from real stays and GlobTrek's trip cost estimates.",
  alternates: { canonical: "/guides" },
};

const GROUPS = [
  ["Weekends", (guide) => guide.kind === "weekend"],
  ["Cheap hotels", (guide) => guide.kind === "hotels" || guide.kind === "feature"],
  ["On a budget", (guide) => guide.kind === "budget" || guide.kind === "versus"],
  ["Where to go", (guide) => guide.kind === "list"],
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
      <div className="mx-auto max-w-[1280px] px-5 py-[var(--section-space)] sm:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-subtle"><Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">›</span> <span aria-current="page">Guides</span></nav>
        <h1 className="mt-6 font-serif text-[clamp(2.5rem,5.4vw,5rem)] font-normal leading-[1.02] tracking-tight-2">Guides</h1>
        <p className="mt-4 max-w-[var(--width-reading)] text-lg leading-8 text-muted">Real budget stays, cheap dinners, a day-by-day plan and what the trip costs, for {guides.length} trips people search for.</p>
        {GROUPS.map(([title, test]) => {
          const items = guides.filter(test);
          if (!items.length) return null;
          return <section key={title} aria-labelledby={`${title}-heading`} className="mt-[var(--section-space)]">
            <h2 id={`${title}-heading`} className="text-2xl font-semibold tracking-tight-2">{title}</h2>
            <ul className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((guide, index) => <li key={guide.slug} className="bg-bg">
                <Link href={`/guides/${guide.slug}`} className="group flex h-full flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">
                    <Image src={guide.image} alt={guide.imageAlt} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" loading={index < 4 ? "eager" : "lazy"} />
                  </div>
                  <p className="flex flex-1 items-start justify-between gap-3 p-4 font-medium tracking-tight-1">{guide.title} <span aria-hidden="true">→</span></p>
                </Link>
              </li>)}
            </ul>
          </section>;
        })}
      </div>
      <SiteFooter />
    </main>
  );
}

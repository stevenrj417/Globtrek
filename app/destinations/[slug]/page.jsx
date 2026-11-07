import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { EstimateDetails } from "../../components/EstimateDetails";
import { destinationBySlug, publishedDestinations } from "../../data/destinationCatalog";
import { estimateLine, formatMoney, formatRange } from "../../lib/recommendation/tripEstimate";
import { SITE_URL } from "../../lib/site";
import { BookingLogo } from "../../components/PartnerLogo";
import { LaunchSections } from "./LaunchSections";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedDestinations.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = destinationBySlug(slug);
  if (!item) return {};
  return {
    title: `${item.name} on a budget: 5-night trip`,
    description: `${item.name}, ${item.country}: ${estimateLine(item.estimate)}. Best time to go: ${item.season.toLowerCase()}.`,
    alternates: { canonical: `/destinations/${item.slug}` },
  };
}

const LEVEL = { value: "low-cost", moderate: "mid-priced", expensive: "higher-cost", very_expensive: "premium" };
const ENTRY_URL = "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages.html";
const ADVISORY_URL = "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html";

function monthYear(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const item = destinationBySlug(slug);
  if (!item) notFound();

  const months = item.planning.monthly;
  const nights = months.map((month) => month.hotelNight);
  const maxNight = Math.max(...nights);
  const may = months[4];
  const planHref = `/discover/quick?destination=${item.id}&destinationName=${encodeURIComponent(item.name)}&source=destination`;
  const facts = [
    ["Trip estimate", `${formatRange(item.estimate.low, item.estimate.high)}`, "2 travelers · 5 nights · before flights"],
    ["Best time to go", item.season, null],
    ["Nearest airport", item.airport, null],
    item.knownness != null ? ["Knownness", `${item.knownness} / 100`, item.knownness < 40 ? "Off the radar" : item.knownness < 70 ? "Known, not crowded" : "Well known"] : null,
  ].filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TouristDestination", name: `${item.name}, ${item.country}`, url: `${SITE_URL}/destinations/${item.slug}`, image: item.image, description: `${item.name} is known for ${item.knownFor}.` },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
        { "@type": "ListItem", position: 3, name: item.name, item: `${SITE_URL}/destinations/${item.slug}` },
      ] },
    ],
  };

  return (
    <main className="min-h-screen bg-bg text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader actionHref={planHref} actionLabel="Make this my trip" />
      <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-subtle">
          <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">›</span> <Link href="/destinations" className="hover:text-ink">Destinations</Link>{item.continent ? <> <span aria-hidden="true">›</span> {item.continent}</> : null} <span aria-hidden="true">›</span> <span aria-current="page" className="text-ink">{item.name}</span>
        </nav>
      </div>

      <section className="mx-auto mt-6 max-w-[1280px] px-5 sm:px-8">
        <div className="relative aspect-[16/10] overflow-hidden bg-placeholder sm:aspect-[21/9]">
          <Image src={item.image} alt={item.alt} fill priority className="object-cover" sizes="(min-width: 1280px) 1280px, 100vw" quality={82} />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">{item.country}</p>
            <h1 className="mt-2 text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[1.02] tracking-tight-3">{item.name}</h1>
            <p className="mt-3 text-lg text-muted">Known for {item.knownFor}.</p>
            <p className="tabular mt-4 text-sm">{estimateLine(item.estimate)} <EstimateDetails estimate={item.estimate} align="left" /></p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <Link href={planHref} className="btn btn-primary">Make this my trip</Link>
            <p className="text-xs text-subtle">Stays, flights and attractions on <BookingLogo className="h-3 w-auto" /></p>
          </div>
        </div>
      </section>

      <section aria-labelledby="glance-heading" className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
        <h2 id="glance-heading" className="text-2xl font-semibold tracking-tight-2">At a glance</h2>
        <dl className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([label, value, note]) => (
            <div key={label} className="bg-bg p-5">
              <dt className="eyebrow">{label}</dt>
              <dd className="tabular mt-2 text-lg font-medium">{value}</dd>
              {note ? <dd className="mt-1 text-xs text-subtle">{note}</dd> : null}
            </div>
          ))}
        </dl>
      </section>

      <LaunchSections item={item} />

      <section aria-labelledby="costs-heading" className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
        <h2 id="costs-heading" className="text-2xl font-semibold tracking-tight-2">Know before you go</h2>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h3 className="eyebrow">Everyday costs (May)</h3>
            <dl className="mt-4 divide-y divide-black/10 border-y border-black/10 text-sm">
              {[["Good-value room, per night", may.hotelNight], ["Food, per person per day", may.foodPerPersonDay], ["Things to do, per person per day", may.activitiesPerPersonDay], ["Getting around, per day", may.localTransportDay]].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-muted">{label}</dt><dd className="tabular font-medium">~{formatMoney(value)}</dd></div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="eyebrow">Room price by month</h3>
            <ol className="mt-4 grid h-40 grid-cols-12 items-end gap-1.5" aria-label="Estimated good-value room price per night, by month">
              {months.map((month) => (
                <li key={month.month} className="flex h-full flex-col justify-end text-center">
                  <span className="tabular text-micro text-subtle">${month.hotelNight}</span>
                  <span aria-hidden="true" className={`mt-1 block w-full ${month.hotelNight === Math.min(...nights) ? "bg-ink" : "bg-black/20"}`} style={{ height: `${Math.max(12, (month.hotelNight / maxNight) * 100)}%` }} />
                  <span className="mt-1 text-micro text-subtle">{month.monthName.slice(0, 1)}<span className="sr-only">{month.monthName.slice(1)}</span></span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="mt-6 max-w-[var(--width-reading)] text-xs leading-5 text-subtle">
          {item.costModel === "city" ? `GlobTrek's ${item.name} cost model` : `Typical costs for a ${LEVEL[item.costLevel] || "mid-priced"} destination; not yet modeled for ${item.name} specifically`}{item.modelDate ? `, dated ${monthYear(item.modelDate)}` : ""}. Estimates, not live prices. Check live rates with the booking partner.
        </p>
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <li><a href={ENTRY_URL} rel="noopener" className="underline decoration-black/25 underline-offset-4 hover:decoration-ink">Check entry requirements</a> <span className="text-subtle">(U.S. Department of State)</span></li>
          <li><a href={ADVISORY_URL} rel="noopener" className="underline decoration-black/25 underline-offset-4 hover:decoration-ink">Read the travel advisory</a> <span className="text-subtle">(U.S. Department of State)</span></li>
        </ul>
      </section>

      <section className="mx-auto mt-[var(--section-space)] max-w-[1280px] border-t border-black/10 px-5 py-[var(--section-space)] text-center sm:px-8">
        <h2 className="text-2xl font-semibold tracking-tight-2 sm:text-3xl">Plan {item.name} around your budget</h2>
        <p className="mt-3 text-muted">Answer a few questions and get stays, things to do and dinners for {item.name}.</p>
        <Link href={planHref} className="btn btn-primary mt-6">Make this my trip</Link>
      </section>
      <SiteFooter />
    </main>
  );
}

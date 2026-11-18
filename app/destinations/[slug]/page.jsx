import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { EstimateDetails } from "../../components/EstimateDetails";
import { destinationBySlug, publishedDestinations } from "../../data/destinationCatalog";
import { estimateLine, formatMoney, formatRange, nightlyLine } from "../../lib/recommendation/tripEstimate";
import { SITE_URL } from "../../lib/site";
import { BookingLogo } from "../../components/PartnerLogo";
import { LaunchSections } from "./LaunchSections";
import { Breadcrumb, CardRow, CardRowItem, CtaBand, PageHero, Section, Summary, textLink } from "../../components/TravelPage";
import { GuideCard } from "../../guides/GuideCard";
import { guidesFor } from "../../lib/guides/buildGuide";
import { LAUNCH_DATA } from "../../data/launchSet";

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
    description: `${item.name}, ${item.country}: ${estimateLine(item.estimate)}. Best time to go: ${seasonLine(item.season).toLowerCase()}`,
    alternates: { canonical: `/destinations/${item.slug}` },
  };
}

const LEVEL = { value: "low-cost", moderate: "mid-priced", expensive: "higher-cost", very_expensive: "premium" };
const ENTRY_URL = "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages.html";
const ADVISORY_URL = "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html";

// The climate source is credited in the small print, not in the main line.
function seasonLine(season) {
  return String(season || "").replace(/\s*Averages from NASA POWER, [\d–-]+\.?$/, "");
}

function monthYear(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const item = destinationBySlug(slug);
  if (!item) notFound();

  const months = item.planning.monthly;
  const season = seasonLine(item.season);
  const nights = months.map((month) => month.hotelNight);
  const maxNight = Math.max(...nights);
  const may = months[4];
  const planHref = `/discover/quick?destination=${item.id}&destinationName=${encodeURIComponent(item.name)}&source=destination`;
  const facts = [
    ["5 nights, 1 traveler", `${formatRange(item.estimate.low, item.estimate.high)}`, "Lowest-cost estimate, before flights"],
    ["Nearest airport", item.airport, null],
    item.knownness != null ? ["How well known", `${item.knownness} / 100`, item.knownness < 40 ? "Off the radar" : item.knownness < 70 ? "Known, not crowded" : "Well known"] : null,
  ].filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TouristDestination", "@id": `${SITE_URL}/destinations/${item.slug}#destination`, name: `${item.name}, ${item.country}`, url: `${SITE_URL}/destinations/${item.slug}`, image: item.image, description: `${item.name} is known for ${item.knownFor}.`, containedInPlace: { "@type": "Country", name: item.country } },
      { "@type": "WebPage", "@id": `${SITE_URL}/destinations/${item.slug}`, url: `${SITE_URL}/destinations/${item.slug}`, name: `${item.name} on a budget: 5-night trip`, isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${SITE_URL}/destinations/${item.slug}#destination` }, ...(item.modelDate ? { dateModified: item.modelDate } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
        { "@type": "ListItem", position: 3, name: item.name, item: `${SITE_URL}/destinations/${item.slug}` },
      ] },
    ],
  };

  const guides = guidesFor(item.id);
  const launch = LAUNCH_DATA[item.id] || {};
  const jump = [["stay", "Where to stay"], ["eat", "Where to eat"], ["do", "Things to do"], launch.airportRide ? ["airport", "From the airport"] : null, ["costs", "Costs"], guides.length ? ["guides", "Guides"] : null].filter(Boolean);
  const cheapMonth = months.reduce((low, month) => (month.hotelNight < low.hotelNight ? month : low), months[0]);

  return (
    <main className="min-h-screen bg-bg text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader actionHref={planHref} actionLabel="Make this my trip" />
      <Breadcrumb items={[["Home", "/"], ["Destinations", "/destinations"], ...(item.continent ? [[item.continent, null]] : []), [item.name, null]]} />
      <PageHero image={item.image} alt={item.alt} title={item.name} chips={[item.country, ...(item.vibe ? [item.vibe] : [])]} credit={item.credit} subtitle={`Known for ${item.knownFor}.`} />

      <Summary eyebrow="The trip at a glance" lines={[`${estimateLine(item.estimate)}.`, ...(item.estimate.perNight ? [`Stay about ${nightlyLine(item.estimate.perNight, item.estimate.nightUnit)}.`] : []), `Best time to go: ${season}`]} facts={facts} jump={jump}>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href={planHref} className="btn btn-primary">Make this my trip</Link>
          <EstimateDetails estimate={item.estimate} align="left" />
        </div>
        <p className="mt-3 text-xs text-subtle">Stays, flights and attractions on <BookingLogo className="h-3 w-auto" /></p>
      </Summary>

      <LaunchSections item={item} />

      <Section id="costs-heading" eyebrow="Your numbers" title="Know before you go" intro={`Everyday prices in ${item.name}, and how the room price moves through the year.`}>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="bg-surface p-6 sm:p-8">
            <h3 className="font-serif text-2xl tracking-tight-2">Everyday costs in May</h3>
            <dl className="mt-4 divide-y divide-black/10 border-y border-black/10 text-sm">
              {[["Good-value room, per night", may.hotelNight], ["Food, per person per day", may.foodPerPersonDay], ["Things to do, per person per day", may.activitiesPerPersonDay], ["Getting around, per day", may.localTransportDay]].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-muted">{label}</dt><dd className="tabular font-medium">~{formatMoney(value)}</dd></div>
              ))}
            </dl>
          </div>
          <div className="bg-surface p-6 sm:p-8">
            <h3 className="font-serif text-2xl tracking-tight-2">Room price by month</h3>
            <p className="mt-1 text-sm text-muted">Lowest in {cheapMonth.monthName}, about {formatMoney(cheapMonth.hotelNight)} a night.</p>
            <ol className="mt-6 grid h-44 grid-cols-12 items-end gap-1.5" aria-label="Estimated good-value room price per night, by month">
              {months.map((month) => (
                <li key={month.month} className="flex h-full flex-col justify-end text-center">
                  <span className="tabular text-micro text-subtle">${month.hotelNight}</span>
                  <span aria-hidden="true" className={`mt-1 block w-full ${month.hotelNight === cheapMonth.hotelNight ? "bg-ink" : "bg-black/15"}`} style={{ height: `${Math.max(12, (month.hotelNight / maxNight) * 100)}%` }} />
                  <span className="mt-1 text-micro text-subtle">{month.monthName.slice(0, 1)}<span className="sr-only">{month.monthName.slice(1)}</span></span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="mt-6 max-w-[var(--width-reading)] text-xs leading-5 text-subtle">
          {item.costModel === "city" ? `GlobTrek's ${item.name} cost model` : `Typical costs for a ${LEVEL[item.costLevel] || "mid-priced"} destination; not yet modeled for ${item.name} specifically`}{item.modelDate ? `, dated ${monthYear(item.modelDate)}` : ""}. Estimates, not live prices. Check live rates with the booking partner.{item.season !== season ? " Best months to go come from 2001–2025 climate averages (NASA POWER)." : ""}
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <li><a href={ENTRY_URL} rel="noopener" className={textLink}>Check entry requirements</a> <span className="text-subtle">(U.S. Department of State)</span></li>
          <li><a href={ADVISORY_URL} rel="noopener" className={textLink}>Read the travel advisory</a> <span className="text-subtle">(U.S. Department of State)</span></li>
        </ul>
      </Section>

      {guides.length ? <Section id="guides-heading" eyebrow="Guides" title={`More on ${item.name}`} intro="Weekend plans and cheap hotels, built from real stays.">
        <CardRow>{guides.slice(0, 8).map((card) => <CardRowItem key={card.slug}><GuideCard card={card} /></CardRowItem>)}</CardRow>
      </Section> : null}

      <CtaBand eyebrow="Free · 7 questions" title={`Plan ${item.name} around your budget.`} body={`Answer a few questions and get stays, things to do and dinners for ${item.name}.`} href={planHref} label="Make this my trip" />
      <div className="h-[var(--section-space)]" aria-hidden="true" />
      <SiteFooter />
    </main>
  );
}

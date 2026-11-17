import Image from "../../components/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { BookingLogo } from "../../components/PartnerLogo";
import { guideBySlug } from "../../data/guides";
import { buildGuide, publishedGuides } from "../../lib/guides/buildGuide";
import { AFFILIATE_DISCLOSURE, SITE_URL } from "../../lib/site";
import { CostPanel, GuideTrip, MobileBookBar, StayCards } from "./GuideTrip";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = buildGuide(guideBySlug(slug));
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.description, url: `/guides/${guide.slug}`, images: guide.image ? [{ url: guide.image, alt: guide.imageAlt }] : undefined },
  };
}

function Section({ id, title, children, intro }) {
  return <section aria-labelledby={id} className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
    <h2 id={id} className="text-2xl font-semibold tracking-tight-2">{title}</h2>
    {intro ? <p className="mt-2 max-w-[var(--width-reading)] text-sm text-muted">{intro}</p> : null}
    {children}
  </section>;
}

const link = "underline decoration-black/25 underline-offset-4 hover:decoration-ink";

function Stars({ rating, reviews }) {
  if (!rating) return null;
  return <span className="tabular">{rating} on Google{reviews ? ` · ${reviews.toLocaleString("en-US")} reviews` : ""}</span>;
}

function Plan({ plan }) {
  return <div className="mt-6 grid gap-px border border-black/10 bg-black/10 md:grid-cols-2">
    {plan.map((day) => <div key={day.name} className="bg-bg p-5">
      <h3 className="text-lg font-medium tracking-tight-1">{day.name}</h3>
      <ol className="mt-3 space-y-4">
        {day.slots.map(([time, stop]) => <li key={time} className="grid grid-cols-[6.5rem_1fr] gap-3 text-sm">
          <span className="eyebrow pt-0.5">{time}</span>
          <span>
            <a href={stop.googleMapsUrl} target="_blank" rel="noopener" className={`font-medium ${link}`}>{stop.name}</a>
            <span className="block text-subtle">{[time === "Evening" ? "Dinner" : stop.category, stop.getThere].filter(Boolean).join(" · ")}</span>
          </span>
        </li>)}
      </ol>
    </div>)}
  </div>;
}

function Dinners({ dinners }) {
  return <ul className="mt-6 divide-y divide-black/10 border-y border-black/10">
    {dinners.map((place) => <li key={place.name} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
      <div>
        <p className="font-medium">{place.name}</p>
        <p className="text-sm text-muted">{[place.category, place.price].filter(Boolean).join(" · ")}</p>
        <p className="text-xs text-subtle">{[<Stars key="s" rating={place.rating} reviews={place.reviewCount} />, place.distance].filter(Boolean).reduce((all, part, index) => index ? [...all, " · ", part] : [part], [])}</p>
      </div>
      <a href={place.googleMapsUrl} target="_blank" rel="noopener" className={`text-sm ${link}`}>Map and hours ↗</a>
    </li>)}
  </ul>;
}

function Activities({ activities }) {
  return <ul className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
    {activities.map((place) => <li key={place.name} className="flex flex-col justify-between gap-3 bg-bg p-5">
      <div>
        <p className="eyebrow">{place.category}</p>
        <p className="mt-2 font-medium">{place.name}</p>
        <p className="mt-1 text-sm text-muted"><Stars rating={place.rating} reviews={place.reviewCount} /></p>
      </div>
      <a href={place.googleMapsUrl} target="_blank" rel="noopener" className={`text-sm ${link}`}>Map ↗</a>
    </li>)}
  </ul>;
}

function Faq({ faqs }) {
  return <div className="mt-6 max-w-[var(--width-reading)] divide-y divide-black/10 border-y border-black/10">
    {faqs.map(([question, answer]) => <details key={question} className="group" open>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-medium tracking-tight-1 [&::-webkit-details-marker]:hidden">
        {question}
        <span aria-hidden="true" className="text-xl text-subtle transition-transform duration-200 group-open:rotate-45">+</span>
      </summary>
      <p className="pb-6 text-base leading-7 text-muted">{answer}</p>
    </details>)}
  </div>;
}

function Closing({ guide }) {
  return <>
    <section className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
      <div className="flex flex-col items-start gap-5 bg-ink px-6 py-12 text-white sm:px-12 sm:py-16">
        <h2 className="max-w-2xl font-serif text-[clamp(2rem,4vw,3.25rem)] font-normal leading-[1.05] tracking-tight-2">Not sure this is the trip? Take the quiz.</h2>
        <p className="max-w-xl text-white/70">Seven quick questions about your budget and how you like to travel, and GlobTrek picks the one trip that fits.</p>
        <Link href={guide.quizHref} className="inline-flex min-h-12 items-center gap-2 bg-white px-7 text-micro font-medium uppercase tracking-label text-black transition-opacity hover:opacity-90">Take the quiz <span aria-hidden="true">→</span></Link>
      </div>
    </section>
    {guide.related.length ? <Section id="related-heading" title="Related guides">
      <ul className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
        {guide.related.map((item) => <li key={item.slug} className="bg-bg"><Link href={`/guides/${item.slug}`} className="flex min-h-16 items-center justify-between gap-4 p-5 font-medium hover:bg-black/[0.03]">{item.title} <span aria-hidden="true">→</span></Link></li>)}
      </ul>
      <p className="mt-4 text-sm"><Link href="/guides" className={link}>All guides</Link></p>
    </Section> : null}
    <p className="mx-auto mt-12 max-w-[1280px] px-5 text-xs text-subtle sm:px-8">{AFFILIATE_DISCLOSURE} <Link href="/affiliate-disclosure" className={link}>How this works</Link>.</p>
  </>;
}

function Hero({ guide, eyebrow }) {
  return <>
    <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">›</span> <Link href="/guides" className="hover:text-ink">Guides</Link> <span aria-hidden="true">›</span> <span aria-current="page" className="text-ink">{guide.title}</span>
      </nav>
    </div>
    <section className="mx-auto mt-6 max-w-[1280px] px-5 sm:px-8">
      <div className="relative aspect-[16/10] overflow-hidden bg-placeholder sm:aspect-[21/9]">
        <Image src={guide.image} alt={guide.imageAlt} fill priority className="object-cover" sizes="(min-width: 1280px) 1280px, 100vw" quality={80} />
      </div>
      <p className="eyebrow mt-8">{eyebrow}</p>
      <h1 className="mt-2 max-w-4xl text-balance text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[1.04] tracking-tight-3">{guide.title}</h1>
      <div className="mt-6 max-w-[var(--width-reading)] space-y-3 border-l-2 border-ink pl-5 text-lg leading-8">
        {guide.quick.map((line) => <p key={line}>{line}</p>)}
      </div>
    </section>
  </>;
}

function PlaceGuide({ guide }) {
  const clientStays = guide.stays.map(({ latitude, longitude, ...stay }) => stay);
  return <GuideTrip stays={clientStays} costs={guide.costs}>
    <Hero guide={guide} eyebrow={guide.country} />
    <Section id="stay-heading" title={guide.kind === "feature" ? "The hotels" : "Where to stay"} intro={guide.area ? `Budget and mid-range stays ${guide.area.town ? `in ${guide.area.name}` : `within ${guide.area.radiusKm} km of ${guide.area.name}`}, from Booking.com listings.` : "Budget and mid-range stays from Booking.com listings."}>
      <StayCards stays={clientStays} note={guide.stayNote} />
    </Section>
    {guide.plan.length ? <Section id="plan-heading" title={guide.plan.length === 2 ? "A 2-day plan" : `A ${guide.plan.length}-day plan`} intro="Each stop follows on from the last, with how far it is. Dinners are from the list below.">
      <Plan plan={guide.plan} />
    </Section> : null}
    {guide.dinners.length ? <Section id="eat-heading" title={`${guide.dinners.length} cheap dinner spots`} intro="Casual, well-reviewed and operating, from Google Maps. Prices are Google's per-person ranges where it shows one.">
      <Dinners dinners={guide.dinners} />
    </Section> : null}
    {guide.activities.length > 4 ? <Section id="do-heading" title="More things to do" intro="Optional extras, ranked by how many people have reviewed them on Google Maps.">
      <Activities activities={guide.activities.slice(0, 6)} />
    </Section> : null}
    <Section id="cost-heading" title="What it costs" intro="Change the travelers and nights; the totals and the Book link update.">
      <div className="mt-6"><CostPanel source={guide.costs.lodgingSource} month={guide.costs.month} place={guide.place} /></div>
    </Section>
    <Section id="faq-heading" title="Questions"><Faq faqs={guide.faqs} /></Section>
    <Closing guide={guide} />
    <div className="h-20 sm:hidden" aria-hidden="true" />
    <MobileBookBar />
  </GuideTrip>;
}

function ListGuide({ guide }) {
  return <>
    <Hero guide={guide} eyebrow="GlobTrek list" />
    <Section id="list-heading" title={`${guide.items.length} places, cheapest first`} intro={`Estimates for ${guide.nights} nights for one traveler${guide.list.fromWestCoast ? ", with the cheapest fare seen from a West Coast airport" : ", before flights"}. Tap a place for its full guide.`}>
      <ol className="mt-6 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
        {guide.items.map((item, index) => <li key={item.id} className="flex flex-col bg-bg">
          <Link href={`/destinations/${item.slug}`} className="group flex flex-1 flex-col">
            <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">
              <Image src={item.image} alt={item.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" loading={index < 3 ? "eager" : "lazy"} />
              <span className="tabular absolute left-3 top-3 bg-white/95 px-2 py-1 text-sm font-semibold">{index + 1}</span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="eyebrow">{item.country}</p>
              <p className="mt-1 text-xl font-medium tracking-tight-1">{item.name}</p>
              <p className="mt-1 text-sm text-muted">Known for {item.knownFor}.</p>
              <p className="tabular mt-3 text-sm"><span className="font-medium">{item.estimate}</span> · {guide.nights} nights</p>
              {item.fare ? <p className="mt-1 text-xs text-subtle">{item.fare}</p> : null}
              {item.note ? <p className="mt-1 text-xs text-subtle">{item.note}</p> : null}
              {item.stay ? <p className="mt-3 text-sm">Stay: {item.stay.name} <span className="text-subtle">({item.stay.type.toLowerCase()})</span></p> : null}
            </div>
          </Link>
        </li>)}
      </ol>
    </Section>
    <Section id="faq-heading" title="Questions"><Faq faqs={guide.faqs} /></Section>
    <Closing guide={guide} />
  </>;
}

function VersusGuide({ guide }) {
  return <>
    <Hero guide={guide} eyebrow="Side by side" />
    <Section id="versus-heading" title="The numbers">
      <div className="mt-6 grid gap-px border border-black/10 bg-black/10 md:grid-cols-2">
        {guide.sides.map((side) => <div key={side.id} className="bg-bg">
          <div className="relative aspect-[16/9] overflow-hidden bg-placeholder"><Image src={side.image} alt={side.alt} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" /></div>
          <div className="p-5">
            <h3 className="text-2xl font-semibold tracking-tight-2"><Link href={`/destinations/${side.slug}`} className="hover:underline">{side.name}</Link></h3>
            <p className="mt-1 text-sm text-muted">Known for {side.knownFor}.</p>
            <dl className="mt-4 divide-y divide-black/10 border-y border-black/10 text-sm">
              {[["Weekend for two", `$${side.weekend[0].toLocaleString("en-US")}–$${side.weekend[1].toLocaleString("en-US")}`], ["5 nights, one traveler", `$${side.week[0].toLocaleString("en-US")}–$${side.week[1].toLocaleString("en-US")}`], ["Budget hotel room", `about $${side.room} a night`], side.dorm ? ["Dorm bed", `about $${side.dorm} a night`] : null, ["Food", `about $${side.food} per person per day`]].filter(Boolean).map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-muted">{label}</dt><dd className="tabular text-right font-medium">{value}</dd></div>)}
            </dl>
            <h4 className="eyebrow mt-6">Stay</h4>
            <ul className="mt-2 space-y-1 text-sm">{side.stays.map((stay) => <li key={stay.id}>{stay.name} <span className="text-subtle">({stay.type.toLowerCase()})</span></li>)}</ul>
            <h4 className="eyebrow mt-5">Do</h4>
            <ul className="mt-2 space-y-1 text-sm">{side.activities.map((place) => <li key={place.name}><a href={place.googleMapsUrl} target="_blank" rel="noopener" className={link}>{place.name}</a></li>)}</ul>
            <h4 className="eyebrow mt-5">Eat cheaply</h4>
            <ul className="mt-2 space-y-1 text-sm">{side.dinners.map((place) => <li key={place.name}><a href={place.googleMapsUrl} target="_blank" rel="noopener" className={link}>{place.name}</a>{place.price ? <span className="text-subtle"> · {place.price}</span> : null}</li>)}</ul>
            <Link href={`/destinations/${side.slug}`} className="btn btn-secondary mt-6">{side.name} guide</Link>
          </div>
        </div>)}
      </div>
      <p className="mt-3 text-xs text-subtle">Estimates from GlobTrek&apos;s cost models and regional price bands, before flights. Live prices are on <BookingLogo className="h-3 w-auto" />.</p>
    </Section>
    <Section id="faq-heading" title="Questions"><Faq faqs={guide.faqs} /></Section>
    <Closing guide={guide} />
  </>;
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = buildGuide(guideBySlug(slug));
  if (!guide) notFound();
  const url = `${SITE_URL}/guides/${guide.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "FAQPage", "@id": `${url}#faq`, url, name: guide.title, mainEntity: guide.faqs.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: guide.title, item: url },
      ] },
      ...(guide.items ? [{ "@type": "ItemList", name: guide.title, itemListElement: guide.items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: `${item.name}, ${item.country}`, url: `${SITE_URL}/destinations/${item.slug}` })) }] : []),
    ],
  };
  return (
    <main className="min-h-screen bg-bg pb-16 text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteHeader actionHref={guide.quizHref} actionLabel="Plan my trip" />
      {guide.kind === "list" ? <ListGuide guide={guide} /> : guide.kind === "versus" ? <VersusGuide guide={guide} /> : <PlaceGuide guide={guide} />}
      <SiteFooter />
    </main>
  );
}


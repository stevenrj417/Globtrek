import Image from "../../components/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { BookingLogo } from "../../components/PartnerLogo";
import { guideBySlug } from "../../data/guides";
import { buildGuide, guideCard, publishedGuides } from "../../lib/guides/buildGuide";
import { GuideCard } from "../GuideCard";
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

function Section({ id, title, children, intro, eyebrow, width = "max-w-[1280px]" }) {
  return <section id={id?.replace(/-heading$/, "")} aria-labelledby={id} className={`reveal mx-auto mt-[var(--section-space)] scroll-mt-24 px-5 sm:px-8 ${width}`}>
    {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
    <h2 id={id} className="font-serif text-3xl font-normal tracking-tight-3 sm:text-5xl">{title}</h2>
    {intro ? <p className="mt-4 max-w-[var(--width-reading)] text-base leading-7 text-muted">{intro}</p> : null}
    {children}
  </section>;
}

const link = "underline decoration-black/25 underline-offset-4 hover:decoration-ink";

function Stars({ rating, reviews }) {
  if (!rating) return null;
  return <span className="tabular">★ {rating}{reviews ? ` · ${reviews.toLocaleString("en-US")} reviews` : ""}</span>;
}

function Plan({ plan }) {
  return <div className={`mt-10 grid gap-6 ${plan.length > 2 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2"}`}>
    {plan.map((day, dayIndex) => <div key={day.name} className="bg-surface p-6 sm:p-8">
      <p className="eyebrow">Day {dayIndex + 1}</p>
      <h3 className="mt-1 font-serif text-3xl tracking-tight-2">{day.name}</h3>
      <ol className="relative mt-6 space-y-6 border-l border-black/15 pl-6">
        {day.slots.map(([time, stop]) => <li key={time} className="relative">
          <span aria-hidden="true" className="absolute -left-[1.84rem] top-1 size-3 rounded-full border-2 border-bg bg-ink" />
          <p className="text-micro font-semibold uppercase tracking-caps text-subtle">{time}{time === "Evening" ? " · dinner" : ""}</p>
          <a href={stop.googleMapsUrl} target="_blank" rel="noopener" className="mt-1 block text-lg font-medium leading-snug tracking-tight-1 hover:underline">{stop.name}</a>
          <p className="mt-1 text-sm text-muted">{[time === "Evening" ? stop.price || stop.category : stop.category, stop.getThere].filter(Boolean).join(" · ")}</p>
        </li>)}
      </ol>
    </div>)}
  </div>;
}

function Dinners({ dinners }) {
  return <ol className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
    {dinners.map((place, index) => <li key={place.name} className="flex gap-5 border-t border-black/10 py-6">
      <span aria-hidden="true" className="tabular font-serif text-4xl leading-none text-subtle">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0">
        <p className="text-lg font-medium leading-snug tracking-tight-1">{place.name}</p>
        <p className="mt-1 text-sm text-muted">{place.category}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          {place.price ? <span className="tabular border border-black/15 px-2 py-0.5">{place.price}</span> : null}
          {place.rating ? <span className="border border-black/15 px-2 py-0.5"><Stars rating={place.rating} reviews={place.reviewCount} /></span> : null}
        </div>
        {place.distance ? <p className="mt-2 text-xs text-subtle">{place.distance}</p> : null}
        <a href={place.googleMapsUrl} target="_blank" rel="noopener" className={`mt-3 inline-block text-sm ${link}`}>Map and hours ↗</a>
      </div>
    </li>)}
  </ol>;
}

function Activities({ activities }) {
  return <ul className="mt-10 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
    {activities.map((place) => <li key={place.name} className="bg-bg">
      <a href={place.googleMapsUrl} target="_blank" rel="noopener" className="group flex h-full flex-col justify-between gap-6 p-6 transition-colors hover:bg-surface">
        <div>
          <p className="eyebrow">{place.category}</p>
          <p className="mt-2 text-lg font-medium leading-snug tracking-tight-1">{place.name}</p>
        </div>
        <p className="flex items-center justify-between text-sm text-muted"><Stars rating={place.rating} reviews={place.reviewCount} /><span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">↗</span></p>
      </a>
    </li>)}
  </ul>;
}

function Faq({ faqs }) {
  return <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
    {faqs.map(([question, answer], index) => <details key={question} className="group" open={index < 2}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium tracking-tight-1 sm:text-xl [&::-webkit-details-marker]:hidden">
        {question}
        <span aria-hidden="true" className="text-2xl font-light text-subtle transition-transform duration-200 group-open:rotate-45">+</span>
      </summary>
      <p className="max-w-[var(--width-reading)] pb-6 text-base leading-7 text-muted">{answer}</p>
    </details>)}
  </div>;
}

function FaqSection({ faqs }) {
  return <Section id="faq-heading" title="Questions" eyebrow="Good to know" width="max-w-[1040px]"><Faq faqs={faqs} /></Section>;
}

function Closing({ guide }) {
  const related = guide.related.map((item) => guideCard(buildGuide(guideBySlug(item.slug)))).filter(Boolean).slice(0, 4);
  return <>
    <section className="reveal mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
      <div className="relative overflow-hidden bg-ink px-6 py-14 text-white sm:px-14 sm:py-20">
        <p className="text-micro font-semibold uppercase tracking-caps text-white/60">Free · 7 questions</p>
        <h2 className="mt-3 max-w-2xl font-serif text-[clamp(2rem,4.5vw,3.75rem)] font-normal leading-[1.02] tracking-tight-3">Not sure this is the trip? Take the quiz.</h2>
        <p className="mt-4 max-w-xl text-white/70">Tell us your budget and how you like to travel, and GlobTrek picks the one trip that fits.</p>
        <Link href={guide.quizHref} className="mt-8 inline-flex min-h-12 min-w-[13rem] items-center justify-center gap-2 bg-white px-7 text-micro font-medium uppercase tracking-label text-black transition-opacity hover:opacity-90">Take the quiz <span aria-hidden="true">→</span></Link>
      </div>
    </section>
    {related.length ? <Section id="related-heading" title="More guides like this">
      <div className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {related.map((card) => <div key={card.slug} className="w-[72%] shrink-0 snap-start sm:w-auto"><GuideCard card={card} /></div>)}
      </div>
      <p className="mt-8 text-center"><Link href="/guides" className="btn btn-secondary">All guides</Link></p>
    </Section> : null}
    <p className="mx-auto mt-16 max-w-[1280px] px-5 text-xs text-subtle sm:px-8">{AFFILIATE_DISCLOSURE} <Link href="/affiliate-disclosure" className={link}>How this works</Link>.</p>
  </>;
}

function Hero({ guide, eyebrow, jump = [] }) {
  return <>
    <div className="mx-auto max-w-[1280px] px-5 pt-6 sm:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">›</span> <Link href="/guides" className="hover:text-ink">Guides</Link> <span aria-hidden="true">›</span> <span aria-current="page" className="text-ink">{guide.title}</span>
      </nav>
    </div>
    <section className="px-4 pt-4 sm:px-6">
      <div className="relative mx-auto min-h-[58svh] max-w-[1880px] overflow-hidden bg-placeholder sm:min-h-[66svh]">
        <Image src={guide.image} alt={guide.imageAlt} fill priority fetchPriority="high" className="image-calm object-cover" sizes="(min-width: 1880px) 1880px, 100vw" quality={80} />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/75 via-black/30 to-transparent" aria-hidden="true" />
        <div className="rise absolute inset-x-0 bottom-0 mx-auto max-w-[1280px] px-5 pb-10 sm:px-8 sm:pb-14">
          <div className="flex flex-wrap gap-1.5">
            <span className="bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm">{eyebrow}</span>
            {(guide.chips || []).map((chip) => <span key={chip} className="tabular bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm">{chip}</span>)}
          </div>
          <h1 className="mt-4 max-w-4xl text-balance font-serif text-[clamp(2.6rem,6.5vw,6rem)] font-normal leading-[0.95] tracking-tight-3 text-white [text-shadow:0_2px_24px_rgba(0,0,0,.35)]">{guide.title}</h1>
        </div>
        {guide.imageCredit ? <p className="absolute bottom-2 right-3 max-w-[60%] truncate text-[10px] text-white/70">Photo: <a href={guide.imageCredit.source} target="_blank" rel="noopener" className="underline decoration-white/40 underline-offset-2 hover:text-white">{guide.imageCredit.artist}</a>, {guide.imageCredit.licenseUrl ? <a href={guide.imageCredit.licenseUrl} target="_blank" rel="noopener" className="underline decoration-white/40 underline-offset-2 hover:text-white">{guide.imageCredit.license}</a> : guide.imageCredit.license}</p> : null}
      </div>
    </section>
    <section aria-label="The short answer" className="mx-auto mt-12 grid max-w-[1280px] gap-10 px-5 sm:mt-16 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
      <div>
        <p className="eyebrow">The short answer</p>
        <div className="mt-4 space-y-4 text-lg leading-8 tracking-tight-1 sm:text-2xl sm:leading-10">
          {guide.quick.map((line, index) => <p key={line} className={index ? "text-muted" : ""}>{line}</p>)}
        </div>
        {jump.length ? <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
          {jump.map(([href, label]) => <a key={href} href={`#${href}`} className="inline-flex min-h-10 items-center border border-black/15 px-4 text-micro font-medium uppercase tracking-label transition-colors hover:border-ink">{label}</a>)}
        </nav> : null}
      </div>
      {guide.facts?.length ? <dl className="self-start divide-y divide-black/10 bg-surface px-6 sm:px-8">
        {guide.facts.map(([label, value, note]) => <div key={label} className="py-5">
          <dt className="eyebrow">{label}</dt>
          <dd className="tabular mt-1 text-2xl font-medium tracking-tight-2">{value}</dd>
          {note ? <dd className="mt-0.5 text-xs text-subtle">{note}</dd> : null}
        </div>)}
      </dl> : null}
    </section>
  </>;
}

function PlaceGuide({ guide }) {
  const clientStays = guide.stays.map(({ latitude, longitude, ...stay }) => stay);
  const jump = [["stay", "Where to stay"], guide.plan.length ? ["plan", "The plan"] : null, guide.dinners.length ? ["eat", "Cheap dinners"] : null, ["cost", "Costs"], ["faq", "Questions"]].filter(Boolean);
  return <GuideTrip stays={clientStays} costs={guide.costs}>
    <Hero guide={guide} eyebrow={guide.country} jump={jump} />
    <Section id="stay-heading" eyebrow="From Booking.com" title={guide.kind === "feature" ? "The hotels" : "Where to stay"} intro={guide.area ? `Budget and mid-range stays ${guide.area.town ? `in ${guide.area.name}` : `within ${guide.area.radiusKm} km of ${guide.area.name}`}. Pick one for your trip and the costs below follow it.` : "Budget and mid-range stays. Pick one for your trip and the costs below follow it."}>
      <StayCards stays={clientStays} note={guide.stayNote} />
    </Section>
    {guide.plan.length ? <Section id="plan-heading" eyebrow="Day by day" title={guide.plan.length === 2 ? "A 2-day plan" : `A ${guide.plan.length}-day plan`} intro="Each stop follows on from the last, with how far it is. Tap a stop for the map.">
      <Plan plan={guide.plan} />
    </Section> : null}
    {guide.dinners.length ? <Section id="eat-heading" eyebrow="From Google Maps" title={`${guide.dinners.length} cheap dinner spots`} intro="Casual, well-reviewed and open. Prices are Google's per-person ranges where it shows one.">
      <Dinners dinners={guide.dinners} />
    </Section> : null}
    {guide.activities.length > 4 ? <Section id="do-heading" eyebrow="Optional extras" title="More things to do" intro="Ranked by how many people have reviewed them on Google Maps.">
      <Activities activities={guide.activities.slice(0, 6)} />
    </Section> : null}
    <Section id="cost-heading" eyebrow="Your numbers" title="What it costs" intro="Change the travelers and nights; the totals and the Book link update.">
      <div className="mt-10 bg-surface p-6 sm:p-10"><CostPanel source={guide.costs.lodgingSource} month={guide.costs.month} place={guide.place} /></div>
    </Section>
    <FaqSection faqs={guide.faqs} />
    <Closing guide={guide} />
    <div className="h-20 sm:hidden" aria-hidden="true" />
    <MobileBookBar />
  </GuideTrip>;
}

function ListGuide({ guide }) {
  return <>
    <Hero guide={guide} eyebrow="GlobTrek list" />
    <Section id="list-heading" title={`${guide.items.length} places, cheapest first`} intro={`Estimates for ${guide.nights} nights for one traveler${guide.list.fromWestCoast ? ", with the cheapest fare seen from a West Coast airport" : ", before flights"}. Tap a place for its full guide.`}>
      <ol className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {guide.items.map((item, index) => <li key={item.id}>
          <Link href={`/destinations/${item.slug}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
              <Image src={item.image} alt={item.alt} fill className="image-calm object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" loading={index < 3 ? "eager" : "lazy"} />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <span className="tabular bg-ink px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-white">No. {index + 1}</span>
                <span className="tabular bg-surface/92 px-2.5 py-1 text-micro font-semibold uppercase tracking-caps text-ink backdrop-blur-sm">{guide.nights} nights</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-xl font-medium tracking-tight-2 sm:text-2xl">{item.name}</h3>
              <p className="mt-1 text-xs text-subtle">{item.country}</p>
              <p className="tabular mt-3 text-sm font-medium">{item.estimate}</p>
              {item.fare ? <p className="mt-1 text-xs text-ink/80">{item.fare}</p> : null}
              {item.note ? <p className="mt-1 text-xs text-subtle">{item.note}</p> : null}
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted">Known for {item.knownFor}.</p>
              {item.stay ? <p className="mt-2 text-xs text-subtle">Stay: {item.stay.name} ({item.stay.type.toLowerCase()})</p> : null}
            </div>
          </Link>
          <div className="mt-3 border-b border-black/10" aria-hidden="true" />
        </li>)}
      </ol>
    </Section>
    <FaqSection faqs={guide.faqs} />
    <Closing guide={guide} />
  </>;
}

function VersusGuide({ guide }) {
  return <>
    <Hero guide={guide} eyebrow="Side by side" />
    <Section id="versus-heading" title="The numbers">
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {guide.sides.map((side) => <div key={side.id} className="bg-surface">
          <div className="relative aspect-[4/3] overflow-hidden bg-placeholder"><Image src={side.image} alt={side.alt} fill className="image-calm object-cover" sizes="(min-width: 768px) 50vw, 100vw" /></div>
          <div className="p-6 sm:p-8">
            <h3 className="font-serif text-4xl tracking-tight-2"><Link href={`/destinations/${side.slug}`} className="hover:underline">{side.name}</Link></h3>
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
    <FaqSection faqs={guide.faqs} />
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


import Image from "../../components/Photo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { BookingLogo } from "../../components/PartnerLogo";
import { guideBySlug } from "../../data/guides";
import { buildGuide, guideCard, publishedGuides } from "../../lib/guides/buildGuide";
import { GuideCard } from "../GuideCard";
import { Breadcrumb, CardRow, CardRowItem, Chip, CtaBand, NumberedPlaces, PageHero, PlaceTiles, Section, Summary, textLink } from "../../components/TravelPage";
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

const link = textLink;

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
  return <NumberedPlaces places={dinners.map((place) => ({ name: place.name, category: place.category, price: place.price, rating: place.rating, reviewCount: place.reviewCount, note: place.distance, href: place.googleMapsUrl }))} />;
}

function Activities({ activities }) {
  return <PlaceTiles places={activities.map((place) => ({ name: place.name, eyebrow: place.category, rating: place.rating, reviewCount: place.reviewCount, href: place.googleMapsUrl }))} />;
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
    <CtaBand eyebrow="Free · 7 questions" title="Not sure this is the trip? Take the quiz." body="Tell us your budget and how you like to travel, and GlobTrek picks the one trip that fits." href={guide.quizHref} label="Take the quiz" />
    {related.length ? <Section id="related-heading" title="More guides like this">
      <CardRow>{related.map((card) => <CardRowItem key={card.slug}><GuideCard card={card} /></CardRowItem>)}</CardRow>
      <p className="mt-8 text-center"><Link href="/guides" className="btn btn-secondary">All guides</Link></p>
    </Section> : null}
    <p className="mx-auto mt-16 max-w-[1280px] px-5 text-xs text-subtle sm:px-8">{AFFILIATE_DISCLOSURE} <Link href="/affiliate-disclosure" className={link}>How this works</Link>.</p>
  </>;
}

function Hero({ guide, eyebrow, jump = [] }) {
  return <>
    <Breadcrumb items={[["Home", "/"], ["Guides", "/guides"], [guide.title, null]]} />
    <PageHero image={guide.image} alt={guide.imageAlt} title={guide.title} chips={[eyebrow, ...(guide.chips || [])]} credit={guide.imageCredit} />
    <Summary lines={guide.quick} facts={guide.facts || []} jump={jump} />
  </>;
}

function HotelPicks({ picks, place }) {
  return <div className="mt-10 space-y-14">
    {picks.tiers.map((tier) => <div key={tier.key}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-black/10 pt-5">
        <h3 className="font-serif text-2xl tracking-tight-2 sm:text-3xl">{tier.label}</h3>
        {tier.price ? <p className="tabular text-sm text-muted">Typical for {tier.price.kind} in {tier.price.where || place}: <span className="font-medium text-ink">about ${tier.price.low}{tier.price.high !== tier.price.low ? `–$${tier.price.high}` : ""} a night</span></p> : null}
      </div>
      <CardRow columns="lg:grid-cols-3">
        {tier.hotels.map((hotel) => <CardRowItem key={hotel.id}>
          <a href={hotel.cjClickUrl} target="_blank" rel="noopener sponsored" className="group flex flex-1 flex-col">
            <div className="relative aspect-[4/3] overflow-hidden bg-placeholder">
              <Image src={hotel.photos[0]} alt={`${hotel.name}, photo from Booking.com`} fill className="image-calm object-cover transition-transform duration-500 group-hover:scale-[1.02]" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw" />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <Chip>{hotel.starRating ? `${hotel.starRating}-star ${String(hotel.category || "stay").toLowerCase()}` : hotel.category || "Stay"}</Chip>
                {hotel.catalogFreeBreakfast ? <Chip>Breakfast options</Chip> : null}
              </div>
            </div>
            <p className="mt-4 text-lg font-medium leading-snug tracking-tight-1">{hotel.name}</p>
            {hotel.address ? <p className="mt-1 line-clamp-1 text-xs text-subtle">{hotel.address}</p> : null}
            <p className={`mt-3 text-sm ${textLink}`}>See rooms and prices ↗</p>
          </a>
        </CardRowItem>)}
      </CardRow>
    </div>)}
    <p className="text-xs text-subtle">{"Prices shown are typical nightly prices for each kind of hotel here (yearly averages from GlobTrek's price bands), not these hotels' own rates. Listings on "}<BookingLogo className="h-3 w-auto" />{`, checked ${picks.checkedAt}. Tap through for today's price.`}</p>
  </div>;
}

function PlaceGuide({ guide }) {
  const clientStays = guide.stays.map(({ latitude, longitude, ...stay }) => stay);
  const jump = [["stay", "Where to stay"], guide.hotelPicks ? ["budget", "By budget"] : null, guide.plan.length ? ["plan", "The plan"] : null, guide.dinners.length ? ["eat", "Cheap dinners"] : null, ["cost", "Costs"], ["faq", "Questions"]].filter(Boolean);
  return <GuideTrip stays={clientStays} costs={guide.costs}>
    <Hero guide={guide} eyebrow={guide.country} jump={jump} />
    <Section id="stay-heading" eyebrow="From Booking.com" title={guide.kind === "feature" ? "The hotels" : "Where to stay"} intro={guide.area ? `Budget and mid-range stays ${guide.area.town ? `in ${guide.area.name}` : `within ${guide.area.radiusKm} km of ${guide.area.name}`}. Pick one for your trip and the costs below follow it.` : "Budget and mid-range stays. Pick one for your trip and the costs below follow it."}>
      <StayCards stays={clientStays} note={guide.stayNote} />
    </Section>
    {guide.hotelPicks ? <Section id="budget-heading" eyebrow="Hand-picked" title="Hotels at every budget" intro={`${guide.hotelPicks.tiers.map((tier) => tier.label.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " and $1").replace(/^./, (letter) => letter.toUpperCase())} hotels in ${guide.place}, matched to their Booking.com listings.`}>
      <HotelPicks picks={guide.hotelPicks} place={guide.place} />
    </Section> : null}
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


import { Suspense, cache } from "react";
import Link from "next/link";
import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import Image from "../../components/Photo";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { BookingLogo } from "../../components/PartnerLogo";
import { Breadcrumb, CardRow, CardRowItem, Chip, NumberedPlaces, PageHero, PlaceTiles, Section, Summary, textLink } from "../../components/TravelPage";
import { createPlacesClient, DESTINATION_FIELDS } from "../../lib/anyplace/google";
import { destinationFrom } from "../../lib/anyplace/picks";
import { getPicks, hydrate } from "../../lib/anyplace/service";
import { featuredSlug } from "../../lib/anyplace/featured";
import { BUDGETS, BUDGET_KEYS, budgetKey } from "../../lib/anyplace/rank";
import { cjDestinationStaysUrl } from "../../lib/booking/cj";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PRICE = { PRICE_LEVEL_FREE: "Free", PRICE_LEVEL_INEXPENSIVE: "$", PRICE_LEVEL_MODERATE: "$$", PRICE_LEVEL_EXPENSIVE: "$$$", PRICE_LEVEL_VERY_EXPENSIVE: "$$$$" };
const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;

// The destination's details, fetched fresh from Google once per page view.
const destinationDetails = cache(async (placeId, sessionToken) => {
  if (!PLACE_ID.test(placeId)) return null;
  try { return await createPlacesClient().details(placeId, DESTINATION_FIELDS, { sessionToken }); }
  catch { return null; }
});

export async function generateMetadata({ params, searchParams }) {
  const { placeId } = await params;
  const { s } = await searchParams;
  const details = await destinationDetails(placeId, s);
  const name = details?.displayName?.text;
  return { title: name ? `${name}: where to stay, eat and go` : "Your picks", robots: { index: false, follow: true } };
}

async function heroPhoto(details) {
  const photo = details.photos?.[0];
  if (!photo?.name) return null;
  try {
    const url = await createPlacesClient().photo(photo.name);
    const author = photo.authorAttributions?.[0];
    return url ? { url, credit: author ? { artist: author.displayName, source: author.uri } : null } : null;
  } catch { return null; }
}

const km = (value) => (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10);

function StayCards({ stays, townKm, name }) {
  return <CardRow columns="lg:grid-cols-3">
    {stays.map((stay, index) => {
      const chips = [stay.stars ? `${stay.stars}-star ${String(stay.category || "stay").toLowerCase()}` : stay.category, stay.dorms ? "Dorm beds" : null].filter(Boolean);
      const tags = [stay.freeCancellation ? "Free cancellation on some rooms" : null, stay.freeBreakfast ? "Breakfast on some rooms" : null].filter(Boolean);
      return <CardRowItem key={stay.id}>
        <div className="relative aspect-[4/5] overflow-hidden bg-placeholder">
          {stay.photo ? <Image src={stay.photo} alt={`${stay.name}, photo from Booking.com`} fill className="image-calm object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw" loading={index < 2 ? "eager" : "lazy"} /> : null}
          {chips.length ? <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{chips.map((chip) => <Chip key={chip}>{chip}</Chip>)}</div> : null}
        </div>
        <div className="flex flex-1 flex-col pt-4">
          <h3 className="text-xl font-medium leading-snug tracking-tight-2">{stay.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-subtle">{[stay.street, stay.city].filter(Boolean).join(" · ")}</p>
          {stay.km > townKm ? <p className="tabular mt-2 text-sm">{km(stay.km)} km from {name}</p> : null}
          {stay.unrated ? <p className="mt-2 text-sm">No Google reviews yet. Check guest reviews on Booking.com.</p> : null}
          {tags.length ? <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">{tags.map((tag) => <li key={tag} className="border border-black/15 px-2 py-0.5">{tag}</li>)}</ul> : null}
          <div className="mt-auto pt-5">
            <a href={stay.clickUrl} target="_blank" rel="noopener sponsored" className="btn btn-primary w-full">See rooms and prices ↗</a>
          </div>
        </div>
      </CardRowItem>;
    })}
  </CardRow>;
}

function Fallback({ name }) {
  return <>
    {["stay", "eat", "do"].map((id, index) => <section key={id} aria-hidden="true" className="mx-auto mt-[var(--section-space)] max-w-[1280px] px-5 sm:px-8">
      <div className="h-10 w-64 bg-surface" />
      <div className="mt-10 grid gap-6 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className={index ? "h-32 bg-surface" : "aspect-[4/5] bg-surface"} />)}</div>
    </section>)}
    <p role="status" className="sr-only">Finding the best places in {name}…</p>
  </>;
}

async function Picks({ destination, budget }) {
  let picks;
  try {
    const result = await getPicks(destination, budget, { background: (task) => after(() => task.catch(() => {})) });
    picks = await hydrate(result.picks);
  } catch (error) {
    console.log(JSON.stringify({ level: "error", msg: "anyplace_picks_failed", error: error.message }));
    picks = { stays: [], dinners: [], activities: [], labels: {}, townKm: destination.townKm };
  }
  const city = { city: destination.name, country: destination.country };
  const mapsSearch = (what) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${what} near ${destination.name}${destination.country ? `, ${destination.country}` : ""}`)}`;
  const intro = (kind, normal) => [picks.labels?.[kind] ? `${picks.labels[kind]}.` : null, normal].filter(Boolean).join(" ");

  return <>
    <Section id="stay-heading" eyebrow="From Booking.com" title="Where to stay" intro={intro("stays", "Real Booking.com listings, picked for strong Google reviews and a good spot. Check current prices and availability on Booking.com.")}>
      {picks.stays.length ? <StayCards stays={picks.stays} townKm={picks.townKm} name={destination.name} /> : <p className="mt-8 text-base">We couldn&apos;t find listings here yet. <a href={cjDestinationStaysUrl(city)} target="_blank" rel="noopener sponsored" className={textLink}>Search stays near {destination.name} on Booking.com ↗</a></p>}
      <p className="mt-6 text-xs text-subtle">Listings on <BookingLogo className="h-3 w-auto" />. You book and pay on Booking.com.</p>
    </Section>

    <Section id="eat-heading" eyebrow="From Google Maps" title="Where to eat" intro={intro("dinners", "Ranked by rating and number of reviews, near the center.")}>
      {picks.dinners.length ? <NumberedPlaces places={picks.dinners.map((place) => ({ key: place.id, name: place.name, category: place.type, price: PRICE[place.priceLevel] || null, rating: place.rating, reviewCount: place.reviews, tags: [place.km > picks.townKm ? `${km(place.km)} km away` : null, place.belowBar ? "Few reviews yet" : null].filter(Boolean), href: place.mapsUrl }))} /> : <p className="mt-8 text-base"><a href={mapsSearch("restaurants")} target="_blank" rel="noopener" className={textLink}>See places to eat near {destination.name} on Google Maps ↗</a></p>}
    </Section>

    <Section id="do-heading" eyebrow="From Google Maps" title="Things to do" intro={intro("activities", "Sights and the outdoors, ranked by rating and number of reviews.")}>
      {picks.activities.length ? <PlaceTiles places={picks.activities.map((place) => ({ key: place.id, name: place.name, eyebrow: [place.type, place.km > picks.townKm ? `${km(place.km)} km away` : null].filter(Boolean).join(" · ") || null, description: place.belowBar ? "Few reviews yet." : null, rating: place.rating, reviewCount: place.reviews, href: place.mapsUrl }))} /> : <p className="mt-8 text-base"><a href={mapsSearch("things to do")} target="_blank" rel="noopener" className={textLink}>See things to do near {destination.name} on Google Maps ↗</a></p>}
      <p className="mt-6 text-xs text-subtle">Places and ratings from Google Maps.</p>
    </Section>
  </>;
}

export default async function PlacePage({ params, searchParams }) {
  const { placeId } = await params;
  const { budget: rawBudget, s } = await searchParams;
  const details = await destinationDetails(placeId, s);
  const destination = destinationFrom(details);
  if (!destination) notFound();
  const slug = featuredSlug(destination);
  if (slug) redirect(`/destinations/${slug}`);
  const budget = budgetKey(rawBudget);
  const photo = await heroPhoto(details);
  const where = [destination.region, destination.country].filter((part) => part && part !== destination.name).join(", ");

  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Destinations", "/destinations"], [destination.name, null]]} />
    <PageHero image={photo?.url} unoptimized alt={`${destination.name}${where ? `, ${where}` : ""}`} title={destination.name} chips={[destination.country, BUDGETS[budget].label].filter(Boolean)} credit={photo?.credit} subtitle={where || null} />
    <Summary eyebrow="Your picks" lines={[`The top 3 places to stay, eat and explore in ${destination.name} for a ${BUDGETS[budget].label.toLowerCase()} trip.`, "Picked by rating, number of reviews and distance from the center. The same search always gives the same picks."]} jump={[["stay", "Where to stay"], ["eat", "Where to eat"], ["do", "Things to do"]]}>
      <nav aria-label="Budget" className="mt-6 flex flex-wrap gap-2">
        {BUDGET_KEYS.map((key) => <Link key={key} href={`/places/${placeId}?budget=${key}`} aria-current={key === budget ? "page" : undefined} className={`inline-flex min-h-10 items-center border px-4 text-micro font-medium uppercase tracking-label transition-colors ${key === budget ? "border-black bg-black text-white" : "border-black/15 hover:border-ink"}`}>{BUDGETS[key].label}</Link>)}
      </nav>
    </Summary>
    <Suspense fallback={<Fallback name={destination.name} />}>
      <Picks destination={destination} budget={budget} />
    </Suspense>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

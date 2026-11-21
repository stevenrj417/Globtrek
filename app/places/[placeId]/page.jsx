import { Suspense } from "react";
import Link from "next/link";
import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { Breadcrumb, PageHero, Summary, textLink } from "../../components/TravelPage";
import { PicksPicker } from "./PicksPicker";
import { destinationDetails, heroPhoto } from "./destination";
import { destinationFrom } from "../../lib/anyplace/picks";
import { getPicks, hydrate } from "../../lib/anyplace/service";
import { featuredSlug } from "../../lib/anyplace/featured";
import { BUDGETS, BUDGET_KEYS, budgetKey } from "../../lib/anyplace/rank";
import { cjDestinationStaysUrl } from "../../lib/booking/cj";
import { STAY_THEMES } from "../../lib/anyplace/stays";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({ params, searchParams }) {
  const { placeId } = await params;
  const { s } = await searchParams;
  const details = await destinationDetails(placeId, s);
  const name = details?.displayName?.text;
  return { title: name ? `${name}: where to stay, eat and go` : "Your picks", robots: { index: false, follow: true } };
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

function ThemeSwitch({ placeId, budget, theme, available }) {
  if (!available.length) return null;
  const options = [[null, "Top picks"], ...available.map((key) => [key, STAY_THEMES[key].label])];
  return <nav aria-label="Kind of stay" className="mt-6 flex flex-wrap gap-2">
    {options.map(([key, text]) => <Link key={text} href={`/places/${placeId}?budget=${budget}${key ? `&vibe=${key}` : ""}#stay`} scroll={false} aria-current={key === theme ? "page" : undefined} className={`inline-flex min-h-10 items-center border px-4 text-micro font-medium uppercase tracking-label transition-colors ${key === theme ? "border-black bg-black text-white" : "border-black/15 hover:border-ink"}`}>{text}</Link>)}
  </nav>;
}

async function Picks({ destination, budget, theme: wanted }) {
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
  const available = Object.keys(STAY_THEMES).filter((key) => picks.themes?.[key]?.length);
  const theme = available.includes(wanted) ? wanted : null;
  const stays = theme ? picks.themes[theme] : picks.stays;
  const intro = (kind, normal) => [picks.labels?.[kind] ? `${picks.labels[kind]}.` : null, normal].filter(Boolean).join(" ");

  const allStays = [...picks.stays, ...Object.values(picks.themes || {}).flat()].filter((stay, index, list) => list.findIndex((other) => other.id === stay.id) === index);
  return <PicksPicker
    placeId={destination.placeId}
    budget={budget}
    name={destination.name}
    townKm={picks.townKm}
    stays={stays}
    allStays={allStays}
    dinners={picks.dinners}
    activities={picks.activities}
    themeLabels={Object.fromEntries(Object.entries(STAY_THEMES).map(([key, value]) => [key, value.label]))}
    intros={{
      stays: theme ? STAY_THEMES[theme].intro : intro("stays", "Real Booking.com listings, picked for strong Google reviews and a good spot. Choose the one you like; you'll book it on Booking.com."),
      dinners: intro("dinners", "Ranked by rating and number of reviews, near the center."),
      activities: intro("activities", "Sights and the outdoors, ranked by rating and number of reviews."),
    }}
    stayControls={<ThemeSwitch placeId={destination.placeId} budget={budget} theme={theme} available={available} />}
    emptyStay={<p className="mt-8 text-base">We couldn&apos;t find listings here yet. <a href={cjDestinationStaysUrl(city)} target="_blank" rel="noopener sponsored" className={textLink}>Search stays near {destination.name} on Booking.com ↗</a></p>}
    emptyDinners={<p className="mt-8 text-base"><a href={mapsSearch("restaurants")} target="_blank" rel="noopener" className={textLink}>See places to eat near {destination.name} on Google Maps ↗</a></p>}
    emptyActivities={<p className="mt-8 text-base"><a href={mapsSearch("things to do")} target="_blank" rel="noopener" className={textLink}>See things to do near {destination.name} on Google Maps ↗</a></p>}
  />;
}

export default async function PlacePage({ params, searchParams }) {
  const { placeId } = await params;
  const { budget: rawBudget, vibe, s } = await searchParams;
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
    <Summary eyebrow="Your picks" lines={[`The top 3 places to stay, eat and explore in ${destination.name} for a ${BUDGETS[budget].label.toLowerCase()} trip.`, "Choose your stay, add the dinners and things to do you want, then book it all in order from one page."]} jump={[["stay", "Where to stay"], ["eat", "Where to eat"], ["do", "Things to do"]]}>
      <nav aria-label="Budget" className="mt-6 flex flex-wrap gap-2">
        {BUDGET_KEYS.map((key) => <Link key={key} href={`/places/${placeId}?budget=${key}`} aria-current={key === budget ? "page" : undefined} className={`inline-flex min-h-10 items-center border px-4 text-micro font-medium uppercase tracking-label transition-colors ${key === budget ? "border-black bg-black text-white" : "border-black/15 hover:border-ink"}`}>{BUDGETS[key].label}</Link>)}
      </nav>
    </Summary>
    <Suspense fallback={<Fallback name={destination.name} />}>
      <Picks destination={destination} budget={budget} theme={typeof vibe === "string" ? vibe : null} />
    </Suspense>
    <link rel="preconnect" href="https://lh3.googleusercontent.com" />
    <SiteFooter />
  </main>;
}

import { after } from "next/server";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../../components/SiteChrome";
import { Breadcrumb, PageHero } from "../../../components/TravelPage";
import { destinationDetails, heroPhoto } from "../destination";
import { destinationFrom } from "../../../lib/anyplace/picks";
import { resolveTrip } from "../../../lib/anyplace/tripData";
import { parseTripParams } from "../../../lib/anyplace/trip";
import { BUDGETS } from "../../../lib/anyplace/rank";
import { cjDestinationStaysUrl } from "../../../lib/booking/cj";
import { TripPlanner } from "./TripPlanner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({ params }) {
  const { placeId } = await params;
  const name = (await destinationDetails(placeId))?.displayName?.text;
  return { title: name ? `Your trip to ${name}` : "Your trip", robots: { index: false, follow: false } };
}

export default async function PlaceTripPage({ params, searchParams }) {
  const { placeId } = await params;
  const trip = parseTripParams(await searchParams);
  const details = await destinationDetails(placeId);
  const destination = destinationFrom(details);
  if (!destination) notFound();
  const [photo, resolved] = await Promise.all([
    heroPhoto(details),
    resolveTrip(destination, trip, { background: (task) => after(() => task.catch(() => {})) }).catch((error) => {
      console.log(JSON.stringify({ level: "error", msg: "anyplace_trip_failed", error: error.message }));
      return { stay: null, dinners: [], activities: [], airport: null, townKm: destination.townKm };
    }),
  ]);
  const where = [destination.region, destination.country].filter((part) => part && part !== destination.name).join(", ");
  const editHref = `/places/${placeId}?budget=${trip.budget}`;
  const count = (resolved.stay ? 1 : 0) + resolved.dinners.length + resolved.activities.length;

  return <main className="min-h-screen bg-canvas text-ink">
    <SiteHeader />
    <link rel="preconnect" href="https://lh3.googleusercontent.com" />
    <Breadcrumb items={[["Home", "/"], [destination.name, editHref], ["Your trip", null]]} />
    <PageHero short image={photo?.url} unoptimized alt={`${destination.name}${where ? `, ${where}` : ""}`} title={`Your trip to ${destination.name}`} chips={[destination.country, BUDGETS[trip.budget].label].filter(Boolean)} credit={photo?.credit} subtitle={count ? `You picked ${count} place${count === 1 ? "" : "s"}. Here's the order to book them in, with every link ready.` : "Here's the order to book your trip in, with every link ready."} />
    <TripPlanner
      placeId={placeId}
      destination={{ name: destination.name, country: destination.country }}
      initial={trip}
      stay={resolved.stay}
      dinners={resolved.dinners}
      activities={resolved.activities}
      airport={resolved.airport}
      townKm={resolved.townKm ?? destination.townKm}
      staysSearchUrl={cjDestinationStaysUrl({ city: destination.name, country: destination.country })}
      editHref={editHref}
    />
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

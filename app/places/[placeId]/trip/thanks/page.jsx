import { after } from "next/server";
import { notFound, redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "../../../../components/SiteChrome";
import { TripThanks } from "../../../../components/TripThanks";
import { destinationDetails } from "../../destination";
import { destinationFrom } from "../../../../lib/anyplace/picks";
import { resolveTrip } from "../../../../lib/anyplace/tripData";
import { flightLink, parseTripParams, stayLink, ticketsLink, tripQuery } from "../../../../lib/anyplace/trip";
import { tripExtras } from "../../../../lib/trip/extras";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Thank you for booking with GlobTrek", robots: { index: false, follow: false } };

const dayLabel = (value) => (value ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : null);

export default async function PlaceTripThanksPage({ params, searchParams }) {
  const { placeId } = await params;
  const trip = parseTripParams(await searchParams);
  if (!trip.ref) redirect(`/places/${placeId}/trip?${tripQuery(trip)}`);
  const destination = destinationFrom(await destinationDetails(placeId));
  if (!destination) notFound();
  const resolved = await resolveTrip(destination, trip, { photos: false, background: (task) => after(() => task.catch(() => {})) }).catch(() => ({ stay: null, dinners: [], activities: [], airport: null }));
  const dates = trip.start && trip.end ? `${dayLabel(trip.start)} – ${dayLabel(trip.end)}` : null;
  const items = [
    { id: "flight", kind: "flight", name: resolved.airport ? `Flight to ${resolved.airport.city} (${resolved.airport.code})` : "Your flight", detail: [trip.from ? `From ${trip.from}` : null, dates].filter(Boolean).join(" · ") || null, href: flightLink(resolved.airport, trip), cta: "See flights" },
    { id: "stay", kind: "stay", name: resolved.stay?.name || `A stay near ${destination.name}`, detail: dates, href: resolved.stay ? stayLink(resolved.stay, trip) : null, cta: "Book the stay" },
    ...resolved.activities.map((place) => ({ id: `a:${place.id}`, kind: "activity", name: place.name, detail: place.type || null, href: ticketsLink(place, destination, trip.ref) || place.mapsUrl, sponsored: Boolean(ticketsLink(place, destination)), cta: ticketsLink(place, destination) ? "Tours and tickets" : "Directions" })),
    ...resolved.dinners.map((place) => ({ id: `d:${place.id}`, kind: null, name: place.name, detail: "Dinner", href: place.mapsUrl, sponsored: false, cta: "Hours and reservations" })),
  ];
  const doneKey = `globtrek:booked:place:${placeId}:${trip.stay || ""}:${trip.dinners.join(",")}:${trip.activities.join(",")}`;
  const extras = tripExtras({ level: trip.budget, destination: { name: destination.name, country: destination.country }, airport: resolved.airport, stay: resolved.stay, sid: trip.ref });
  return <main className="min-h-screen bg-canvas text-ink">
    <SiteHeader />
    <TripThanks destinationName={destination.name} items={items} doneKey={doneKey} refKey={`place:${placeId}`} tripRef={trip.ref} extras={extras} backHref={`/places/${placeId}/trip?${tripQuery(trip)}`} />
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

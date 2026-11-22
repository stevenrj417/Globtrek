// Card data for themed trips and wonders: photo, credit and a "from" price.
// The "from" price leaves out flights (they depend on where you fly from):
// it's the stays, food, things to do, tickets and tours for one person.
import { THEMED_PHOTOS, THEMED_TRIPS, SEVEN_WONDERS, THEME_GROUPS } from "../../data/themedTrips.js";
import { destinationFor, priceRoute } from "./price.js";

export function photoFor(trip) {
  if (trip.photo && THEMED_PHOTOS[trip.photo]) return { ...THEMED_PHOTOS[trip.photo], alt: THEMED_PHOTOS[trip.photo].subject, credit: { artist: THEMED_PHOTOS[trip.photo].artist, source: THEMED_PHOTOS[trip.photo].source, license: THEMED_PHOTOS[trip.photo].license, licenseUrl: THEMED_PHOTOS[trip.photo].licenseUrl } };
  const first = trip.stops?.find((stop) => stop.id) || (trip.id ? { id: trip.id } : null);
  const destination = first ? destinationFor(first.id) : null;
  return destination?.image ? { url: destination.image, alt: destination.imageAlt || `${destination.city}, ${destination.country}`, credit: null } : { url: null, alt: trip.title || trip.name, credit: null };
}

// Everything but flights, for one person in good-value style.
export function landPrice(route) {
  const priced = priceRoute(route, { origin: "JFK", travelers: 1, style: "value" });
  return priced ? priced.total - priced.totals.flights : null;
}

export function themedCard(trip) {
  const photo = photoFor(trip);
  return {
    slug: trip.slug,
    href: `/themed-trips/${trip.slug}`,
    title: trip.title,
    place: trip.place,
    image: photo.url,
    imageAlt: photo.alt,
    chips: [trip.days >= 28 ? "1 month" : `${trip.days} days`],
    landFrom: landPrice(trip),
  };
}

export const themedGroups = () => THEME_GROUPS.map((group) => ({ ...group, trips: THEMED_TRIPS.filter((trip) => trip.group === group.id) }));
export const wonderCard = (wonder) => ({ ...wonder, photo: photoFor(wonder.photo ? { photo: wonder.photo } : { id: wonder.id }), landFrom: landPrice({ stops: [{ id: wonder.id, nights: wonder.nights }], extras: [wonder.extra] }) });
export const allWonderCards = () => SEVEN_WONDERS.map(wonderCard);

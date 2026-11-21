// Looks a traveler's trip up again from the saved picks: the stay must be one of
// that place's picked Booking.com listings, and dinners and things to do must be
// among its picks. Google details are fetched fresh (nothing Google is stored).
import { nearestAirport } from "./airport.js";
import { createPlacesClient } from "./google.js";
import { getPicks, hydrateOne } from "./service.js";

export async function resolveTrip(destination, trip, { photos = true, background, places = createPlacesClient() } = {}) {
  const { picks } = await getPicks(destination, trip.budget, background ? { background } : undefined);
  const stays = [...(picks.stays || []), ...Object.values(picks.themes || {}).flat()];
  const stay = trip.stay ? stays.find((item) => item.id === trip.stay) || null : null;
  const pick = (ids, list) => ids.map((id) => (list || []).find((item) => item.id === id)).filter(Boolean);
  const load = (items, width) => Promise.all(items.map((item) => hydrateOne(item, places, { photos, photoWidth: width })));
  const [dinners, activities] = await Promise.all([load(pick(trip.dinners, picks.dinners), 900), load(pick(trip.activities, picks.activities), 1200)]);
  return {
    stay,
    dinners: dinners.filter((item) => item?.name),
    activities: activities.filter((item) => item?.name),
    airport: nearestAirport(destination.center),
    townKm: picks.townKm,
  };
}

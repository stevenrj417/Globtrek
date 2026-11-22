// Looks a traveler's trip up again from the saved picks: the stay must be one of
// that place's picked Booking.com listings, and dinners and things to do must be
// among its picks. Google details are fetched fresh (nothing Google is stored).
import { nearestAirport } from "./airport.js";
import { createPlacesClient } from "./google.js";
import { getPicks, hydrateOne } from "./service.js";
import { distanceKm } from "./rank.js";
import { asPickStay, stayById } from "../search/stays.js";

const PIN_KM = 80;

export async function resolveTrip(destination, trip, { photos = true, background, places = createPlacesClient() } = {}) {
  const { picks } = await getPicks(destination, trip.budget, background ? { background } : undefined);
  const stays = [...(picks.stays || []), ...Object.values(picks.themes || {}).flat()];
  let stay = trip.stay ? stays.find((item) => item.id === trip.stay) || null : null;
  // A hotel chosen from GlobTrek's own Booking.com catalog (search or its page),
  // accepted when it's near this place.
  if (trip.stay && !stay) {
    const pick = asPickStay(await stayById(trip.stay.slice(3)).catch(() => null), destination.center, distanceKm);
    if (pick && pick.km != null && pick.km <= PIN_KM) stay = pick;
  }
  // Things to do: the picks, plus at most one sight chosen elsewhere on the site
  // (its details come fresh from Google, like the picks).
  const pick = (ids, list, extra = 0) => {
    let allowed = extra;
    return ids.map((id) => (list || []).find((item) => item.id === id) || (allowed-- > 0 ? { id } : null)).filter(Boolean);
  };
  const load = (items, width) => Promise.all(items.map((item) => hydrateOne(item, places, { photos, photoWidth: width })));
  const [dinners, activities] = await Promise.all([load(pick(trip.dinners, picks.dinners), 900), load(pick(trip.activities, picks.activities, 1), 1200)]);
  return {
    stay,
    dinners: dinners.filter((item) => item?.name),
    activities: activities.filter((item) => item?.name),
    airport: nearestAirport(destination.center),
    townKm: picks.townKm,
  };
}

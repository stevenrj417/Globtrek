import { createPlacesClient } from "../lib/anyplace/google";
import { airportByCode } from "../lib/anyplace/airport";
import { stayById } from "../lib/search/stays";
import { countryName } from "../lib/search/country";
import { budgetKey } from "../lib/anyplace/rank";
import { sharedRateLimit } from "../lib/security/rateLimit";
import { feedDestinationOf } from "../lib/catalog/feedSnapshot";
import { destinations } from "../data/destinations";

export const dynamic = "force-dynamic";

const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TOWN_TYPES = ["locality", "postal_town", "administrative_area_level_3", "administrative_area_level_2"];

// "Plan a whole trip around this": finds the town a hotel, sight or airport is in
// and opens that town's picks with the chosen thing already in the trip.
//   /plan?stay=<Booking.com id> · /plan?a=<Google place id> · /plan?airport=LIS&from=PDX
// Only IDs travel in the link; the town is looked up here on the server.
async function townPlaceId(places, name, country) {
  if (!name) return null;
  const query = [name, country].filter(Boolean).join(", ");
  for (const includedType of ["locality", null]) {
    const found = await places.text({ textQuery: query, includedType: includedType || undefined, max: 1, fieldMask: "places.id" }).catch(() => []);
    if (found[0]?.id) return found[0].id;
  }
  return null;
}

export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "plan-around", limit: 30 });
  if (limited) return limited;
  const url = new URL(request.url);
  const q = (key) => url.searchParams.get(key) || "";
  const places = createPlacesClient();
  const next = new URLSearchParams({ budget: budgetKey(q("budget")) });
  if (DATE.test(q("start")) && DATE.test(q("end")) && q("end") > q("start")) { next.set("start", q("start")); next.set("end", q("end")); }
  const adults = Number.parseInt(q("adults"), 10);
  if (adults >= 1 && adults <= 16 && adults !== 2) next.set("adults", String(adults));
  if (/^[A-Z]{3}$/.test(q("from"))) next.set("from", q("from"));

  let placeId = null;
  let hash = "";
  let fallback = "/discover";
  try {
    if (q("stay")) {
      const stay = await stayById(q("stay"));
      if (stay) {
        fallback = `/hotels/${stay.id}`;
        placeId = await townPlaceId(places, stay.city, stay.country);
        next.set("stay", `bk:${stay.id}`);
        hash = "#stay";
      }
    } else if (PLACE_ID.test(q("a"))) {
      fallback = `/things-to-do/${q("a")}`;
      const place = await places.details(q("a"), "id,addressComponents");
      const parts = place?.addressComponents || [];
      const town = TOWN_TYPES.map((type) => parts.find((part) => part.types?.includes(type))?.longText).find(Boolean);
      const country = parts.find((part) => part.types?.includes("country"))?.longText;
      placeId = await townPlaceId(places, town, country);
      next.set("a", q("a"));
      hash = "#do";
    } else if (/^[A-Z]{3}$/.test(q("airport"))) {
      const airport = airportByCode(q("airport"));
      if (airport) {
        fallback = q("from") ? `/flights/${q("from")}-${airport.code}` : "/discover";
        placeId = await townPlaceId(places, airport.city || airport.name, countryName(airport.country));
      }
    }
  } catch (error) {
    console.log(JSON.stringify({ level: "warn", msg: "plan_around_failed", error: error.message }));
  }
  // Without Google (paid lookups are off), plan around the catalog destination
  // the hotel or airport belongs to instead.
  if (!placeId) {
    const airport = /^[A-Z]{3}$/.test(q("airport")) ? q("airport") : null;
    const destinationId = q("stay") ? feedDestinationOf(q("stay")) : airport ? (destinations.find((item) => item.airport === airport || item.primaryAirportCodes?.includes(airport))?.id || null) : null;
    const known = destinationId && destinations.find((item) => (item.id || item.airport) === destinationId || item.id === destinationId);
    if (known) return Response.redirect(new URL(`/results?destination=${encodeURIComponent(known.id || known.airport)}`, url.origin), 302);
  }
  const target = placeId ? `/places/${encodeURIComponent(placeId)}?${next}${hash}` : `${fallback}${fallback.includes("?") ? "&" : "?"}plan=unavailable`;
  return Response.redirect(new URL(target, url.origin), 302);
}

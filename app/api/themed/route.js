import { THEMED_TRIPS, SEVEN_WONDERS, themedTrip } from "../../data/themedTrips";
import { planSevenContinents, priceAllWonders, priceRoute, priceWonder } from "../../lib/themed/price";
import { sharedRateLimit } from "../../lib/security/rateLimit";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/themed?kind=trip|wonder|wonders|continents&slug=…&months=…&origin=JFK&travelers=2&start=2027-03-10&style=value
// Prices a themed trip or an expedition from the traveler's airport and dates.
export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "themed-price", limit: 90 });
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const options = { origin: params.get("origin"), travelers: params.get("travelers"), start: params.get("start"), style: params.get("style") };
  const kind = params.get("kind");
  const slug = params.get("slug") || "";
  let result = null;
  if (kind === "trip") { const trip = themedTrip(slug); result = trip ? priceRoute(trip, options) : null; }
  else if (kind === "wonder" && SEVEN_WONDERS.some((item) => item.slug === slug)) result = priceWonder(slug, options);
  else if (kind === "wonders") result = priceAllWonders(options);
  else if (kind === "continents") result = planSevenContinents(params.get("months"), options);
  if (!result) return Response.json({ error: "Unknown trip." }, { status: 404, headers: NO_STORE });
  return Response.json({ result }, { headers: NO_STORE });
}


import { destinations } from "../../../data/destinations";
import { OpenTableClient } from "../../../lib/restaurants/OpenTableClient";
import { SupabaseRestaurantProvider } from "../../../lib/restaurants/SupabaseRestaurantProvider";
import { createClient } from "../../../lib/supabase/server";
import { GooglePlacesDiscoveryProvider } from "../../../lib/google-places/GooglePlacesDiscoveryProvider";
import { launchDinners } from "../../../data/launchSet";
import { withPlacePhotos as placePhotos } from "../../../lib/google-places/placePhotos";
import { withPlaceFacts } from "../../../lib/places/placeFacts";
import { withCuisinePhotos } from "../../../lib/places/cuisinePhotos";
import { curatedRestaurants } from "../../../lib/places/curated";
import { sharedRateLimit } from "../../../lib/security/rateLimit";
import { usdRate } from "../../../lib/pricing/aggregate";
import { localPrices } from "../../../data/destinationPlanningAverages";

// GlobTrek is a budget site: unless a traveler asks for comfort, no expensive tables.
function pricey(level) {
  return /EXPENSIVE/.test(String(level || "")) || Number(level) >= 3 || /^\${3,}$/.test(String(level || ""));
}

// The place's own photo when there is one; otherwise a food photo of its
// cuisine, never the same photo twice in one list.
async function withPhotos(items, destination) {
  return withCuisinePhotos(withPlaceFacts(await placePhotos(items), "restaurant"), destination);
}

export async function POST(request) {
  const limited = await sharedRateLimit(request, { name: "restaurants", limit: 40 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  if (typeof body.destinationId !== "string" || body.destinationId.length > 80) return Response.json({ error: "Unknown destination" }, { status: 400 });
  const destination = destinations.find((item) => (item.id || item.airport) === body.destinationId);
  if (!destination) return Response.json({ error: "Unknown destination" }, { status: 400 });
  // Launch destinations show only hand-verified restaurants.
  const verified = launchDinners(destination.id);
  if (verified.length) return Response.json({ restaurants: await withPhotos(verified, destination), source: "globtrek_launch_verified", availabilitySource: "not_requested" });
  // Tiered places: three cheap, three mid-range and three splurge tables, each
  // with Google's live per-person price range, so the traveler sees the spread.
  const all = curatedRestaurants(destination.id || destination.airport);
  if (all.some((restaurant) => restaurant.tier)) return Response.json({ restaurants: await withPhotos(all.slice(0, 9), destination), source: "globtrek_curated_google_places", tiered: true, availabilitySource: "not_requested" });
  const curated = all.filter((restaurant) => body.spendStyle === "comfortable" || !pricey(restaurant.priceLevel));
  if (curated.length) return Response.json({ restaurants: await withPhotos(curated.slice(0, 8), destination), source: "globtrek_curated_google_places", availabilitySource: "not_requested" });
  try {
    let restaurants = [];
    let source = "supabase_verified";
    const cheap = body.spendStyle !== "comfortable";
    try { restaurants = await new SupabaseRestaurantProvider(await createClient()).searchRestaurants({ destinationId: destination.id || destination.airport, names: Array.isArray(body.names) ? body.names.filter((name) => typeof name === "string") : [], limit: cheap ? 12 : 4 }); }
    catch (error) { console.warn("Restaurant catalog unavailable; using verified place discovery.", error instanceof Error ? error.message : "unknown"); }
    if (!restaurants.length && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      restaurants = await new GooglePlacesDiscoveryProvider().discoverRestaurants(destination, { limit: 8, cheap });
      source = "google_places_verified";
    }
    if (cheap) {
      // Over budget by Google's own per-person range: the cheapest price it lists
      // is above what three in four local restaurants start at.
      const upper = localPrices(destination)?.meal?.upper;
      const today = new Date().toISOString().slice(0, 10);
      const overBudget = (range) => {
        const rate = range ? usdRate(range.currency, today) : null;
        return Boolean(upper && rate && range.low * rate > upper);
      };
      restaurants = restaurants.filter((restaurant) => !pricey(restaurant.priceLevel) && !overBudget(restaurant.priceRange));
    }
    const openTable = new OpenTableClient();
    const canCheckAvailability = openTable.isConfigured() && body.startDateTime && body.partySize && restaurants.some((restaurant) => restaurant.openTableRestaurantId);
    const enriched = await Promise.all(restaurants.map(async (restaurant) => {
      if (!canCheckAvailability || !restaurant.openTableRestaurantId) return restaurant;
      try {
        const availability = await openTable.getAvailability({ restaurantId: restaurant.openTableRestaurantId, startDateTime: body.startDateTime, partySize: body.partySize });
        return { ...restaurant, availability, bookingUrl: availability.bookingUrl || restaurant.bookingUrl };
      } catch (error) {
        console.warn("OpenTable availability unavailable.", error instanceof Error ? error.message : "unknown");
        return restaurant;
      }
    }));
    return Response.json({ restaurants: await withPhotos(enriched.slice(0, 4), destination), source, availabilitySource: canCheckAvailability ? "opentable" : "not_requested" });
  } catch (error) {
    console.warn("Verified restaurant catalog unavailable.", error instanceof Error ? error.message : "unknown");
    return Response.json({ restaurants: [], source: "unavailable", availabilitySource: "unavailable" });
  }
}

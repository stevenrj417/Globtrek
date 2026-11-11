import { destinations } from "../../../data/destinations";
import { OpenTableClient } from "../../../lib/restaurants/OpenTableClient";
import { SupabaseRestaurantProvider } from "../../../lib/restaurants/SupabaseRestaurantProvider";
import { createClient } from "../../../lib/supabase/server";
import { GooglePlacesDiscoveryProvider } from "../../../lib/google-places/GooglePlacesDiscoveryProvider";
import { launchDinners } from "../../../data/launchSet";
import { withPlacePhotos } from "../../../lib/google-places/placePhotos";
import { curatedRestaurants } from "../../../lib/recommendation/eligibility";
import { rateLimit } from "../../../lib/security/rateLimit";

// GlobTrek is a budget site: unless a traveler asks for comfort, no expensive tables.
function pricey(level) {
  return /EXPENSIVE/.test(String(level || "")) || Number(level) >= 3 || /^\${3,}$/.test(String(level || ""));
}

export async function POST(request) {
  const limited = rateLimit(request, { name: "restaurants", limit: 40 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  if (typeof body.destinationId !== "string" || body.destinationId.length > 80) return Response.json({ error: "Unknown destination" }, { status: 400 });
  const destination = destinations.find((item) => (item.id || item.airport) === body.destinationId);
  if (!destination) return Response.json({ error: "Unknown destination" }, { status: 400 });
  // Launch destinations show only hand-verified restaurants.
  const verified = launchDinners(destination.id);
  if (verified.length) return Response.json({ restaurants: await withPlacePhotos(verified), source: "globtrek_launch_verified", availabilitySource: "not_requested" });
  const curated = curatedRestaurants(destination.id || destination.airport).filter((restaurant) => body.spendStyle === "comfortable" || !pricey(restaurant.priceLevel));
  if (curated.length) return Response.json({ restaurants: await withPlacePhotos(curated.slice(0, 8)), source: "globtrek_curated_google_places", availabilitySource: "not_requested" });
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
    if (cheap) restaurants = restaurants.filter((restaurant) => !pricey(restaurant.priceLevel));
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
    return Response.json({ restaurants: await withPlacePhotos(enriched.slice(0, 4)), source, availabilitySource: canCheckAvailability ? "opentable" : "not_requested" });
  } catch (error) {
    console.warn("Verified restaurant catalog unavailable.", error instanceof Error ? error.message : "unknown");
    return Response.json({ restaurants: [], source: "unavailable", availabilitySource: "unavailable" });
  }
}

import { destinations } from "../../../data/destinations";
import { OpenTableClient } from "../../../lib/restaurants/OpenTableClient";
import { SupabaseRestaurantProvider } from "../../../lib/restaurants/SupabaseRestaurantProvider";
import { createClient } from "../../../lib/supabase/server";
import { GooglePlacesDiscoveryProvider } from "../../../lib/google-places/GooglePlacesDiscoveryProvider";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const destination = destinations.find((item) => (item.id || item.airport) === body.destinationId);
  if (!destination) return Response.json({ error: "Unknown destination" }, { status: 400 });
  try {
    let restaurants = [];
    let source = "supabase_verified";
    try { restaurants = await new SupabaseRestaurantProvider(await createClient()).searchRestaurants({ destinationId: destination.id || destination.airport, names: Array.isArray(body.names) ? body.names.filter((name) => typeof name === "string") : [], limit: 3 }); }
    catch (error) { console.warn("Restaurant catalog unavailable; using verified place discovery.", error instanceof Error ? error.message : "unknown"); }
    if (!restaurants.length && process.env.GOOGLE_PLACES_API_KEY) {
      restaurants = await new GooglePlacesDiscoveryProvider().discoverRestaurants(destination, { limit: 3 });
      source = "google_places_verified";
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
    return Response.json({ restaurants: enriched.slice(0, 3), source, availabilitySource: canCheckAvailability ? "opentable" : "not_requested" });
  } catch (error) {
    console.warn("Verified restaurant catalog unavailable.", error instanceof Error ? error.message : "unknown");
    return Response.json({ restaurants: [], source: "unavailable", availabilitySource: "unavailable" });
  }
}

import { RestaurantInventoryProvider } from "./RestaurantInventoryProvider.js";
import { createReservationLink } from "./OpenTableClient.js";

function mapRestaurant(row) {
  return {
    id: row.id, destinationId: row.destination_id, name: row.name, description: row.description,
    cuisine: row.cuisine || [], neighborhood: row.neighborhood, priceLevel: row.price_level,
    latitude: row.latitude, longitude: row.longitude, imageUrl: row.image_url,
    provider: row.provider, providerId: row.provider_id, openTableRestaurantId: row.opentable_restaurant_id,
    bookingUrl: createReservationLink(row.booking_url), detailsUrl: row.details_url || null,
    rating: row.rating == null ? null : Number(row.rating), reviewCount: row.review_count == null ? null : Number(row.review_count),
    imageAttribution: row.image_attribution || [], imageSourceUrl: row.image_source_url || null, verifiedAt: row.verified_at, active: row.active,
  };
}

export class SupabaseRestaurantProvider extends RestaurantInventoryProvider {
  constructor(supabase) { super(); this.supabase = supabase; }
  async searchRestaurants({ destinationId, names = [], limit = 6 }) {
    let query = this.supabase.from("restaurant_catalog").select("*").eq("destination_id", destinationId).eq("active", true).order("editorial_score", { ascending: false }).limit(Math.min(20, Math.max(1, limit)));
    if (names.length) query = query.in("name", names.slice(0, 20));
    const { data, error } = await query;
    if (error) throw new Error(`restaurant_catalog_unavailable:${error.code || "query_failed"}`);
    return (data || []).map(mapRestaurant);
  }
  async getRestaurant({ id }) {
    const { data, error } = await this.supabase.from("restaurant_catalog").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`restaurant_unavailable:${error.code || "query_failed"}`);
    return data ? mapRestaurant(data) : null;
  }
}

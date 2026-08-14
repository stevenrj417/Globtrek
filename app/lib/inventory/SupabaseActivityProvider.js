import { ActivityInventoryProvider } from "./ActivityInventoryProvider.js";
import { rankActivities } from "../recommendation/activityEngine.js";

function mapActivity(row) {
  return {
    id: row.id, destinationId: row.destination_id, name: row.name, category: row.category, description: row.description,
    location: row.location, latitude: row.latitude, longitude: row.longitude, estimatedCostLow: row.estimated_cost_low,
    estimatedCostHigh: row.estimated_cost_high, currency: row.currency, priceSource: row.price_source, priceConfidence: row.price_confidence,
    priceLastChecked: row.price_last_checked, durationMinutes: row.duration_minutes, recommendedTimeOfDay: row.recommended_time_of_day || [],
    seasonality: row.seasonality, relaxationScore: row.relaxation_score, adventureScore: row.adventure_score, localFeelScore: row.local_feel_score,
    iconicScore: row.iconic_score, luxuryScore: row.luxury_score, familyScore: row.family_score, nightlifeScore: row.nightlife_score,
    bookingUrl: row.booking_url, provider: row.provider, providerId: row.provider_id, imageUrl: row.image_url, imageSource: row.image_source,
    imageLicenseMetadata: row.image_license_metadata, verifiedAt: row.verified_at, active: row.active,
  };
}

export class SupabaseActivityProvider extends ActivityInventoryProvider {
  constructor(supabase) { super(); this.supabase = supabase; }
  async searchActivities({ destinationId, profile, budgetPlan, context = {}, limit = 12 }) {
    const { data, error } = await this.supabase.from("activity_catalog").select("*").eq("destination_id", destinationId).eq("active", true).neq("review_status", "rejected").limit(100);
    if (error) throw new Error(`activity_catalog_unavailable:${error.code || "query_failed"}`);
    return rankActivities((data || []).map(mapActivity), profile, budgetPlan, context).slice(0, limit);
  }
  async getActivity({ id }) {
    const { data, error } = await this.supabase.from("activity_catalog").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`activity_unavailable:${error.code || "query_failed"}`);
    return data ? mapActivity(data) : null;
  }
}

import { normalizeCruiseRecord } from "../cruises/catalog.js";

export class SupabaseCruiseProvider {
  constructor(client) { this.client = client; }

  async activeSailings({ limit = 120 } = {}) {
    const { data, error } = await this.client.from("cruise_catalog").select("*, cruise_itinerary_stops(*)").eq("active", true).eq("recommendation_ready", true).gte("departure_date", new Date().toISOString().slice(0, 10)).order("departure_date", { ascending: true }).limit(limit);
    if (error?.code === "42P01" || error?.code === "PGRST205") return [];
    if (error) throw new Error(`cruise_catalog_unavailable:${error.code || "unknown"}`);
    return (data || []).map(normalizeCruiseRecord).filter(Boolean);
  }
}

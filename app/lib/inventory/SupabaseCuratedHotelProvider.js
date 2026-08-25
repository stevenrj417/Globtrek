import { HotelInventoryProvider } from "./HotelInventoryProvider.js";
import { shortlistHotels } from "../recommendation/hotelEngine.js";

export function mapHotel(row, destination) {
  return {
    id: row.id,
    name: row.name,
    destinationId: row.destination_id,
    provider: row.provider,
    providerPropertyId: row.provider_property_id,
    googlePlaceId: row.google_place_id,
    googleMapsUri: row.google_maps_uri || (/^https:\/\/(www\.)?google\./i.test(row.verification_source || "") ? row.verification_source : null),
    providerUrl: row.provider_url || null,
    bookingUrl: row.booking_com_property_url,
    cjTrackingBaseUrl: row.cj_tracking_url,
    latitude: row.latitude,
    longitude: row.longitude,
    starRating: row.star_rating,
    rating: row.review_rating,
    reviewCount: row.review_count ?? null,
    neighborhood: row.neighborhood,
    propertyType: row.property_type,
    priceTier: row.price_tier,
    amenities: row.amenity_tags || [],
    currency: row.currency,
    typicalNightlyLow: row.typical_nightly_low,
    typicalNightlyHigh: row.typical_nightly_high,
    priceSource: row.price_source,
    priceConfidence: row.price_confidence,
    lastPriceUpdated: row.price_last_checked,
    tags: row.style_tags || [],
    styleTags: row.style_tags || [],
    image: row.image_url || null,
    imageSource: row.image_source,
    imageLicense: row.image_license_metadata,
    googlePhotoManifestUrl: row.google_place_verified ? `/api/hotels/${row.id}/google-photos` : null,
    googlePlaceVerified: Boolean(row.google_place_verified),
    luxuryScore: row.luxury_score,
    relaxationScore: row.relaxation_score,
    designScore: row.design_score,
    nightlifeScore: row.nightlife_score,
    energyScore: row.energy_score,
    localFeelScore: row.local_feel_score,
    familyScore: row.family_score,
    romanticScore: row.romantic_score,
    centralityScore: row.centrality_score,
    valueScore: row.value_score,
    calmScore: row.calm_score,
    socialScore: row.social_score,
    businessScore: row.business_score,
    identityConfidence: row.identity_confidence,
    locationConfidence: row.location_confidence,
    providerLinkVerified: Boolean(row.provider_link_verified),
    photoCount: row.photo_count || 0,
    dataCompletenessScore: row.data_completeness_score || 0,
    recommendationReady: Boolean(row.recommendation_ready),
    verifiedAt: row.verified_at,
    verificationSource: row.verification_source,
  };
}

export class SupabaseCuratedHotelProvider extends HotelInventoryProvider {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async searchHotels({ destination, profile, budgetPlan, limit = 12 }) {
    const { data, error } = await this.supabase
      .from("hotel_catalog")
      .select("*")
      .eq("destination_id", destination.id || destination.airport)
      .eq("active", true)
      .eq("review_status", "verified")
      .eq("recommendation_ready", true)
      .limit(100);
    if (error) throw new Error(`curated_catalog_unavailable:${error.code || "query_failed"}`);
    return shortlistHotels((data || []).map((row) => mapHotel(row, destination)), profile, budgetPlan).slice(0, limit);
  }

  async getProperty({ id, destination }) {
    const { data, error } = await this.supabase.from("hotel_catalog").select("*").eq("id", id).eq("active", true).maybeSingle();
    if (error) throw new Error(`curated_property_unavailable:${error.code || "query_failed"}`);
    return data ? mapHotel(data, destination) : null;
  }
}

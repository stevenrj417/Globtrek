// Where imported catalog records go.
//
// SupabaseCatalogStore upserts into public.cj_catalog_properties on the stable key
// (provider, provider_property_id, destination_id), so running an import twice
// changes nothing the second time. Properties that drop out of a destination's
// latest successful import are marked inactive (never deleted), and only when the
// new import is not suspiciously small. Each run is recorded in
// public.cj_catalog_import_runs.
//
// SnapshotCatalogStore builds the JSON snapshot bundled with the site
// (app/data/feedStays.json), used when the database table is unavailable.

// Fewer than this share of the previously active records → skip deactivation.
export const DEACTIVATION_FLOOR = 0.5;

export function toRow(record, runId) {
  return {
    provider: record.provider,
    provider_property_id: record.providerPropertyId,
    destination_id: record.destinationId,
    cj_ad_id: record.feedId,
    feed_name: record.feedName,
    feed_updated_at: record.feedUpdatedAt,
    product_updated_at: record.productUpdatedAt,
    name: record.name,
    category: record.category,
    star_rating: record.starRating,
    description: record.description,
    booking_url: record.bookingUrl,
    cj_click_url: record.cjClickUrl,
    cj_tracking_base_url: record.cjTrackingBaseUrl,
    street_address: record.streetAddress,
    city: record.city,
    province_state: record.provinceState,
    postal_code: record.postalCode,
    country: record.country,
    latitude: record.latitude,
    longitude: record.longitude,
    image_url: record.photos[0] || null,
    additional_images: record.photos.slice(1),
    amenities: record.amenities,
    accessibility: record.accessibility,
    dining: record.dining,
    room_types: record.roomTypes,
    has_dorm_beds: record.dorms,
    beds: record.beds,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    beds_description: record.bedsDescription,
    max_guests: record.maxGuests,
    catalog_free_cancellation: record.catalogFreeCancellation,
    catalog_free_wifi: record.catalogFreeWifi,
    catalog_free_breakfast: record.catalogFreeBreakfast,
    near_airport: record.nearAirport,
    budget_score: record.budgetScore,
    last_seen_at: record.importedAt,
    last_import_run_id: runId,
    active: true,
    deactivated_at: null,
    deactivation_reason: null,
  };
}

export function fromRow(row) {
  return {
    id: `cj-${row.provider_property_id}`,
    sku: row.provider_property_id,
    provider: row.provider,
    providerPropertyId: row.provider_property_id,
    destinationId: row.destination_id,
    feedId: row.cj_ad_id,
    feedUpdatedAt: row.feed_updated_at,
    importedAt: row.last_seen_at,
    name: row.name,
    category: row.category,
    starRating: row.star_rating === null ? null : Number(row.star_rating),
    description: row.description,
    bookingUrl: row.booking_url,
    cjTrackingBaseUrl: row.cj_tracking_base_url,
    address: [row.street_address, row.city, row.province_state, row.postal_code].filter(Boolean).join(", ") || null,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    photos: [row.image_url, ...(row.additional_images || [])].filter(Boolean),
    amenities: row.amenities || [],
    accessibility: row.accessibility || [],
    dining: row.dining,
    roomTypes: row.room_types || [],
    dorms: Boolean(row.has_dorm_beds),
    beds: row.beds,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms === null ? null : Number(row.bathrooms),
    bedsDescription: row.beds_description,
    maxGuests: row.max_guests,
    catalogFreeCancellation: row.catalog_free_cancellation,
    catalogFreeWifi: row.catalog_free_wifi,
    catalogFreeBreakfast: row.catalog_free_breakfast,
    budgetScore: row.budget_score === null ? 0 : Number(row.budget_score),
  };
}

export class SupabaseCatalogStore {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async begin(run) {
    const { data, error } = await this.supabase.from("cj_catalog_import_runs").insert({ started_at: run.startedAt, status: "running", dry_run: false, trigger: run.trigger, destinations_attempted: run.destinationsAttempted }).select("id").single();
    if (error) throw new Error(`catalog_run_insert_failed:${error.code || "unknown"}`);
    run.id = data.id;
  }

  async save(result, run) {
    const rows = result.records.map((record) => toRow(record, run.id));
    if (rows.length) {
      const { error } = await this.supabase.from("cj_catalog_properties").upsert(rows, { onConflict: "provider,provider_property_id,destination_id" });
      if (error) throw new Error(`catalog_upsert_failed:${error.code || "unknown"}`);
    }
    const { data: active, error: activeError } = await this.supabase.from("cj_catalog_properties").select("provider_property_id").eq("destination_id", result.destinationId).eq("active", true);
    if (activeError) throw new Error(`catalog_active_lookup_failed:${activeError.code || "unknown"}`);
    const seen = new Set(rows.map((row) => row.provider_property_id));
    const missing = (active || []).map((row) => row.provider_property_id).filter((id) => !seen.has(id));
    const previous = (active || []).length;
    if (!missing.length || rows.length < previous * DEACTIVATION_FLOOR) return { saved: rows.length, deactivated: 0, skippedDeactivation: missing.length > 0 };
    const { error } = await this.supabase.from("cj_catalog_properties").update({ active: false, deactivated_at: run.startedAt, deactivation_reason: "not_in_latest_import" }).eq("destination_id", result.destinationId).in("provider_property_id", missing);
    if (error) throw new Error(`catalog_deactivate_failed:${error.code || "unknown"}`);
    return { saved: rows.length, deactivated: missing.length, skippedDeactivation: false };
  }

  async finish(run) {
    if (!run.id) return;
    await this.supabase.from("cj_catalog_import_runs").update({
      finished_at: run.finishedAt, status: run.status, destinations_succeeded: run.destinationsSucceeded,
      records_seen: run.recordsSeen, records_upserted: run.recordsSaved, records_deactivated: run.recordsDeactivated,
      error_summary: run.errors.slice(0, 100), feed_versions: run.feeds.map((feed) => ({ adId: feed.adId, name: feed.name, lastUpdated: feed.lastUpdated })),
    }).eq("id", run.id);
  }
}

// Keeps what the bundled snapshot needs; existing destinations that were not part
// of this run are kept as they were.
export class SnapshotCatalogStore {
  constructor(previous = null) {
    this.snapshot = { source: "Booking.com property catalog via GlobTrek's CJ product feeds", note: "Property details only. The feed has no prices, availability or guest reviews.", checkedAt: null, stays: { ...(previous?.stays || {}) } };
  }

  async begin(run) {
    this.snapshot.checkedAt = run.startedAt.slice(0, 10);
  }

  async save(result) {
    const before = this.snapshot.stays[result.destinationId] || [];
    const records = result.records.map(({ importedAt, ...record }) => ({ ...record, id: `cj-${record.providerPropertyId}`, sku: record.providerPropertyId, address: [record.streetAddress, record.city, record.provinceState, record.postalCode].filter(Boolean).join(", ") || null, importedAt }));
    this.snapshot.stays[result.destinationId] = records;
    const kept = new Set(records.map((record) => record.sku));
    return { saved: records.length, deactivated: before.filter((record) => !kept.has(record.sku)).length };
  }

  async finish() {}
}

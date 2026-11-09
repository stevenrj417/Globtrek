import feedSnapshot from "../../data/feedStays.json" with { type: "json" };
import { fromRow } from "../catalog/catalogStore.js";
import { nearDestination } from "../catalog/nearDestination.js";
import { destinations } from "../../data/destinations.js";

// Booking.com property catalog from GlobTrek's CJ feeds: identity, details,
// photos, amenities and tracked links. Never prices or availability (see
// BookingComDemandHotelProvider for that).
//
// Reads public.cj_catalog_properties when the database has it, and otherwise the
// snapshot bundled with the site (app/data/feedStays.json, made by
// `npm run stays:import -- --snapshot`).
export const catalogCapabilities = Object.freeze({ content: true, photos: true, rooms: true, amenities: true, trackedLinks: true, liveRates: false, availability: false, reviews: false });

// Older snapshots used shorter flag names.
function fromSnapshot(record) {
  return {
    ...record,
    catalogFreeCancellation: record.catalogFreeCancellation ?? record.freeCancellation ?? null,
    catalogFreeWifi: record.catalogFreeWifi ?? record.freeWifi ?? null,
    catalogFreeBreakfast: record.catalogFreeBreakfast ?? record.freeBreakfast ?? null,
    accessibility: record.accessibility || [],
    importedAt: record.importedAt || feedSnapshot.checkedAt,
  };
}

function destinationFor(destinationId) {
  return destinations.find((item) => item.id === destinationId) || {};
}

export function snapshotProperties(destinationId) {
  return nearDestination((feedSnapshot.stays?.[destinationId] || []).map(fromSnapshot), destinationFor(destinationId));
}

export class CjCatalogHotelProvider {
  constructor({ supabase = null } = {}) {
    this.supabase = supabase;
  }

  async listProperties(destinationId) {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from("cj_catalog_properties").select("*").eq("destination_id", destinationId).eq("active", true).order("budget_score", { ascending: false }).limit(80);
        if (!error && data?.length) return { properties: nearDestination(data.map(fromRow), destinationFor(destinationId)), source: "supabase", checkedAt: data.reduce((latest, row) => (row.last_seen_at > latest ? row.last_seen_at : latest), "").slice(0, 10) || null };
      } catch {}
    }
    const properties = snapshotProperties(destinationId);
    return { properties, source: properties.length ? "snapshot" : "none", checkedAt: properties.length ? feedSnapshot.checkedAt : null };
  }
}

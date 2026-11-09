import { createAdminClient } from "../../../lib/supabase/admin";
import { createCjClient } from "../../../lib/catalog/cjClient";
import { runImport } from "../../../lib/catalog/cjBookingImporter";
import { SupabaseCatalogStore } from "../../../lib/catalog/catalogStore";
import { catalogDestinations } from "../../../lib/catalog/catalogDestinations";

// Daily refresh of the Booking.com catalog from CJ (Vercel Cron, see vercel.json).
// A full import takes about 35 seconds per destination, so each run refreshes the
// destinations whose catalog is oldest, a few at a time, inside the function's time
// limit; every destination is refreshed within a few days. Booking.com updates the
// feeds about once a day and property details change slowly.
//
// Auth: Vercel Cron sends "Authorization: Bearer $CRON_SECRET". The same header
// works for a manual run: GET /api/cron/catalog?destinations=HAN,LIS&dryRun=1
export const runtime = "nodejs";
export const maxDuration = 300;

const PER_RUN = Math.max(1, Math.min(8, Number(process.env.CATALOG_DESTINATIONS_PER_RUN) || 6));

async function stalestFirst(supabase, all) {
  const { data, error } = await supabase.from("cj_catalog_properties").select("destination_id,last_seen_at").eq("active", true).order("last_seen_at", { ascending: true }).limit(5000);
  if (error) throw new Error(`catalog_freshness_lookup_failed:${error.code || "unknown"}`);
  const newest = new Map();
  for (const row of data || []) newest.set(row.destination_id, Math.max(newest.get(row.destination_id) || 0, Date.parse(row.last_seen_at) || 0));
  return [...all].sort((a, b) => (newest.get(a.id) || 0) - (newest.get(b.id) || 0));
}

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const dryRun = params.get("dryRun") === "1";
  const requested = (params.get("destinations") || "").split(",").map((id) => id.trim()).filter(Boolean);
  try {
    const client = createCjClient();
    if (!client.credentials.configured) return Response.json({ status: "failed", error: "Catalog import is not configured." }, { status: 503 });
    const all = catalogDestinations();
    const supabase = dryRun ? null : createAdminClient();
    const queue = requested.length ? all.filter((destination) => requested.includes(destination.id)) : supabase ? await stalestFirst(supabase, all) : all;
    const run = await runImport({
      client,
      destinations: queue.slice(0, requested.length ? 8 : PER_RUN),
      store: supabase ? new SupabaseCatalogStore(supabase) : null,
      dryRun,
      trigger: requested.length ? "manual" : "cron",
      logger: (entry) => console.log(JSON.stringify({ level: "info", ...entry })),
    });
    console.log(JSON.stringify({ level: run.status === "failed" ? "error" : "info", msg: "catalog_import_finished", status: run.status, destinations: run.destinationsSucceeded, attempted: run.destinationsAttempted, records: run.recordsSeen, saved: run.recordsSaved, deactivated: run.recordsDeactivated, errors: run.errors.length }));
    return Response.json({ status: run.status, dryRun, destinations: run.destinationsSucceeded, attempted: run.destinationsAttempted, records: run.recordsSeen, saved: run.recordsSaved, deactivated: run.recordsDeactivated, errors: run.errors }, { status: run.status === "failed" ? 502 : 200 });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "catalog_import_failed", error: String(error?.message || "unknown").slice(0, 200) }));
    return Response.json({ status: "failed", error: "Catalog import failed." }, { status: 500 });
  }
}

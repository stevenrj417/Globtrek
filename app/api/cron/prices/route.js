import { createAdminClient } from "../../../lib/supabase/admin";
import { FARE_ORIGINS, collectOriginFares } from "../../../lib/pricing/collectFares.js";
import { observation, observationKey } from "../../../lib/pricing/observations.js";
import { travelpayoutsConfig } from "../../../lib/travelpayouts/client.js";

// Daily fare collection into public.price_observations (Vercel Cron, see
// vercel.json). Each run takes the next slice of origins, so every origin is
// collected about once a week; the Aviasales data covers fares found in the
// last days, so weekly runs build a continuous history.
//
// Auth: Vercel Cron sends "Authorization: Bearer $CRON_SECRET".
// Manual run: GET /api/cron/prices?origins=LAX,JFK
export const runtime = "nodejs";
export const maxDuration = 300;

const PER_RUN = 16;

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const day = Math.floor(Date.now() / 86400000);
  const start = (day * PER_RUN) % FARE_ORIGINS.length;
  const origins = params.get("origins") ? params.get("origins").split(",").map((code) => code.trim().toUpperCase()).filter((code) => /^[A-Z]{3}$/.test(code)) : [...FARE_ORIGINS, ...FARE_ORIGINS].slice(start, start + PER_RUN);
  const supabase = createAdminClient();
  const { token } = travelpayoutsConfig();
  const results = [];
  for (const origin of origins) {
    const { rows, errors } = await collectOriginFares({ token, origin });
    let stored = 0;
    let storeError = null;
    for (let index = 0; index < rows.length; index += 500) {
      const batch = rows.slice(index, index + 500).map(observation).filter(Boolean).map((row) => ({ kind: row.kind, item_id: row.itemId, provider: row.provider, source: row.source, observed_at: row.observedAt, travel_date: row.travelDate, travel_end: row.travelEnd, price: row.price, currency: row.currency, unit: row.unit, taxes_included: row.taxesIncluded, conditions: row.conditions, dedupe_key: observationKey(row) }));
      const { error, count } = await supabase.from("price_observations").upsert(batch, { onConflict: "dedupe_key", ignoreDuplicates: true, count: "exact" });
      if (error) { storeError = error.code || "store_failed"; break; }
      stored += count || 0;
    }
    results.push({ origin, found: rows.length, stored, errors, storeError });
    if (storeError === "42P01" || storeError === "PGRST205") break;
  }
  return Response.json({ origins: results }, { headers: { "Cache-Control": "no-store" } });
}

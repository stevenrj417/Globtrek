import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { normalizeCruiseRecord } from "../../app/lib/cruises/catalog.js";

const path = process.argv[2];
if (!path) throw new Error("Usage: npm run cruises:import -- path/to/verified-cruises.json");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Production Supabase server credentials are required.");
const payload = JSON.parse(await readFile(path, "utf8"));
const records = Array.isArray(payload) ? payload : payload.records;
if (!Array.isArray(records)) throw new Error("Cruise import must be an array or { records: [] }.");
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const report = { submitted: records.length, imported: 0, rejected: [] };

for (const [index, input] of records.entries()) {
  const record = { ...input, id: input.id || randomUUID() };
  const normalized = normalizeCruiseRecord(record);
  if (!normalized) { report.rejected.push({ index, providerCruiseId: input.provider_cruise_id || null, reason: "Cruise failed the verified-sailing contract" }); continue; }
  const { cruise_itinerary_stops: stops, id: ignoredId, ...catalogRow } = record;
  void ignoredId;
  const { data: saved, error } = await client.from("cruise_catalog").upsert(catalogRow, { onConflict: "provider,provider_cruise_id,departure_date" }).select("id").single();
  if (error) { report.rejected.push({ index, providerCruiseId: input.provider_cruise_id, reason: error.code || "catalog_write_failed" }); continue; }
  const preparedStops = stops.map((rawStop) => { const stop = { ...rawStop, cruise_id: saved.id }; delete stop.id; return stop; });
  const { error: deleteError } = await client.from("cruise_itinerary_stops").delete().eq("cruise_id", saved.id);
  const { error: stopError } = deleteError ? { error: deleteError } : await client.from("cruise_itinerary_stops").insert(preparedStops);
  if (stopError) { await client.from("cruise_catalog").update({ recommendation_ready: false, itinerary_verified: false }).eq("id", saved.id); report.rejected.push({ index, providerCruiseId: input.provider_cruise_id, reason: stopError.code || "itinerary_write_failed" }); continue; }
  report.imported += 1;
}

console.log(JSON.stringify(report, null, 2));
if (report.rejected.length) process.exitCode = 2;

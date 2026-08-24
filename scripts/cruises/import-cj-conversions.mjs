import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const path = process.argv[2];
if (!path) throw new Error("Usage: npm run cruises:conversions -- path/to/normalized-cj-conversions.json");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Production Supabase server credentials are required.");
const payload = JSON.parse(await readFile(path, "utf8")); const records = Array.isArray(payload) ? payload : payload.records;
if (!Array.isArray(records)) throw new Error("Conversion import must be an array or { records: [] }.");
const allowed = records.filter((record) => record?.provider === "cruisedirect_cj" && record.provider_order_id && /^\d{4}-\d{2}-\d{2}T/.test(record.occurred_at || "") && record.source === "cj_commission_report").map((record) => ({ cruise_id: record.cruise_id || null, provider: record.provider, provider_order_id: String(record.provider_order_id), click_id: record.click_id || null, sail_date: record.sail_date || null, sale_amount: record.sale_amount ?? null, commission_amount: record.commission_amount ?? null, currency: record.currency || null, occurred_at: record.occurred_at, source: record.source }));
if (allowed.length !== records.length) throw new Error("Every conversion must be a normalized CJ commission record; client-created conversions are rejected.");
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await client.from("cruise_conversion_events").upsert(allowed, { onConflict: "provider,provider_order_id" });
if (error) throw new Error(`Conversion import failed: ${error.code || "unknown"}`);
console.log(JSON.stringify({ submitted: records.length, imported: allowed.length }, null, 2));

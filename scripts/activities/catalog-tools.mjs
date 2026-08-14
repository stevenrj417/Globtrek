import { createHash } from "node:crypto";

const CATEGORIES = new Set(["food", "culture", "museums", "nature", "adventure", "wellness", "nightlife", "shopping", "architecture", "beaches", "water", "day_trip", "local", "luxury", "free"]);
export function normalizeActivityName(value) { return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
export function activityId(record) { return createHash("sha256").update(`${record.destinationId}|${normalizeActivityName(record.name)}|${record.provider || "editorial"}`).digest("hex").slice(0, 24); }
export function validateActivity(record, destinationIds = new Set()) {
  const errors = [];
  if (!String(record.name || "").trim()) errors.push("missing_name");
  if (!record.destinationId || (destinationIds.size && !destinationIds.has(record.destinationId))) errors.push("destination_mismatch");
  if (!CATEGORIES.has(record.category)) errors.push("invalid_category");
  if (!record.verificationSource || !record.verifiedAt) errors.push("unverified_identity");
  if (record.bookingUrl) { try { if (new URL(record.bookingUrl).protocol !== "https:") errors.push("invalid_booking_url"); } catch { errors.push("invalid_booking_url"); } }
  const low = record.estimatedCostLow == null ? null : Number(record.estimatedCostLow); const high = record.estimatedCostHigh == null ? null : Number(record.estimatedCostHigh);
  if ((low != null && (!Number.isFinite(low) || low < 0)) || (high != null && (!Number.isFinite(high) || high < (low ?? 0)))) errors.push("malformed_price");
  for (const field of ["relaxationScore", "adventureScore", "localFeelScore", "iconicScore", "luxuryScore", "familyScore", "nightlifeScore"]) if (record[field] != null && (!Number.isInteger(record[field]) || record[field] < 0 || record[field] > 100)) errors.push("invalid_score");
  return [...new Set(errors)];
}
export function importActivityBatch(records, destinationIds) {
  const seen = new Set(); const accepted = []; const rejected = [];
  for (const input of records) { const record = { ...input, id: input.id || activityId(input), normalizedName: normalizeActivityName(input.name), provider: input.provider || "editorial" }; const key = `${record.destinationId}|${record.normalizedName}|${record.provider}`; const errors = validateActivity(record, destinationIds); if (seen.has(key)) errors.push("duplicate"); if (errors.length) rejected.push({ record: input, errors: [...new Set(errors)] }); else { seen.add(key); accepted.push(record); } }
  return { submitted: records.length, imported: accepted.length, rejected: rejected.length, records: accepted, failures: rejected };
}

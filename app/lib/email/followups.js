import crypto from "node:crypto";
import { FOLLOWUP_DAYS } from "./templates.js";

const DAY = 86400000;

function secret() {
  const value = process.env.SHARE_TOKEN_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    || (process.env.NODE_ENV === "production" ? null : "globtrek-local-development-followup-key");
  if (!value) throw new Error("followup_key_not_configured");
  return value;
}

function sign(id) {
  return crypto.createHmac("sha256", secret()).update(`trip-followup:${id}`).digest("base64url").slice(0, 32);
}

// One sequence per address and destination, whatever stay or dates they pick.
export function tripKey(model) {
  const destination = model?.destination || {};
  return String(destination.id || destination.slug || destination.city || destination.name || "trip").toLowerCase().slice(0, 120);
}

// The link token is the row id plus an HMAC of it, so every email in the
// sequence carries a link that keeps working and nothing secret is stored.
export function followupToken(id) {
  return `${id}.${sign(id)}`;
}

export function readFollowupToken(token) {
  if (typeof token !== "string" || token.length > 120) return null;
  const [id, mac] = token.split(".");
  if (!/^[0-9a-f-]{36}$/i.test(id || "") || !mac) return null;
  const expected = Buffer.from(sign(id));
  const given = Buffer.from(mac);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? id : null;
}

// When follow-up `step` (1-based) is due, counted from the day the trip was sent.
export function followupDueAt(startedAt, step) {
  const days = FOLLOWUP_DAYS[step - 1];
  return days == null ? null : new Date(new Date(startedAt).getTime() + days * DAY).toISOString();
}

// Starts (or refreshes) the check-ins for this trip. A sequence the person
// stopped stays stopped; an active one keeps its schedule but gets the latest trip.
export async function enrollFollowups(supabase, { email, model, viewUrl, source, confirmed, now = new Date() }) {
  const key = tripKey(model);
  const { data: existing } = await supabase.from("trip_followups").select("id,status").eq("email", email).eq("trip_key", key).maybeSingle();
  const stamp = now.toISOString();
  if (existing && existing.status !== "done") {
    if (existing.status === "stopped") return { id: existing.id, status: "stopped" };
    const status = existing.status === "pending" && confirmed ? "active" : existing.status;
    await supabase.from("trip_followups").update({ model, view_url: viewUrl, status, updated_at: stamp }).eq("id", existing.id);
    return { id: existing.id, status };
  }
  const row = { email, trip_key: key, destination_name: model.destination?.city || model.destination?.name || "your trip", model, view_url: viewUrl, step: 0, next_send_at: followupDueAt(now, 1), status: confirmed ? "active" : "pending", source, created_at: stamp, updated_at: stamp };
  const { data, error } = existing
    ? await supabase.from("trip_followups").update(row).eq("id", existing.id).select("id,status").single()
    : await supabase.from("trip_followups").insert(row).select("id,status").single();
  if (error) throw new Error(error.message);
  return data;
}

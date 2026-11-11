import crypto from "node:crypto";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";
import { enrollFollowups, followupToken } from "../../../lib/email/followups";
import { sendEmail } from "../../../lib/email/resend";
import { tripEmail } from "../../../lib/email/templates";
import { confirmEmailAccepted, tripEmailIdempotencyKey } from "../../../lib/email/tripDelivery";
import { normalizeEmail, publicSiteUrl } from "../../../lib/email/subscriptions";
import { buildTripEmailModel } from "../../../lib/recommendation/tripSerializer";
import { sharedRateLimit } from "../../../lib/security/rateLimit";
import { decodeSharedTrip } from "../../../lib/results/resolveResults";
import { sealShareToken } from "../../../lib/results/shareToken";

// Only links back to GlobTrek. A readable ?trip= link is swapped for an
// encrypted, expiring share link so trip details never sit in the email in clear.
function safeViewUrl(value) {
  if (typeof value !== "string") return null;
  let url;
  try { url = new URL(value, "https://www.glob-trek.com"); } catch { return null; }
  if (url.protocol !== "https:" || !["glob-trek.com", "www.glob-trek.com"].includes(url.hostname)) return null;
  const legacy = url.searchParams.get("trip");
  if (legacy) {
    const trip = decodeSharedTrip(legacy);
    if (!trip?.quiz || typeof trip.destination !== "string") return "https://www.glob-trek.com/results";
    const quiz = { ...trip.quiz };
    for (const field of ["email", "name", "phone", "firstName", "lastName"]) delete quiz[field];
    try {
      const { token } = sealShareToken({ quiz, destination: trip.destination, stay: typeof trip.stay === "string" ? trip.stay : null, snapshot: null });
      return `https://www.glob-trek.com/results?s=${token}`;
    } catch {
      return `https://www.glob-trek.com/results?destination=${encodeURIComponent(trip.destination)}`;
    }
  }
  return url.toString();
}

async function sessionEmail() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return normalizeEmail(data?.user?.email);
  } catch {
    return null;
  }
}

// kind "requested": someone pressed Email this trip (any address).
// kind "book" / "arrival": a signed-in traveler pressed Book or finished the
// quiz, so it goes only to their account email, at most once a day per place.
// Requested and booked trips get the check-in sequence; a signed-out request
// has to confirm it from the first email before anything else is sent.
export async function POST(request) {
  const limited = await sharedRateLimit(request, { name: "email-trip", limit: 5 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const kind = ["book", "arrival"].includes(body.kind) ? body.kind : "requested";
  const trip = body.trip;
  if (!trip?.destination || !trip?.itinerary?.days?.length || JSON.stringify(body).length > 120000) return Response.json({ error: "A valid email and complete trip are required." }, { status: 400 });
  const accountEmail = await sessionEmail();
  const email = kind === "requested" ? normalizeEmail(body.email) : accountEmail;
  if (!email) return Response.json({ error: kind === "requested" ? "A valid email and complete trip are required." : "Sign in to get this trip by email." }, { status: kind === "requested" ? 400 : 401 });
  const model = buildTripEmailModel({ ...trip, travelerProfile: trip.travelerProfile || trip.trip, hotelSelection: trip.selections?.hotel || trip.hotelSelection });
  const viewUrl = safeViewUrl(body.viewUrl);
  const city = model.destination.city || model.destination.name;
  const day = new Date().toISOString().slice(0, 10);
  const key = kind === "requested" ? tripEmailIdempotencyKey(email, model) : `tripday-${crypto.createHash("sha256").update(`${email}:${city}:${day}`).digest("hex").slice(0, 40)}`;
  let supabase = null;
  try { supabase = createAdminClient(); } catch {}
  if (kind !== "requested" && supabase) {
    const { data: already } = await supabase.from("email_sends").select("id").eq("idempotency_key", key).maybeSingle().then((result) => result, () => ({ data: null }));
    if (already) return Response.json({ sent: false, duplicate: true });
  }
  let followup = null;
  if (kind !== "arrival" && body.followups !== false && supabase) {
    try {
      const confirmed = Boolean(accountEmail && accountEmail === email);
      const row = await enrollFollowups(supabase, { email, model, viewUrl, source: kind === "book" ? "book" : "email", confirmed });
      const token = followupToken(row.id);
      if (row.status === "active") followup = { stopUrl: `${publicSiteUrl()}/trip-reminders?stop=${encodeURIComponent(token)}` };
      else if (row.status === "pending") followup = { confirmUrl: `${publicSiteUrl()}/trip-reminders?confirm=${encodeURIComponent(token)}` };
    } catch (error) {
      console.error(JSON.stringify({ level: "warn", msg: "trip_followup_enroll_failed", error: error instanceof Error ? error.message : "unknown" }));
    }
  }
  const subject = kind === "requested" ? `Your GlobTrek journey to ${city}` : `Here's your trip to ${city}`;
  try {
    const provider = confirmEmailAccepted(await sendEmail({ from: "GlobTrek Trips <trips@glob-trek.com>", to: [email], subject, html: tripEmail({ model, viewUrl, arrival: kind === "arrival", followup }) }, { idempotencyKey: key }));
    try { await supabase?.from("email_sends").upsert({ recipient_email: email, email_type: kind === "arrival" ? "arrival" : "trip", provider_message_id: provider.id || null, idempotency_key: key }, { onConflict: "idempotency_key" }); } catch {}
    return Response.json({ sent: true, followups: followup?.stopUrl ? "on" : followup?.confirmUrl ? "confirm" : "off" });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "trip_email_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Your trip could not be emailed right now." }, { status: 503 });
  }
}

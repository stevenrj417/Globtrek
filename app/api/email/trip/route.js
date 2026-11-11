import { createAdminClient } from "../../../lib/supabase/admin";
import { sendEmail } from "../../../lib/email/resend";
import { tripEmail } from "../../../lib/email/templates";
import { confirmEmailAccepted, tripEmailIdempotencyKey } from "../../../lib/email/tripDelivery";
import { normalizeEmail } from "../../../lib/email/subscriptions";
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

export async function POST(request) {
  const limited = await sharedRateLimit(request, { name: "email-trip", limit: 5 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const trip = body.trip;
  if (!email || !trip?.destination || !trip?.itinerary?.days?.length || JSON.stringify(body).length > 120000) return Response.json({ error: "A valid email and complete trip are required." }, { status: 400 });
  const model = buildTripEmailModel({ ...trip, travelerProfile: trip.travelerProfile || trip.trip, hotelSelection: trip.selections?.hotel || trip.hotelSelection });
  const key = tripEmailIdempotencyKey(email, model);
  try {
    const provider = confirmEmailAccepted(await sendEmail({ from: "GlobTrek Trips <trips@glob-trek.com>", to: [email], subject: `Your GlobTrek journey to ${model.destination.city || model.destination.name}`, html: tripEmail({ model, viewUrl: safeViewUrl(body.viewUrl) }) }, { idempotencyKey: key }));
    try { const supabase = createAdminClient(); await supabase.from("email_sends").upsert({ recipient_email: email, email_type: "trip", provider_message_id: provider.id || null, idempotency_key: key }, { onConflict: "idempotency_key" }); } catch {}
    return Response.json({ sent: true });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "trip_email_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Your trip could not be emailed right now." }, { status: 503 });
  }
}

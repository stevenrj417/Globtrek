import crypto from "node:crypto";
import { createAdminClient } from "../../../lib/supabase/admin";
import { sendEmail } from "../../../lib/email/resend";
import { tripEmail } from "../../../lib/email/templates";
import { normalizeEmail } from "../../../lib/email/subscriptions";
import { buildTripEmailModel } from "../../../lib/recommendation/tripSerializer";

function safeViewUrl(value) {
  if (typeof value !== "string") return null;
  if (value.startsWith("/")) return `https://glob-trek.com${value}`;
  try { const url = new URL(value); return url.protocol === "https:" && ["glob-trek.com", "www.glob-trek.com"].includes(url.hostname) ? url.toString() : null; } catch { return null; }
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const trip = body.trip;
  if (!email || !trip?.destination || !trip?.itinerary?.days?.length || JSON.stringify(body).length > 120000) return Response.json({ error: "A valid email and complete trip are required." }, { status: 400 });
  const model = buildTripEmailModel({ ...trip, travelerProfile: trip.travelerProfile || trip.trip, hotelSelection: trip.selections?.hotel || trip.hotelSelection });
  const key = `trip-${crypto.createHash("sha256").update(`${email}:${trip.clientTripKey || JSON.stringify(model.destination)}:${trip.itinerary.days.length}`).digest("hex").slice(0, 40)}`;
  try {
    const provider = await sendEmail({ from: "Globtrek Trips <trips@glob-trek.com>", to: [email], subject: `Your ${model.itinerary.days.length}-day trip to ${model.destination.city || model.destination.name}`, html: tripEmail({ model, viewUrl: safeViewUrl(body.viewUrl) }) }, { idempotencyKey: key });
    try { const supabase = createAdminClient(); await supabase.from("email_sends").upsert({ recipient_email: email, email_type: "trip", provider_message_id: provider.id || null, idempotency_key: key }, { onConflict: "idempotency_key" }); } catch {}
    return Response.json({ sent: true });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "trip_email_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Your trip could not be emailed right now." }, { status: 503 });
  }
}

import crypto from "node:crypto";
import { sendEmail } from "../../../lib/email/resend";
import { placeTripEmail } from "../../../lib/email/templates";
import { confirmEmailAccepted } from "../../../lib/email/tripDelivery";
import { normalizeEmail, publicSiteUrl } from "../../../lib/email/subscriptions";
import { sharedRateLimit } from "../../../lib/security/rateLimit";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createPlacesClient, DESTINATION_FIELDS } from "../../../lib/anyplace/google";
import { destinationFrom } from "../../../lib/anyplace/picks";
import { resolveTrip } from "../../../lib/anyplace/tripData";
import { flightLink, parseTripParams, stayLink, ticketsLink, tripPath } from "../../../lib/anyplace/trip";
import { cjDestinationStaysUrl } from "../../../lib/booking/cj";

export const maxDuration = 60;
const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;

// "Email my trip" on an any-place trip page. The browser sends only the place ID,
// the trip's query string and an address; the trip is looked up again here, so
// the email can only ever hold GlobTrek's own picks and links.
export async function POST(request) {
  const limited = await sharedRateLimit(request, { name: "email-place-trip", limit: 5 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const placeId = typeof body.placeId === "string" && PLACE_ID.test(body.placeId) ? body.placeId : null;
  if (!email || !placeId || typeof body.query !== "string" || body.query.length > 4000) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  const trip = parseTripParams(Object.fromEntries(new URLSearchParams(body.query)));
  try {
    const places = createPlacesClient();
    const destination = destinationFrom(await places.details(placeId, DESTINATION_FIELDS));
    if (!destination) return Response.json({ error: "We couldn't find that place." }, { status: 404 });
    const resolved = await resolveTrip(destination, trip, { photos: false, places });
    const site = publicSiteUrl();
    const html = placeTripEmail({
      destination,
      stay: resolved.stay,
      stayUrl: resolved.stay ? stayLink(resolved.stay, trip) : cjDestinationStaysUrl({ city: destination.name, country: destination.country }),
      flightUrl: flightLink(resolved.airport, trip),
      airport: resolved.airport,
      activities: resolved.activities.map((place) => ({ ...place, ticketsUrl: ticketsLink(place, destination) })),
      dinners: resolved.dinners,
      tripUrl: `${site}${tripPath(placeId, trip)}`,
      dates: trip.start && trip.end ? { start: trip.start, end: trip.end } : null,
      adults: trip.adults,
    });
    const key = `placetrip-${crypto.createHash("sha256").update(`${email}:${placeId}:${body.query}:${new Date().toISOString().slice(0, 13)}`).digest("hex").slice(0, 40)}`;
    const provider = confirmEmailAccepted(await sendEmail({ from: "GlobTrek Trips <trips@glob-trek.com>", to: [email], subject: `Your trip to ${destination.name}, step by step`, html }, { idempotencyKey: key }));
    try { await createAdminClient().from("email_sends").upsert({ recipient_email: email, email_type: "trip", provider_message_id: provider.id || null, idempotency_key: key }, { onConflict: "idempotency_key" }); } catch {}
    return Response.json({ sent: true });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "place_trip_email_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Your trip could not be emailed right now. Try again in a minute." }, { status: 503 });
  }
}

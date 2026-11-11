import { track as vercelTrack } from "@vercel/analytics";

// Funnel events. Keep names stable: dashboards and experiments depend on them.
export const EVENTS = Object.freeze([
  "landing_viewed",
  "quiz_started",
  "quiz_step_completed",
  "quiz_completed",
  "result_viewed",
  "hotel_card_viewed",
  "outbound_click",
  "email_signup",
  "trip_shared",
  "trip_adjusted",
  "trip_adjust_undone",
  "estimates_refreshed",
  "result_feedback",
  "no_match_fix",
  "booking_item_opened",
  "stay_partner_opened",
]);

const PERSONAL = /@|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;

// Strip anything that could identify a person: no emails, phone numbers or free text.
export function sanitizeProperties(properties = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value == null) continue;
    if (typeof value === "number" || typeof value === "boolean") clean[key] = value;
    else if (typeof value === "string" && !PERSONAL.test(value)) clean[key] = value.slice(0, 80);
  }
  return clean;
}

export function track(event, properties) {
  try {
    vercelTrack(event, sanitizeProperties(properties));
  } catch {
    // Analytics must never break the product.
  }
}

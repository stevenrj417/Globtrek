import { createAdminClient } from "../../../lib/supabase/admin";
import { demandConfigured, mayStoreQuotes, quoteObservation, quoteStays } from "../../../lib/pricing/bookingDemand";
import { observation, observationKey } from "../../../lib/pricing/observations";

const PER_RUN = 40;

// Daily: prices the most useful queued stays (stay_price_refresh_queue) and
// records each quote as a price observation. Does nothing until the Demand API
// is connected AND the partner terms allow keeping quotes
// (BOOKING_DEMAND_STORE_QUOTES=true).
export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!demandConfigured()) return Response.json({ skipped: "Booking.com Demand API is not connected" });
  if (!mayStoreQuotes()) return Response.json({ skipped: "Storing quotes is off (BOOKING_DEMAND_STORE_QUOTES)" });
  const supabase = createAdminClient();
  const now = new Date();
  const { data: due, error } = await supabase.from("stay_price_refresh_queue").select("*").lte("next_attempt_at", now.toISOString()).order("priority", { ascending: false }).limit(PER_RUN);
  if (error) return Response.json({ error: "Queue unavailable." }, { status: 500 });
  let stored = 0;
  for (const row of due || []) {
    const id = String(row.item_id).replace(/^booking:/, "");
    let status = "no_rate";
    try {
      const { quotes } = await quoteStays({ ids: [id], checkIn: row.check_in, checkOut: row.check_out, adults: row.adults, rooms: row.rooms, now });
      const quote = quotes[id];
      if (quote) {
        const obs = observation(quoteObservation(quote, { itemId: row.item_id, destinationId: row.destination_id }));
        if (obs) {
          const nights = obs.conditions.nights;
          await supabase.from("price_observations").upsert({ kind: obs.kind, item_id: obs.itemId, destination_id: obs.destinationId, provider: obs.provider, source: obs.source, observed_at: obs.observedAt, travel_date: obs.travelDate, travel_end: obs.travelEnd, price: obs.price, currency: obs.currency, unit: obs.unit, taxes_included: obs.taxesIncluded, occupancy: obs.occupancy, room_type: obs.roomType, conditions: obs.conditions, nights, total_price: quote.total, taxes_and_fees: quote.taxesAndFees, refundable: quote.refundable, meal_plan: quote.mealPlan, dedupe_key: observationKey(obs) }, { onConflict: "dedupe_key" });
          stored += 1;
          status = "stored";
        }
      }
    } catch (failure) {
      status = `error_${failure?.status || "network"}`;
    }
    // Priced stays are re-checked in a week; failures back off by attempts.
    const wait = status === "stored" ? 7 : Math.min(14, 2 ** (row.attempts + 1));
    await supabase.from("stay_price_refresh_queue").update({ attempts: row.attempts + 1, last_status: status, last_attempt_at: now.toISOString(), next_attempt_at: new Date(now.getTime() + wait * 86400000).toISOString() }).eq("id", row.id);
  }
  return Response.json({ due: due?.length || 0, stored });
}

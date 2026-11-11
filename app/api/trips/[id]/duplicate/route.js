import { randomUUID } from "node:crypto";
import { createClient } from "../../../../lib/supabase/server";

const NO_STORE = { "Cache-Control": "private, no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A private copy of one of the user's own trips. Sharing is never copied.
export async function POST(_request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  if (!UUID.test(id || "")) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  const { data: source } = await supabase.from("saved_trips").select("*").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
  if (!source) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  const { _share, ...tripData } = source.trip_data || {};
  void _share;
  const copy = {
    user_id: auth.user.id,
    client_trip_key: `copy:${randomUUID()}`,
    destination_name: source.destination_name,
    destination_country: source.destination_country,
    destination_airport: source.destination_airport,
    start_date: source.start_date,
    end_date: source.end_date,
    travelers: source.travelers,
    trip_data: { ...tripData, title: `${tripData.title || source.destination_name} (copy)`.slice(0, 80) },
    booking_references: {},
  };
  const { data, error } = await supabase.from("saved_trips").insert(copy).select().single();
  return error ? Response.json({ error: "Could not copy trip" }, { status: 500, headers: NO_STORE }) : Response.json({ trip: data }, { status: 201, headers: NO_STORE });
}

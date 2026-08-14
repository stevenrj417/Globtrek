import { createClient } from "../../lib/supabase/server";

const MAX_DATA_SIZE = 100000;

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function GET() {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("saved_trips").select("*").order("updated_at", { ascending: false });
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ trips: data });
}

export async function POST(request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.clientTripKey || !body?.destination?.city || JSON.stringify(body).length > MAX_DATA_SIZE) return Response.json({ error: "Invalid trip" }, { status: 400 });
  const record = {
    user_id: user.id,
    client_trip_key: String(body.clientTripKey).slice(0, 160),
    destination_name: String(body.destination.city).slice(0, 120),
    destination_country: String(body.destination.country || "").slice(0, 120),
    destination_airport: String(body.destination.airport || "").slice(0, 12),
    start_date: body.trip?.tripStart || null,
    end_date: body.trip?.tripEnd || null,
    travelers: Math.max(1, Math.min(30, Number.parseInt(body.trip?.guestCount, 10) || 1)),
    trip_data: body,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("saved_trips").upsert(record, { onConflict: "user_id,client_trip_key" }).select().single();
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ trip: data });
}

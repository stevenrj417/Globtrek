import { createClient } from "../../../lib/supabase/server";

const NO_STORE = { "Cache-Control": "private, no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Every query filters on the signed-in user's id as well as relying on row-level
// security, so one account can never read or change another's trip.
async function ownerContext(params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  return { id: UUID.test(id || "") ? id : null, supabase, user: auth?.user || null };
}

export async function GET(_request, { params }) {
  const { id, supabase, user } = await ownerContext(params);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  if (!id) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  const { data, error } = await supabase.from("saved_trips").select("*").eq("id", id).eq("user_id", user.id).single();
  return error ? Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE }) : Response.json({ trip: data }, { headers: NO_STORE });
}

// Rename ({ title }) or replace the plan ({ trip_data }). Sharing settings are
// kept either way; they change only through the share route.
export async function PATCH(request, { params }) {
  const { id, supabase, user } = await ownerContext(params);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  if (!id) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.replace(/\s+/g, " ").trim().slice(0, 80) : null;
  if (!title && (!body?.trip_data || typeof body.trip_data !== "object" || JSON.stringify(body.trip_data).length > 100000)) return Response.json({ error: "Invalid trip" }, { status: 400, headers: NO_STORE });
  const { data: existing } = await supabase.from("saved_trips").select("trip_data").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!existing) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  const tripData = title ? { ...existing.trip_data, title } : { ...body.trip_data, _share: existing.trip_data?._share, title: existing.trip_data?.title };
  const { data, error } = await supabase.from("saved_trips").update({ trip_data: tripData, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).select().single();
  return error ? Response.json({ error: "Could not update trip" }, { status: 500, headers: NO_STORE }) : Response.json({ trip: data }, { headers: NO_STORE });
}

export async function DELETE(_request, { params }) {
  const { id, supabase, user } = await ownerContext(params);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  if (!id) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  const { data, error } = await supabase.from("saved_trips").delete().eq("id", id).eq("user_id", user.id).select("id");
  if (error) return Response.json({ error: "Could not delete trip" }, { status: 500, headers: NO_STORE });
  if (!data?.length) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  return new Response(null, { status: 204, headers: NO_STORE });
}

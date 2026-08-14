import { createClient } from "../../../lib/supabase/server";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.trip_data || JSON.stringify(body.trip_data).length > 100000) return Response.json({ error: "Invalid trip" }, { status: 400 });
  const { data, error } = await supabase.from("saved_trips").update({ trip_data: body.trip_data, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ trip: data });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase.from("saved_trips").delete().eq("id", id);
  return error ? Response.json({ error: error.message }, { status: 500 }) : new Response(null, { status: 204 });
}

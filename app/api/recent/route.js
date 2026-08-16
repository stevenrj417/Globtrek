import { createClient } from "../../lib/supabase/server";

const TYPES = new Set(["hotel", "destination", "trip"]);

export async function POST(request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response(null, { status: 204 });
  const body = await request.json().catch(() => null);
  if (!body || !TYPES.has(body.type) || !body.key || !body.title || JSON.stringify(body).length > 30000) return Response.json({ error: "Invalid recent item" }, { status: 400 });
  const record = { user_id: auth.user.id, item_type: body.type, item_key: String(body.key).slice(0, 180), title: String(body.title).slice(0, 160), subtitle: String(body.subtitle || "").slice(0, 180) || null, image_url: String(body.imageUrl || "").slice(0, 1000) || null, item_data: body.data && typeof body.data === "object" ? body.data : {}, viewed_at: new Date().toISOString() };
  const { error } = await supabase.from("recent_views").upsert(record, { onConflict: "user_id,item_type,item_key" });
  return error ? Response.json({ error: error.message }, { status: 500 }) : new Response(null, { status: 204 });
}

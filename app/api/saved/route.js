import { createClient } from "../../lib/supabase/server";

const TYPES = new Set(["hotel", "destination"]);
const MAX_DATA_SIZE = 30000;

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function GET() {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("saved_items").select("*").order("updated_at", { ascending: false });
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ saved: data || [] });
}

export async function POST(request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !TYPES.has(body.type) || !body.key || !body.title || JSON.stringify(body).length > MAX_DATA_SIZE) return Response.json({ error: "Invalid saved item" }, { status: 400 });
  const record = {
    user_id: user.id,
    item_type: body.type,
    item_key: String(body.key).slice(0, 180),
    title: String(body.title).slice(0, 160),
    subtitle: String(body.subtitle || "").slice(0, 180) || null,
    image_url: String(body.imageUrl || "").slice(0, 1000) || null,
    item_data: body.data && typeof body.data === "object" ? body.data : {},
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("saved_items").upsert(record, { onConflict: "user_id,item_type,item_key" }).select().single();
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ item: data });
}

export async function DELETE(request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const key = searchParams.get("key");
  if (!TYPES.has(type) || !key) return Response.json({ error: "Invalid saved item" }, { status: 400 });
  const { error } = await supabase.from("saved_items").delete().eq("item_type", type).eq("item_key", key);
  return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ ok: true });
}

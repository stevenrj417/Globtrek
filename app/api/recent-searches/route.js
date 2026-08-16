import { createHash } from "node:crypto";
import { createClient } from "../../lib/supabase/server";

export async function POST(request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response(null, { status: 204 });
  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.searchData || JSON.stringify(body.searchData).length > 30000) return Response.json({ error: "Invalid search" }, { status: 400 });
  const destinationId = String(body.destinationId || "").slice(0, 180) || null;
  const searchKey = createHash("sha256").update(JSON.stringify({ destinationId, searchData: body.searchData })).digest("hex").slice(0, 40);
  const { error } = await supabase.from("recent_searches").upsert({ user_id: auth.user.id, search_key: searchKey, destination_id: destinationId, title: String(body.title).slice(0, 160), search_data: body.searchData, searched_at: new Date().toISOString() }, { onConflict: "user_id,search_key" });
  return error ? Response.json({ error: error.message }, { status: 500 }) : new Response(null, { status: 204 });
}

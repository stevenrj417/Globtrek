import { randomBytes } from "node:crypto";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const isPublic = body.public !== false;
  const { data: existing } = await supabase.from("saved_trips").select("public_slug").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
  if (!existing) return Response.json({ error: "Trip not found" }, { status: 404 });
  const publicSlug = existing.public_slug || `s_${randomBytes(18).toString("base64url")}`;
  const { data, error } = await supabase.from("saved_trips").update({ is_public: isPublic, public_slug: publicSlug, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id).select("id,is_public,public_slug").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ trip: data, sharePath: isPublic ? `/trip/${publicSlug}` : null });
}

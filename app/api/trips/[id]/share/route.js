import { randomBytes } from "node:crypto";
import { createClient } from "../../../../lib/supabase/server";

const NO_STORE = { "Cache-Control": "private, no-store" };
const SHARE_DAYS = 90;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// { public: true } shares the trip at an unguessable link that expires after 90
// days; { public: false } revokes it, and the old link stops working for good
// because a later share gets a new link.
export async function POST(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  if (!UUID.test(id || "")) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  const body = await request.json().catch(() => ({}));
  const isPublic = body.public !== false;
  const { data: existing } = await supabase.from("saved_trips").select("trip_data").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
  if (!existing) return Response.json({ error: "Trip not found" }, { status: 404, headers: NO_STORE });
  const expiresAt = new Date(Date.now() + SHARE_DAYS * 86400000).toISOString();
  const update = isPublic
    ? { is_public: true, public_slug: `s_${randomBytes(18).toString("base64url")}`, trip_data: { ...existing.trip_data, _share: { expiresAt, sharedAt: new Date().toISOString() } } }
    : { is_public: false, public_slug: null, trip_data: { ...existing.trip_data, _share: null } };
  const { data, error } = await supabase.from("saved_trips").update({ ...update, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id).select("id,is_public,public_slug").single();
  if (error) return Response.json({ error: "Could not update sharing" }, { status: 500, headers: NO_STORE });
  return Response.json({ trip: data, sharePath: isPublic ? `/trip/${data.public_slug}` : null, expiresAt: isPublic ? expiresAt : null }, { headers: NO_STORE });
}

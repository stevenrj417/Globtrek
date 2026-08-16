import { createAdminClient } from "../../../lib/supabase/admin";

export async function GET(_request, { params }) {
  const { slug } = await params;
  if (!/^s_[A-Za-z0-9_-]{20,40}$/.test(slug)) return Response.json({ error: "Trip not found" }, { status: 404 });
  try {
    const { data, error } = await createAdminClient().from("saved_trips").select("id,destination_name,destination_country,trip_data,updated_at").eq("public_slug", slug).eq("is_public", true).maybeSingle();
    if (error || !data) return Response.json({ error: "Trip not found" }, { status: 404 });
    return Response.json({ trip: data }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ error: "Public trips are unavailable" }, { status: 503 });
  }
}

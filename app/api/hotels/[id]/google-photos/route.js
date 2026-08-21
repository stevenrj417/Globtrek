import { NextResponse } from "next/server";
import { GooglePlacesHotelProvider } from "../../../../lib/google-places/GooglePlacesHotelProvider.js";
import { createClient } from "../../../../lib/supabase/server.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const windows = new Map();
function rateLimited(key, now = Date.now()) {
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + 60000 });
    return false;
  }
  current.count += 1;
  return current.count > 30;
}

function noStore(payload, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function GET(request, { params }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return noStore({ error: "Too many photo requests" }, 429);
  if (!process.env.GOOGLE_PLACES_API_KEY) return noStore({ error: "Hotel photography is not configured" }, 503);
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: hotel, error } = await supabase.from("hotel_catalog").select("id,google_place_id,google_place_verified").eq("id", id).eq("provider", "booking_com_cj").eq("active", true).maybeSingle();
    if (error) throw new Error(`hotel_lookup_failed:${error.code || "unknown"}`);
    if (!hotel?.google_place_verified || !hotel.google_place_id) return noStore({ error: "Verified property photography unavailable" }, 404);
    const manifest = await new GooglePlacesHotelProvider().getPhotoManifest(hotel.google_place_id, { limit: 5, maxWidthPx: 1800 });
    return noStore({ photos: manifest.photos, googleMapsUri: manifest.googleMapsUri, place: manifest.place });
  } catch (error) {
    const status = error?.code === "google_places_rate_limited" ? 429 : 502;
    return noStore({ error: status === 429 ? "Photography provider is busy" : "Hotel photography is temporarily unavailable" }, status);
  }
}

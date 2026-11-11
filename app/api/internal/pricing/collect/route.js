import { collectOriginFares } from "../../../../lib/pricing/collectFares.js";
import { travelpayoutsConfig } from "../../../../lib/travelpayouts/client.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Price collection for the observation store. Preview deployments only (behind
// Vercel deployment protection); production returns 404. It returns provider
// observations in GlobTrek's shape for scripts/pricing to save; it never
// returns credentials.
//
// GET ?kind=flights&origin=LAX&pages=2
//   Round-trip economy fares Aviasales users found from the origin, any
//   destination, for travel in the coming year. Each fare keeps the day it was
//   found (observedAt) apart from the day it departs (travelDate).
export async function GET(request) {
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });
  const params = new URL(request.url).searchParams;
  if (params.get("kind") !== "flights") return Response.json({ error: "unknown kind" }, { status: 400 });
  const origin = String(params.get("origin") || "").toUpperCase();
  const pages = Math.min(5, Math.max(1, Number(params.get("pages")) || 1));
  const { rows, errors } = await collectOriginFares({ token: travelpayoutsConfig().token, origin, pages });
  return Response.json({ kind: "flights", origin, collectedAt: new Date().toISOString(), count: rows.length, errors, rows }, { headers: { "Cache-Control": "no-store" } });
}

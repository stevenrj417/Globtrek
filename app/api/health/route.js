import { destinations } from "../../data/destinations";
import { destinationReadiness, MATCH_ALGORITHM_VERSION } from "../../lib/recommendation/eligibility";

export const dynamic = "force-dynamic";

// For uptime monitors: 200 when the app can load its catalog and match.
export async function GET() {
  const ready = destinations.filter((destination) => destinationReadiness(destination).eligible).length;
  const ok = ready > 0;
  return Response.json({ ok, destinationsReady: ready, algorithmVersion: MATCH_ALGORITHM_VERSION, time: new Date().toISOString() }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}

import { timingSafeEqual } from "node:crypto";
import { bookingStatistics, travelpayoutsConfig } from "../../../lib/travelpayouts/client.js";

export const dynamic = "force-dynamic";

// Private affiliate report (Travelpayouts clicks, bookings and earnings by
// program). Requires the CRON_SECRET bearer token; never cached or public.
//   GET /api/internal/affiliate-report?from=2026-11-01&to=2026-11-30

function authorized(request) {
  const secret = process.env.CRON_SECRET || "";
  const given = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  return Boolean(secret) && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export async function GET(request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  const params = new URL(request.url).searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = params.get("from") || `${today.slice(0, 8)}01`;
  const to = params.get("to") || today;
  const { token } = travelpayoutsConfig();
  try {
    const report = await bookingStatistics({ token, from, to });
    return Response.json({ from, to, currency: "USD", programs: report.rows, totalRows: report.totalRows, source: "Travelpayouts statistics API" }, { headers: NO_STORE });
  } catch (error) {
    return Response.json({ error: "Report unavailable", code: error?.code || "error" }, { status: 502, headers: NO_STORE });
  }
}

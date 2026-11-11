import { intuiTransferPage } from "../../data/intuiTransfers.js";
import { partnerUrls } from "../../lib/travelpayouts/partnerCache.js";

export const dynamic = "force-dynamic";

// Sends the traveler to Intui's airport-transfer page for a country, through a
// Travelpayouts partner link. Only pages from GlobTrek's own list are possible.
export async function GET(request) {
  const country = String(new URL(request.url).searchParams.get("country") || "").slice(0, 60);
  const page = intuiTransferPage(country);
  if (!page) return new Response("Not found", { status: 404 });
  const [link] = await partnerUrls([page], { subId: "transfer" });
  return new Response(null, { status: 302, headers: { Location: link.partnerUrl || page, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

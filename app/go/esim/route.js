import { esimCountry } from "../../lib/extras/esim.js";
import { partnerUrls } from "../../lib/travelpayouts/partnerCache.js";

export const dynamic = "force-dynamic";

// Sends the traveler to Airalo's eSIM page for a country, through a Travelpayouts
// partner link. Only countries in GlobTrek's Airalo feed are possible.
export async function GET(request) {
  const country = esimCountry(String(new URL(request.url).searchParams.get("country") || "").slice(0, 60));
  const page = country?.pageUrl || country?.plans?.[0]?.url;
  if (!page) return new Response("Not found", { status: 404 });
  const [link] = await partnerUrls([page], { subId: "esim" });
  return new Response(null, { status: 302, headers: { Location: link.partnerUrl || page, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

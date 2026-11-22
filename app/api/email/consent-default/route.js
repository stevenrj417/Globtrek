import { marketingBoxStartsTicked } from "../../../lib/email/marketingConsent";

// The country comes from Vercel's edge header: no lookup, nothing stored.
export async function GET(request) {
  return Response.json({ checked: marketingBoxStartsTicked(request.headers.get("x-vercel-ip-country")) }, { headers: { "Cache-Control": "private, no-store" } });
}

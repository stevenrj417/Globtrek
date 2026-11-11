import { rateLimit } from "../../lib/security/rateLimit";

// Browser crash reports, written to the server log as one structured line so
// they show up beside server errors in Vercel's logs.
export async function POST(request) {
  const limited = rateLimit(request, { name: "client-error", limit: 20 });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return new Response(null, { status: 400 });
  const clean = (value, max) => (typeof value === "string" ? value.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]").slice(0, max) : null);
  console.error(JSON.stringify({ level: "error", msg: "client_error", where: clean(body.where, 40), message: clean(body.message, 300), digest: clean(body.digest, 80), path: clean(body.path, 200)?.split("?")[0] || null }));
  return new Response(null, { status: 204 });
}

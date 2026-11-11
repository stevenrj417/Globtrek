import { openShareToken, sealShareToken } from "../../lib/results/shareToken";
import { rateLimit } from "../../lib/security/rateLimit";

const NO_STORE = { "Cache-Control": "no-store" };
const ID = /^[A-Za-z0-9_-]{2,80}$/;

// Keeps only the fields a shared trip needs; anything else in the request is dropped.
function cleanPayload(body) {
  if (!body || typeof body !== "object" || !body.quiz || typeof body.quiz !== "object" || Array.isArray(body.quiz)) return null;
  if (typeof body.destination !== "string" || !ID.test(body.destination)) return null;
  const quiz = { ...body.quiz };
  // Never carry contact details in a share link.
  for (const field of ["email", "name", "phone", "firstName", "lastName"]) delete quiz[field];
  return {
    quiz,
    destination: body.destination,
    stay: typeof body.stay === "string" && ID.test(body.stay) ? body.stay : null,
    snapshot: body.snapshot && typeof body.snapshot === "object" ? { resultId: String(body.snapshot.resultId || "").slice(0, 40), generatedAt: String(body.snapshot.generatedAt || "").slice(0, 40), estimate: body.snapshot.estimate || null, algorithmVersion: String(body.snapshot.algorithmVersion || "").slice(0, 40) } : null,
  };
}

export async function POST(request) {
  const limited = rateLimit(request, { name: "share", limit: 20 });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const payload = cleanPayload(body);
  if (!payload) return Response.json({ error: "Invalid trip" }, { status: 400, headers: NO_STORE });
  try {
    const { token, expiresAt } = sealShareToken(payload);
    return Response.json({ token, expiresAt, path: `/results?s=${token}` }, { headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : "share_failed";
    console.error(JSON.stringify({ level: "error", msg: "share_seal_failed", error: message }));
    return Response.json({ error: message === "share_payload_too_large" ? "This trip is too large to share as a link." : "Sharing is unavailable right now." }, { status: message === "share_payload_too_large" ? 413 : 503, headers: NO_STORE });
  }
}

export async function GET(request) {
  const limited = rateLimit(request, { name: "share-open", limit: 60 });
  if (limited) return limited;
  const token = new URL(request.url).searchParams.get("t");
  const result = openShareToken(token);
  if (result.error === "expired") return Response.json({ error: "This shared trip link has expired." }, { status: 410, headers: NO_STORE });
  if (result.error) return Response.json({ error: "This shared trip link isn't valid." }, { status: 404, headers: NO_STORE });
  return Response.json({ trip: result.payload, expiresAt: result.expiresAt }, { headers: NO_STORE });
}

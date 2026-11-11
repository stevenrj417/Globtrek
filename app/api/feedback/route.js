import { rateLimit } from "../../lib/security/rateLimit";
import { scrubMessage } from "../../lib/security/scrub";

const KINDS = new Set(["great_match", "not_for_me", "something_wrong"]);
const REASONS = new Set(["Too expensive", "Wrong kind of place", "Too far away", "Already been there", "Wrong time of year", "Something else"]);
const ID = /^[A-Za-z0-9_.-]{1,80}$/;

// Result feedback is written to the server log as one structured line, which
// Vercel retains with the project's logs. No IP address or account is stored.
export async function POST(request) {
  const limited = rateLimit(request, { name: "feedback", limit: 10 });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  if (!body || !KINDS.has(body.kind)) return Response.json({ error: "Invalid feedback" }, { status: 400 });
  const entry = {
    level: "info",
    msg: "result_feedback",
    kind: body.kind,
    resultId: ID.test(body.resultId || "") ? body.resultId : null,
    destinationId: ID.test(body.destinationId || "") ? body.destinationId : null,
    algorithmVersion: ID.test(body.algorithmVersion || "") ? body.algorithmVersion : null,
    reasons: Array.isArray(body.reasons) ? body.reasons.filter((reason) => REASONS.has(reason)).slice(0, 6) : [],
    message: body.kind === "something_wrong" ? scrubMessage(body.message) : null,
    at: new Date().toISOString(),
  };
  if (body.kind === "something_wrong" && !entry.message) return Response.json({ error: "Describe what looks wrong" }, { status: 400 });
  console.log(JSON.stringify(entry));
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

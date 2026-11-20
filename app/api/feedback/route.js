import { sharedRateLimit } from "../../lib/security/rateLimit";
import { scrubMessage } from "../../lib/security/scrub";

const KINDS = new Set(["great_match", "not_for_me", "something_wrong", "site"]);
const REASONS = new Set(["Too expensive", "Wrong kind of place", "Too far away", "Already been there", "Wrong time of year", "Something else"]);
const TOPICS = new Set(["Something broke", "A wrong price or place", "An idea", "Something else"]);
const ID = /^[A-Za-z0-9_.-]{1,80}$/;
const PAGE = /^\/[A-Za-z0-9/_.-]{0,120}$/;
const NEEDS_MESSAGE = new Set(["something_wrong", "site"]);

// Saves feedback to Supabase (table site_feedback, migration
// 202611200001_site_feedback.sql) and also writes one structured log line.
// No IP address, account or contact details are stored.
async function store(entry) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const { createAdminClient } = await import("../../lib/supabase/admin.js");
    const { error } = await createAdminClient().from("site_feedback").insert({
      kind: entry.kind, topic: entry.topic, page: entry.page, result_id: entry.resultId, destination_id: entry.destinationId,
      algorithm_version: entry.algorithmVersion, reasons: entry.reasons, message: entry.message,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function POST(request) {
  const limited = await sharedRateLimit(request, { name: "feedback", limit: 10 });
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  if (!body || !KINDS.has(body.kind)) return Response.json({ error: "Invalid feedback" }, { status: 400 });
  const entry = {
    level: "info",
    msg: "result_feedback",
    kind: body.kind,
    topic: body.kind === "site" && TOPICS.has(body.topic) ? body.topic : null,
    page: PAGE.test(body.page || "") ? body.page : null,
    resultId: ID.test(body.resultId || "") ? body.resultId : null,
    destinationId: ID.test(body.destinationId || "") ? body.destinationId : null,
    algorithmVersion: ID.test(body.algorithmVersion || "") ? body.algorithmVersion : null,
    reasons: Array.isArray(body.reasons) ? body.reasons.filter((reason) => REASONS.has(reason)).slice(0, 6) : [],
    message: NEEDS_MESSAGE.has(body.kind) ? scrubMessage(body.message) : null,
    at: new Date().toISOString(),
  };
  if (NEEDS_MESSAGE.has(body.kind) && !entry.message) return Response.json({ error: "Describe what looks wrong" }, { status: 400 });
  entry.stored = await store(entry);
  console.log(JSON.stringify(entry));
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

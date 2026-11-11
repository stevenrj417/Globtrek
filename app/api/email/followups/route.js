import { createAdminClient } from "../../../lib/supabase/admin";
import { followupDueAt, readFollowupToken } from "../../../lib/email/followups";

// Confirm or stop the check-in emails for one trip, from the link in an email.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const id = readFollowupToken(body.token);
  if (!id || !["confirm", "stop"].includes(body.action)) return Response.json({ error: "This link isn't valid." }, { status: 400 });
  try {
    const supabase = createAdminClient();
    const { data: row, error } = await supabase.from("trip_followups").select("id,status,destination_name").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return Response.json({ error: "This link isn't valid." }, { status: 404 });
    const now = new Date();
    if (body.action === "stop") {
      if (row.status !== "done") await supabase.from("trip_followups").update({ status: "stopped", updated_at: now.toISOString() }).eq("id", id);
      return Response.json({ status: "stopped", destination: row.destination_name });
    }
    // Confirming starts the month from today, so the first check-in is tomorrow.
    if (row.status === "pending") await supabase.from("trip_followups").update({ status: "active", step: 0, created_at: now.toISOString(), next_send_at: followupDueAt(now, 1), updated_at: now.toISOString() }).eq("id", id);
    return Response.json({ status: row.status === "pending" ? "active" : row.status, destination: row.destination_name });
  } catch {
    return Response.json({ error: "We couldn't update this right now." }, { status: 503 });
  }
}

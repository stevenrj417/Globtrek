import { createAdminClient } from "../../../lib/supabase/admin";
import { sendEmail } from "../../../lib/email/resend";
import { FOLLOWUP_DAYS, followupEmail, mailingAddress } from "../../../lib/email/templates";
import { followupDueAt, followupToken } from "../../../lib/email/followups";
import { publicSiteUrl } from "../../../lib/email/subscriptions";

// Daily: sends each active trip its next check-in once it's due, then
// schedules the one after. Six check-ins, then the sequence is done.
export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // Check-ins point at booking links, so they carry a postal address like any
  // commercial email. Hold them until one is configured.
  if (!mailingAddress()) return Response.json({ sent: 0, skipped: "MAILING_ADDRESS is not set" });
  try {
    const supabase = createAdminClient();
    const now = new Date();
    const { data: due, error } = await supabase.from("trip_followups").select("id,email,model,view_url,step,created_at").eq("status", "active").lte("next_send_at", now.toISOString()).order("next_send_at").limit(300);
    if (error) throw new Error(error.message);
    const emails = [...new Set((due || []).map((row) => row.email))];
    const { data: unsubscribed } = emails.length ? await supabase.from("email_subscribers").select("email").in("email", emails).in("status", ["unsubscribed", "bounced", "complained"]) : { data: [] };
    const blocked = new Set((unsubscribed || []).map((row) => row.email));
    let sent = 0;
    for (const row of due || []) {
      const stamp = new Date().toISOString();
      if (blocked.has(row.email)) {
        await supabase.from("trip_followups").update({ status: "stopped", updated_at: stamp }).eq("id", row.id);
        continue;
      }
      const step = row.step + 1;
      const message = followupEmail({ model: row.model, step, viewUrl: row.view_url, stopUrl: `${publicSiteUrl()}/trip-reminders?stop=${encodeURIComponent(followupToken(row.id))}` });
      if (message) {
        try {
          const key = `followup-${row.id}-${step}`;
          const provider = await sendEmail({ from: "GlobTrek Trips <trips@glob-trek.com>", to: [row.email], subject: message.subject, html: message.html }, { idempotencyKey: key });
          await supabase.from("email_sends").upsert({ recipient_email: row.email, email_type: "followup", provider_message_id: provider?.id || null, idempotency_key: key }, { onConflict: "idempotency_key" });
          sent += 1;
        } catch (error) {
          console.error(JSON.stringify({ level: "error", msg: "trip_followup_failed", step, error: error instanceof Error ? error.message : "unknown" }));
          continue;
        }
      }
      const done = step >= FOLLOWUP_DAYS.length;
      const next = done ? null : followupDueAt(row.created_at, step + 1);
      // A late run never sends two check-ins back to back.
      const nextSendAt = next && new Date(next) > new Date(Date.now() + 86400000) ? next : new Date(Date.now() + 86400000).toISOString();
      await supabase.from("trip_followups").update({ step, status: done ? "done" : "active", next_send_at: done ? stamp : nextSendAt, updated_at: stamp }).eq("id", row.id);
    }
    return Response.json({ due: due?.length || 0, sent });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "trip_followups_cron_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Follow-up send failed." }, { status: 500 });
  }
}

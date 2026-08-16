import { createAdminClient } from "../../../lib/supabase/admin";
import { sendBatchEmails } from "../../../lib/email/resend";
import { monthlyEmail } from "../../../lib/email/templates";
import { createUnsubscribeToken, hashUnsubscribeToken, publicSiteUrl } from "../../../lib/email/subscriptions";

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const supabase = createAdminClient();
    const { data: subscribers, error } = await supabase.from("email_subscribers").select("id,email").eq("status", "subscribed").eq("marketing_consent", true).limit(5000);
    if (error) throw new Error(error.message);
    const siteUrl = publicSiteUrl();
    const messages = [];
    for (const subscriber of subscribers || []) {
      const token = createUnsubscribeToken();
      await supabase.from("email_subscribers").update({ unsubscribe_token_hash: hashUnsubscribeToken(token), updated_at: new Date().toISOString() }).eq("id", subscriber.id);
      messages.push({ from: "Globtrek <hello@glob-trek.com>", to: [subscriber.email], subject: "The Globtrek monthly edit", html: monthlyEmail({ siteUrl, unsubscribeUrl: `${siteUrl}/unsubscribe?token=${encodeURIComponent(token)}` }) });
    }
    if (messages.length) await sendBatchEmails(messages);
    return Response.json({ sent: messages.length });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "monthly_email_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Monthly send failed." }, { status: 500 });
  }
}

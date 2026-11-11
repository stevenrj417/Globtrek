import { trendingTrips } from "../../../data/trending";
import { createAdminClient } from "../../../lib/supabase/admin";
import { sendBatchEmails } from "../../../lib/email/resend";
import { mailingAddress, monthlyEmail } from "../../../lib/email/templates";
import { createUnsubscribeToken, hashUnsubscribeToken, publicSiteUrl } from "../../../lib/email/subscriptions";

export async function GET(request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // Marketing email has to carry a postal address; hold the send until one is set.
  if (!mailingAddress()) return Response.json({ sent: 0, skipped: "MAILING_ADDRESS is not set" });
  try {
    const supabase = createAdminClient();
    const { data: subscribers, error } = await supabase.from("email_subscribers").select("id,email").eq("status", "subscribed").eq("marketing_consent", true).limit(5000);
    if (error) throw new Error(error.message);
    const siteUrl = publicSiteUrl();
    const messages = [];
    for (const subscriber of subscribers || []) {
      const token = createUnsubscribeToken();
      await supabase.from("email_subscribers").update({ unsubscribe_token_hash: hashUnsubscribeToken(token), updated_at: new Date().toISOString() }).eq("id", subscriber.id);
      messages.push({ from: "GlobTrek <hello@glob-trek.com>", to: [subscriber.email], subject: `Places worth going in ${new Date().toLocaleString("en-US", { month: "long", timeZone: "UTC" })}`, html: monthlyEmail({ trips: trendingTrips, unsubscribeUrl: `${siteUrl}/unsubscribe?token=${encodeURIComponent(token)}` }) });
    }
    if (messages.length) await sendBatchEmails(messages);
    return Response.json({ sent: messages.length });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "monthly_email_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Monthly send failed." }, { status: 500 });
  }
}

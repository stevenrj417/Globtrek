import { createAdminClient } from "../../../lib/supabase/admin";
import { sendEmail } from "../../../lib/email/resend";
import { welcomeEmail } from "../../../lib/email/templates";
import { createUnsubscribeToken, hashUnsubscribeToken, normalizeEmail, publicSiteUrl } from "../../../lib/email/subscriptions";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  if (!email || body.marketingConsent !== true) return Response.json({ error: "Explicit consent and a valid email are required." }, { status: 400 });
  try {
    const supabase = createAdminClient();
    const token = createUnsubscribeToken();
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("email_subscribers").upsert({ email, marketing_consent: true, status: "subscribed", unsubscribe_token_hash: hashUnsubscribeToken(token), subscribed_at: now, unsubscribed_at: null, updated_at: now }, { onConflict: "email" }).select("id").single();
    if (error) throw new Error(error.message);
    const siteUrl = publicSiteUrl();
    const provider = await sendEmail({ from: "Globtrek <hello@glob-trek.com>", to: [email], subject: "Welcome to Globtrek", html: welcomeEmail({ siteUrl, unsubscribeUrl: `${siteUrl}/unsubscribe?token=${encodeURIComponent(token)}` }) }, { idempotencyKey: `welcome-${data.id}-${now.slice(0, 10)}` });
    await Promise.all([
      supabase.from("email_subscribers").update({ last_welcome_sent_at: now }).eq("id", data.id),
      supabase.from("email_sends").upsert({ recipient_email: email, email_type: "welcome", provider_message_id: provider.id || null, idempotency_key: `welcome-${data.id}-${now.slice(0, 10)}` }, { onConflict: "idempotency_key" }),
    ]);
    return Response.json({ subscribed: true });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", msg: "marketing_subscribe_failed", error: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Email signup is temporarily unavailable." }, { status: 503 });
  }
}

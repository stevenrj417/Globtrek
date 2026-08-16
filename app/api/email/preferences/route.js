import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createUnsubscribeToken, hashUnsubscribeToken, normalizeEmail } from "../../../lib/email/subscriptions";

async function accountEmail() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  return normalizeEmail(data.user?.email);
}

export async function GET() {
  const email = await accountEmail();
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data } = await createAdminClient().from("email_subscribers").select("marketing_consent,status").eq("email", email).maybeSingle();
    return Response.json({ marketingConsent: Boolean(data?.marketing_consent && data?.status === "subscribed") });
  } catch { return Response.json({ marketingConsent: false, unavailable: true }); }
}

export async function PATCH(request) {
  const email = await accountEmail();
  if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.marketingConsent !== "boolean") return Response.json({ error: "Invalid preference" }, { status: 400 });
  try {
    const now = new Date().toISOString();
    const consent = body.marketingConsent;
    const record = consent
      ? { email, marketing_consent: true, status: "subscribed", subscribed_at: now, unsubscribed_at: null, unsubscribe_token_hash: hashUnsubscribeToken(createUnsubscribeToken()), updated_at: now }
      : { email, marketing_consent: false, status: "unsubscribed", unsubscribed_at: now, updated_at: now };
    const { error } = await createAdminClient().from("email_subscribers").upsert(record, { onConflict: "email" });
    if (error) throw new Error(error.message);
    return Response.json({ marketingConsent: consent });
  } catch { return Response.json({ error: "Email preferences are temporarily unavailable." }, { status: 503 }); }
}

import { createAdminClient } from "../../../lib/supabase/admin";
import { hashUnsubscribeToken } from "../../../lib/email/subscriptions";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.token !== "string" || body.token.length < 20 || body.token.length > 200) return Response.json({ error: "Invalid unsubscribe link." }, { status: 400 });
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("email_subscribers").update({ marketing_consent: false, status: "unsubscribed", unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("unsubscribe_token_hash", hashUnsubscribeToken(body.token)).select("id");
    if (error) throw new Error(error.message);
    return Response.json({ unsubscribed: true, found: Boolean(data?.length) });
  } catch {
    return Response.json({ error: "Unsubscribe is temporarily unavailable." }, { status: 503 });
  }
}

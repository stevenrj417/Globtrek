// Whether the "send me deals and trip ideas" box starts ticked. It starts
// ticked for most visitors. In the EU/EEA, UK, Switzerland and Canada the law
// counts only a box the person ticks themselves as consent, so there it starts
// empty.
const TICK_IT_THEMSELVES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", "GB", "CH", "CA",
]);

export function marketingBoxStartsTicked(country) {
  return !TICK_IT_THEMSELVES.has(String(country || "").toUpperCase());
}

// Adds the address to the monthly email list. An address that bounced or
// marked GlobTrek as spam is never re-added. Returns an unsubscribe link when
// a new one was made, so the trip email can carry it.
export async function subscribeFromTripEmail(supabase, { email, siteUrl, createToken, hashToken, now = new Date() }) {
  const { data: existing } = await supabase.from("email_subscribers").select("id,status").eq("email", email).maybeSingle();
  if (existing && ["bounced", "complained"].includes(existing.status)) return { subscribed: false };
  if (existing?.status === "subscribed") return { subscribed: true, unsubscribeUrl: null };
  const token = createToken();
  const stamp = now.toISOString();
  const { error } = await supabase.from("email_subscribers").upsert({ email, marketing_consent: true, status: "subscribed", unsubscribe_token_hash: hashToken(token), subscribed_at: stamp, unsubscribed_at: null, updated_at: stamp }, { onConflict: "email" });
  if (error) throw new Error(error.message);
  return { subscribed: true, unsubscribeUrl: `${siteUrl}/unsubscribe?token=${encodeURIComponent(token)}` };
}

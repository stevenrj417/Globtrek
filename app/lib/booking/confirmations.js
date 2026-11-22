import { cjSid } from "./cj.js";

// Bookings GlobTrek can actually confirm. Every CJ link on a trip carries the
// trip's random reference as the SID; when Booking.com reports a sale through CJ,
// the commission record comes back with that SID as `shopperId`. Only then does
// GlobTrek call a booking "confirmed". A traveler ticking "I've booked this" is
// shown as booked by them, never as confirmed.
//
// CJ reports sales with a delay (usually hours), only for links that went through
// CJ, and only for the last 31 days per query. Nothing personal is sent or kept.
const ENDPOINT = "https://commissions.api.cj.com/query";
const DAY = 86400000;

export function kindOf(record) {
  const text = `${record.advertiserName || ""} ${record.actionTrackerName || ""}`.toLowerCase();
  if (/flight/.test(text)) return "flight";
  if (/attraction|experience|activit|tour/.test(text)) return "activity";
  if (/taxi|transfer/.test(text)) return "taxi";
  if (/car/.test(text)) return "car";
  return "stay";
}

// Records → { flight: true, stay: true, ... } for kinds whose net commission is
// above zero (a cancelled booking is reversed by a correction record).
export function confirmedKinds(records, ref) {
  const totals = {};
  for (const record of records || []) {
    if (record.shopperId !== ref) continue;
    const kind = kindOf(record);
    totals[kind] = (totals[kind] || 0) + (Number(record.pubCommissionAmountUsd) || 0);
  }
  return Object.fromEntries(Object.entries(totals).filter(([, amount]) => amount > 0).map(([kind]) => [kind, true]));
}

export async function tripConfirmations(ref, { env = process.env, fetchImpl = fetch, now = Date.now(), days = 31 } = {}) {
  const sid = cjSid(ref);
  if (!sid || !env.CJ_API_TOKEN || !env.CJ_COMPANY_ID) return { available: false, confirmed: {} };
  const since = new Date(now - Math.min(31, days) * DAY).toISOString().slice(0, 19) + "Z";
  const before = new Date(now + 60000).toISOString().slice(0, 19) + "Z";
  const query = `{ publisherCommissions(forPublishers: ["${String(env.CJ_COMPANY_ID).replace(/\D/g, "")}"], sincePostingDate: "${since}", beforePostingDate: "${before}") { records { shopperId advertiserName actionTrackerName pubCommissionAmountUsd } } }`;
  const response = await fetchImpl(ENDPOINT, { method: "POST", headers: { Authorization: `Bearer ${env.CJ_API_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`cj_commissions_${response.status}`);
  const json = await response.json();
  if (json.errors?.length) throw new Error("cj_commissions_error");
  return { available: true, confirmed: confirmedKinds(json.data?.publisherCommissions?.records, sid) };
}

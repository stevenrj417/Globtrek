import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// Opaque, expiring share links for trips that aren't saved to an account.
//
// The trip (quiz answers, destination, chosen stay, frozen estimate) is sealed
// with AES-256-GCM, so the link reveals nothing to someone reading it and can't
// be edited, and it carries its own expiry. Server-only.

export const SHARE_TTL_DAYS = 90;
const VERSION = "v1";
const MAX_PAYLOAD = 8000;

function key() {
  const secret = process.env.SHARE_TOKEN_SECRET || process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    || (process.env.NODE_ENV === "production" ? null : "globtrek-local-development-share-key");
  if (!secret) throw new Error("share_key_not_configured");
  return Buffer.from(hkdfSync("sha256", secret, "globtrek-share", "share-token-v1", 32));
}

export function sealShareToken(payload, { now = Date.now(), ttlDays = SHARE_TTL_DAYS } = {}) {
  const body = JSON.stringify({ p: payload, exp: now + ttlDays * 86400000 });
  if (body.length > MAX_PAYLOAD) throw new Error("share_payload_too_large");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const sealed = Buffer.concat([cipher.update(body, "utf8"), cipher.final()]);
  const token = `${VERSION}.${Buffer.concat([iv, sealed, cipher.getAuthTag()]).toString("base64url")}`;
  return { token, expiresAt: new Date(now + ttlDays * 86400000).toISOString() };
}

// { payload, expiresAt } for a good token, { error: "expired" | "invalid" } otherwise.
export function openShareToken(token, { now = Date.now() } = {}) {
  if (typeof token !== "string" || !token.startsWith(`${VERSION}.`) || token.length > 16000) return { error: "invalid" };
  try {
    const raw = Buffer.from(token.slice(VERSION.length + 1), "base64url");
    if (raw.length < 29) return { error: "invalid" };
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(raw.length - 16));
    const body = JSON.parse(Buffer.concat([decipher.update(raw.subarray(12, raw.length - 16)), decipher.final()]).toString("utf8"));
    if (!Number.isFinite(body.exp) || body.exp <= now) return { error: "expired" };
    return { payload: body.p, expiresAt: new Date(body.exp).toISOString() };
  } catch {
    return { error: "invalid" };
  }
}

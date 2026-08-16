import crypto from "node:crypto";

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}

export function createUnsubscribeToken() { return crypto.randomBytes(32).toString("base64url"); }
export function hashUnsubscribeToken(token) { return crypto.createHash("sha256").update(String(token || "")).digest("hex"); }
export function publicSiteUrl() { return String(process.env.NEXT_PUBLIC_SITE_URL || "https://glob-trek.com").replace(/\/$/, ""); }

// Per-IP request limits for public API routes.
//
// Counts live in this server instance's memory, so the limit is per instance:
// it stops a single client hammering an endpoint, not a distributed attack
// (Vercel's platform firewall covers that layer).

const buckets = new Map();
const MAX_KEYS = 5000;

export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown").trim().slice(0, 64);
}

// Returns a 429 Response when the caller is over `limit` requests in `windowMs`, else null.
export function rateLimit(request, { name, limit, windowMs = 60000, now = Date.now() }) {
  const key = `${name}:${clientIp(request)}`;
  const hits = (buckets.get(key) || []).filter((time) => now - time < windowMs);
  if (hits.length >= limit) {
    const retry = Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000));
    console.log(JSON.stringify({ level: "warn", msg: "rate_limited", route: name }));
    return Response.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers: { "Retry-After": String(retry), "Cache-Control": "no-store" } });
  }
  hits.push(now);
  buckets.delete(key);
  buckets.set(key, hits);
  if (buckets.size > MAX_KEYS) buckets.delete(buckets.keys().next().value);
  return null;
}

export function resetRateLimits() {
  buckets.clear();
}

// Shared limit across every server instance, counted in Supabase (fixed
// windows, keyed by a salted hash of the IP so no address is stored). When the
// shared store isn't available, falls back to this instance's in-memory limit.
// Needs migration 202611110001_shared_rate_limits.sql.
let sharedDownUntil = 0;
let adminClient = null;

async function sharedHits(key, windowSeconds) {
  if (!adminClient) {
    const { createAdminClient } = await import("../supabase/admin.js");
    adminClient = createAdminClient();
  }
  const { data, error } = await adminClient.rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds });
  if (error || !Number.isFinite(Number(data))) throw new Error("shared_rate_limit_unavailable");
  return Number(data);
}

export async function sharedRateLimit(request, { name, limit, windowMs = 60000, now = Date.now() }) {
  if (now < sharedDownUntil || !process.env.SUPABASE_SERVICE_ROLE_KEY) return rateLimit(request, { name, limit, windowMs, now });
  const { createHash } = await import("node:crypto");
  const salt = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = `${name}:${createHash("sha256").update(`${salt}:${clientIp(request)}`).digest("hex").slice(0, 32)}`;
  const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
  try {
    const hits = await Promise.race([sharedHits(key, windowSeconds), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 800))]);
    if (hits > limit) {
      const retry = Math.max(1, windowSeconds - (Math.floor(now / 1000) % windowSeconds));
      console.log(JSON.stringify({ level: "warn", msg: "rate_limited", route: name, shared: true }));
      return Response.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers: { "Retry-After": String(retry), "Cache-Control": "no-store" } });
    }
    return null;
  } catch {
    sharedDownUntil = now + 5 * 60000;
    return rateLimit(request, { name, limit, windowMs, now });
  }
}

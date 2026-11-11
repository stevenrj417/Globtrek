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

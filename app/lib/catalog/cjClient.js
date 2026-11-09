// Server-only client for CJ's GraphQL product API (https://ads.api.cj.com/query).
// Credentials come from CJ_API_TOKEN, CJ_COMPANY_ID and CJ_PID and never leave
// the server: they are not NEXT_PUBLIC_, never logged, and stripped from errors.
//
// Requests run one at a time with a minimum gap between them, a timeout, and
// retries with backoff for timeouts, network errors, 429 and 5xx responses. CJ
// does not publish a single per-minute figure for this API that we could verify,
// so the pacing is deliberately conservative (one request per second by default).

const ENDPOINT = "https://ads.api.cj.com/query";

export class CjApiError extends Error {
  constructor(message, { status = null, retryable = false } = {}) {
    super(message);
    this.name = "CjApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

export function cjCredentials(env = process.env) {
  const token = env.CJ_API_TOKEN || null;
  const companyId = env.CJ_COMPANY_ID || null;
  const pid = env.CJ_PID || null;
  return { token, companyId, pid, configured: Boolean(token && companyId && pid) };
}

// Removes anything that looks like the token from text before it is logged or thrown.
export function redact(text, token) {
  let value = String(text ?? "");
  if (token) value = value.split(token).join("[redacted]");
  return value.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createCjClient({ env = process.env, fetchImpl = globalThis.fetch, minIntervalMs = 1000, timeoutMs = 60000, maxAttempts = 4, backoffMs = 2000, wait = sleep } = {}) {
  const credentials = cjCredentials(env);
  let lastRequestAt = 0;
  let requests = 0;

  async function query(text) {
    if (!credentials.configured) throw new CjApiError("cj_not_configured");
    for (let attempt = 1; ; attempt += 1) {
      const gap = lastRequestAt + minIntervalMs - Date.now();
      if (gap > 0) await wait(gap);
      lastRequestAt = Date.now();
      requests += 1;
      let status = null;
      try {
        const response = await fetchImpl(ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${credentials.token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: text }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        status = response.status;
        const body = await response.text();
        if (status === 429 || status >= 500) throw new CjApiError(`cj_http_${status}`, { status, retryable: true });
        let payload = null;
        try { payload = JSON.parse(body); } catch { throw new CjApiError(`cj_bad_json_${status}`, { status, retryable: status >= 500 }); }
        if (!response.ok || payload?.errors?.length) {
          const detail = payload?.errors?.map((error) => error.message).join("; ") || body;
          throw new CjApiError(`cj_http_${status}: ${redact(detail, credentials.token).slice(0, 300)}`, { status });
        }
        return payload.data;
      } catch (error) {
        const retryable = error instanceof CjApiError ? error.retryable : true; // timeouts and network errors
        if (!retryable || attempt >= maxAttempts) {
          throw error instanceof CjApiError ? error : new CjApiError(`cj_request_failed: ${redact(error?.name || error?.message, credentials.token)}`, { status, retryable: true });
        }
        await wait(backoffMs * 2 ** (attempt - 1));
      }
    }
  }

  return { query, credentials: { companyId: credentials.companyId, pid: credentials.pid, configured: credentials.configured }, stats: () => ({ requests }) };
}

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRIES = 2;

export class OpenTableError extends Error {
  constructor(message, { status = 500, code = "opentable_error", retryAfter = null } = {}) {
    super(message);
    this.name = "OpenTableError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function requireUrl(value, name) {
  if (!value) throw new OpenTableError(`${name} is not configured`, { code: "opentable_not_configured", status: 503 });
  try { return new URL(value).toString().replace(/\/$/, ""); }
  catch { throw new OpenTableError(`${name} must be an HTTPS URL`, { code: "opentable_invalid_configuration", status: 500 }); }
}

function appendReferral(url, referralId) {
  if (!url || !referralId) return url || null;
  const target = new URL(url);
  if (target.hostname === "opentable.com" || target.hostname.endsWith(".opentable.com")) target.searchParams.set("ref", referralId);
  return target.toString();
}

export function createReservationLink(url, referralId = process.env.OPENTABLE_REFERRAL_ID) {
  try { return appendReferral(url, referralId); }
  catch { return null; }
}

export class OpenTableClient {
  constructor({
    apiBaseUrl = process.env.OPENTABLE_API_BASE_URL,
    oauthBaseUrl = process.env.OPENTABLE_OAUTH_BASE_URL,
    clientId = process.env.OPENTABLE_CLIENT_ID,
    clientSecret = process.env.OPENTABLE_CLIENT_SECRET,
    referralId = process.env.OPENTABLE_REFERRAL_ID,
    fetchImpl = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = {}) {
    this.apiBaseUrl = apiBaseUrl;
    this.oauthBaseUrl = oauthBaseUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.referralId = referralId;
    this.fetch = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.token = null;
  }

  isConfigured() { return Boolean(this.apiBaseUrl && this.oauthBaseUrl && this.clientId && this.clientSecret); }

  async accessToken() {
    if (this.token?.expiresAt > Date.now() + 30_000) return this.token.value;
    const base = requireUrl(this.oauthBaseUrl, "OPENTABLE_OAUTH_BASE_URL");
    if (!this.clientId || !this.clientSecret) throw new OpenTableError("OpenTable client credentials are not configured", { code: "opentable_not_configured", status: 503 });
    const authorization = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const response = await this.request(`${base}/api/v2/oauth/token?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/json" },
    }, false);
    const value = response?.access_token;
    if (!value) throw new OpenTableError("OpenTable token response did not contain an access token", { code: "opentable_invalid_response", status: 502 });
    this.token = { value, expiresAt: Date.now() + Math.max(60, Number(response.expires_in) || 300) * 1000 };
    return value;
  }

  async request(url, options = {}, authorize = true) {
    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const headers = { Accept: "application/json", ...options.headers };
        if (authorize) headers.Authorization = `Bearer ${await this.accessToken()}`;
        const response = await this.fetch(url, { ...options, headers, signal: controller.signal, cache: "no-store" });
        if (response.ok) return response.status === 204 ? null : response.json();
        const retryAfter = response.headers.get("retry-after");
        const retryable = response.status === 429 || response.status >= 500;
        lastError = new OpenTableError(`OpenTable request failed with status ${response.status}`, { status: response.status, code: response.status === 429 ? "opentable_rate_limited" : "opentable_request_failed", retryAfter });
        if (!retryable || attempt === this.retries) throw lastError;
        await new Promise((resolve) => setTimeout(resolve, Math.min(1_000, 150 * (2 ** attempt))));
      } catch (error) {
        lastError = error?.name === "AbortError" ? new OpenTableError("OpenTable request timed out", { status: 504, code: "opentable_timeout" }) : error;
        if (attempt === this.retries || lastError instanceof OpenTableError && lastError.status < 500 && lastError.status !== 429) throw lastError;
      } finally { clearTimeout(timer); }
    }
    throw lastError;
  }

  async getAvailability({ restaurantId, startDateTime, partySize, forwardMinutes = 120, backwardMinutes = 60, includeExperiences = false }) {
    if (!/^\d+$/.test(String(restaurantId))) throw new OpenTableError("A numeric OpenTable restaurant ID is required", { status: 400, code: "invalid_restaurant_id" });
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:(00|15|30|45)$/.test(String(startDateTime))) throw new OpenTableError("startDateTime must be local ISO time on a 15-minute boundary", { status: 400, code: "invalid_start_date_time" });
    const size = Number(partySize);
    if (!Number.isInteger(size) || size < 1 || size > 20) throw new OpenTableError("partySize must be between 1 and 20", { status: 400, code: "invalid_party_size" });
    const base = requireUrl(this.apiBaseUrl, "OPENTABLE_API_BASE_URL");
    const query = new URLSearchParams({ start_date_time: startDateTime, party_size: String(size), forward_minutes: String(Math.min(720, Math.max(0, forwardMinutes))), backward_minutes: String(Math.min(720, Math.max(0, backwardMinutes))), include_experiences: String(Boolean(includeExperiences)) });
    const payload = await this.request(`${base}/v2/availability/${restaurantId}?${query}`);
    return { ...payload, bookingUrl: createReservationLink(findBookingUrl(payload), this.referralId) };
  }

  async getAvailabilityMetadata({ restaurantId }) {
    if (!/^\d+$/.test(String(restaurantId))) throw new OpenTableError("A numeric OpenTable restaurant ID is required", { status: 400, code: "invalid_restaurant_id" });
    const base = requireUrl(this.apiBaseUrl, "OPENTABLE_API_BASE_URL");
    return this.request(`${base}/v2/availability-metadata/${restaurantId}`);
  }
}

function findBookingUrl(payload) {
  const stack = [payload];
  while (stack.length) {
    const value = stack.shift();
    if (!value || typeof value !== "object") continue;
    if (typeof value.booking_url === "string") return value.booking_url;
    stack.push(...(Array.isArray(value) ? value : Object.values(value)));
  }
  return null;
}

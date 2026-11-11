import { travelpayoutsConfig, travelpayoutsRequest } from "./client.js";

// Partner links through the Travelpayouts links API.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/25289759198226
//
// Only links GlobTrek itself builds to these brands are converted: the host must
// be on the allow list and the URL plain https with no credentials, so the API
// can't be used to wrap arbitrary URLs. Booking.com links keep using CJ.

export const PARTNER_HOSTS = Object.freeze({
  aviasales: ["aviasales.com", "www.aviasales.com"],
  wegotrip: ["wegotrip.com", "www.wegotrip.com"],
  airalo: ["airalo.com", "www.airalo.com"],
  intui: ["intui.travel", "www.intui.travel", "en.intui.travel"],
});

const ALLOWED = new Map(Object.entries(PARTNER_HOSTS).flatMap(([brand, hosts]) => hosts.map((host) => [host, brand])));
const MAX_LINKS = 10;

// The brand for a URL GlobTrek may convert, or null.
export function partnerBrand(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  return ALLOWED.get(url.hostname.toLowerCase()) || null;
}

// A short sub_id for reporting: letters, digits, dash and underscore only, so
// nothing personal can ride along.
export function safeSubId(value) {
  const clean = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  return clean || undefined;
}

// Converts up to 10 allowed URLs. Returns one result per input, in order:
// { url, brand, partnerUrl | null, error | null }. Never throws for a single bad
// link; throws TravelpayoutsError when the request itself fails.
export async function createPartnerLinks(urls, { subId, shorten = false, env = process.env, fetchImpl } = {}) {
  const { token, marker, projectId } = travelpayoutsConfig(env);
  const items = urls.slice(0, MAX_LINKS).map((url) => ({ url, brand: partnerBrand(url) }));
  const allowed = items.filter((item) => item.brand);
  const results = new Map();
  if (allowed.length && token && /^\d+$/.test(marker) && /^\d+$/.test(projectId)) {
    const json = await travelpayoutsRequest("/links/v1/create", {
      token,
      fetchImpl,
      body: { trs: Number(projectId), marker: Number(marker), shorten, links: allowed.map((item) => ({ url: item.url, sub_id: safeSubId(subId) })) },
    });
    for (const link of json?.result?.links || []) results.set(link.url, link);
  }
  return items.map(({ url, brand }) => {
    if (!brand) return { url, brand: null, partnerUrl: null, error: "not_allowed" };
    const link = results.get(url);
    if (!link) return { url, brand, partnerUrl: null, error: token ? "not_converted" : "not_configured" };
    if (link.code !== "success" || !link.partner_url) return { url, brand, partnerUrl: null, error: link.message || "failed" };
    return { url, brand, partnerUrl: link.partner_url, error: null };
  });
}

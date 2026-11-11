import { createPartnerLinks } from "./links.js";

// Partner links are stable for a given URL, so each converted link is cached in
// this instance for a day. Unconverted links fall back to the plain brand URL
// (no attribution, but the traveler still gets where they asked to go).

const cache = new Map();
const TTL = 86400000;
const MAX = 2000;

export async function partnerUrls(urls, { subId, now = Date.now(), ...options } = {}) {
  const key = (url) => `${subId || ""}|${url}`;
  const missing = [...new Set(urls)].filter((url) => !(cache.get(key(url))?.expires > now));
  for (let index = 0; index < missing.length; index += 10) {
    try {
      const results = await createPartnerLinks(missing.slice(index, index + 10), { subId, ...options });
      for (const result of results) if (result.partnerUrl) cache.set(key(result.url), { value: result.partnerUrl, expires: now + TTL });
    } catch {
      // Provider unavailable: fall back to plain links below.
    }
  }
  while (cache.size > MAX) cache.delete(cache.keys().next().value);
  return urls.map((url) => ({ url, partnerUrl: cache.get(key(url))?.value || null }));
}

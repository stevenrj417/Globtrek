import { bookingManifestEntries } from "./manifest.js";
import { isBookingComUrl, isCjUrl } from "./cj.js";

// The /book page ("Book everything") carries its links in the URL so it works from
// an email with no login or database. Decoding re-validates every link: hotels and
// flights must be CJ-tracked, no link may be an untracked Booking.com URL, and
// restaurants and free places may point at their own https page.

const MAX_ITEMS = 20;
const TYPES = new Set(["hotel", "flight", "experience", "restaurant"]);

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value) {
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function safeHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

function text(value, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function encodeBookingPage(manifest) {
  const items = bookingManifestEntries(manifest).slice(0, MAX_ITEMS).map((entry) => ({
    t: entry.type,
    n: text(entry.name),
    u: entry.exactUrl,
    ...(entry.officialUrl && entry.officialUrl !== entry.exactUrl ? { o: entry.officialUrl } : {}),
  }));
  if (!items.length) return null;
  const payload = {
    v: 1,
    c: text(manifest?.destination?.city, 80),
    k: text(manifest?.destination?.country, 80),
    s: manifest?.dates?.start || null,
    e: manifest?.dates?.end || null,
    p: Number(manifest?.travelers?.total) || Number(manifest?.travelers?.adults) || null,
    i: items,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function bookingPageUrl(manifest, origin) {
  const encoded = encodeBookingPage(manifest);
  return encoded ? `${origin}/book?b=${encoded}` : null;
}

export function decodeBookingPage(value) {
  if (typeof value !== "string" || !value || value.length > 12000) return null;
  let payload;
  try { payload = JSON.parse(fromBase64Url(value)); } catch { return null; }
  if (payload?.v !== 1 || !Array.isArray(payload.i)) return null;
  const items = payload.i.slice(0, MAX_ITEMS).flatMap((item, index) => {
    const type = TYPES.has(item?.t) ? item.t : null;
    const url = safeHttps(item?.u);
    if (!type || !url) return [];
    // Anything Booking.com sells must leave through GlobTrek's CJ link.
    if ((type === "hotel" || type === "flight") && !isCjUrl(url)) return [];
    if (isBookingComUrl(url)) return [];
    return [{ id: `${type}-${index}`, type, name: text(item.n) || "Booking", exactUrl: url, officialUrl: safeHttps(item.o) }];
  });
  if (!items.length) return null;
  const date = (value) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
  return {
    city: text(payload.c, 80),
    country: text(payload.k, 80),
    start: date(payload.s),
    end: date(payload.e),
    travelers: Number.isInteger(payload.p) && payload.p > 0 && payload.p <= 30 ? payload.p : null,
    items,
  };
}

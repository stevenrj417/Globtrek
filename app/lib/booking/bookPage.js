import { bookingManifestEntries } from "./manifest.js";
import { isBookingComUrl, isCjUrl } from "./cj.js";
import { LEVELS, cleanInterests } from "../trip/extraInterests.js";

// The /book page ("Book everything") carries its links in the URL so it works from
// an email with no login or database. Decoding re-validates every link: hotels and
// flights must be CJ-tracked, no link may be an untracked Booking.com URL, and
// restaurants and free places may point at their own https page.

const MAX_ITEMS = 20;
// A dinner's or activity's local date and time, e.g. 2027-04-10T19:30.
const WHEN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
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

function point(value) {
  const latitude = Number(value?.latitude ?? value?.[0]);
  const longitude = Number(value?.longitude ?? value?.[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || (latitude === 0 && longitude === 0)) return null;
  return [Math.round(latitude * 1e5) / 1e5, Math.round(longitude * 1e5) / 1e5];
}

export function encodeBookingPage(manifest) {
  // Restaurants are listed only when they take reservations online.
  const items = bookingManifestEntries(manifest).filter((entry) => entry.type !== "restaurant" || entry.reservation).slice(0, MAX_ITEMS).map((entry) => ({
    t: entry.type,
    n: text(entry.name),
    u: entry.exactUrl,
    ...(entry.officialUrl && entry.officialUrl !== entry.exactUrl ? { o: entry.officialUrl } : {}),
    ...(WHEN.test(entry.reservationTime || entry.scheduledAt || "") ? { w: entry.reservationTime || entry.scheduledAt } : {}),
  }));
  if (!items.length) return null;
  const payload = {
    v: 1,
    c: text(manifest?.destination?.city, 80),
    k: text(manifest?.destination?.country, 80),
    s: manifest?.dates?.start || null,
    e: manifest?.dates?.end || null,
    p: Number(manifest?.travelers?.total) || Number(manifest?.travelers?.adults) || null,
    ...(manifest?.dates?.suggested ? { f: 1 } : {}),
    // For the "don't forget" extras: budget level, what the traveler asked help
    // with, the arrival airport and the stay's map point (for the Uber link).
    ...(LEVELS.includes(manifest?.level) ? { l: manifest.level } : {}),
    ...(cleanInterests(manifest?.interests).length ? { x: cleanInterests(manifest.interests).join(",") } : {}),
    ...(/^[A-Z]{3}$/.test(manifest?.destination?.airport || "") ? { a: manifest.destination.airport } : {}),
    ...(point(manifest?.stayPoint) ? { h: point(manifest.stayPoint) } : {}),
    ...(/^[A-Z]{2}$/.test(manifest?.homeCountryCode || "") ? { o: manifest.homeCountryCode } : {}),
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
    const when = WHEN.test(item?.w || "") ? item.w : null;
    return [{ id: `${type}-${index}`, type, name: text(item.n) || "Booking", exactUrl: url, officialUrl: safeHttps(item.o), reservation: type === "restaurant", ...(when && type === "restaurant" ? { reservationTime: when } : {}), ...(when && type === "experience" ? { scheduledAt: when } : {}) }];
  });
  if (!items.length) return null;
  const date = (value) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
  return {
    city: text(payload.c, 80),
    country: text(payload.k, 80),
    start: date(payload.s),
    end: date(payload.e),
    travelers: Number.isInteger(payload.p) && payload.p > 0 && payload.p <= 30 ? payload.p : null,
    suggested: payload.f === 1,
    level: LEVELS.includes(payload.l) ? payload.l : null,
    interests: cleanInterests(typeof payload.x === "string" ? payload.x.slice(0, 200) : ""),
    airport: /^[A-Z]{3}$/.test(payload.a || "") ? payload.a : null,
    stayPoint: point(payload.h),
    homeCountryCode: /^[A-Z]{2}$/.test(payload.o || "") ? payload.o : null,
    items: items.map((item) => (item.type === "flight" && date(payload.s) ? { ...item, departureDate: date(payload.s), returnDate: date(payload.e) } : item)),
  };
}

import { CJ_HOSTS, isBookingComUrl, isCjUrl } from "./cj.js";
import { checklistItems } from "./checklist.js";

// The website half of the GlobTrek Booking Assistant (the Chrome extension in
// /extension). The site describes the trip — destination, dates, party size and
// the exact partner links already on the booking checklist — and nothing else.
// Traveler details are entered inside the extension and never touch this site.
// The extension re-validates every field (extension/src/shared/schema.ts).

export const ASSISTANT_CHANNEL = "globtrek-booking-assistant";
export const ASSISTANT_PROTOCOL = 1;
const MAX_ITEMS = 12;

// Placeholder until the Chrome Web Store assigns the listing URL.
export const ASSISTANT_INSTALL_URL = process.env.NEXT_PUBLIC_GLOBTREK_EXTENSION_URL || "/booking-assistant#install";

// Hosts the extension accepts, mirrored from extension/src/shared/partners.ts.
const ASSISTANT_HOSTS = [
  "getyourguide.com", "opentable.com", "opentable.co.uk", "opentable.ca", "opentable.com.au", "opentable.de", "opentable.ie", "opentable.jp", "opentable.com.mx",
  "resy.com", "exploretock.com", "sevenrooms.com", "thefork.com", "thefork.co.uk", "thefork.it", "thefork.fr", "thefork.es", "quandoo.com", "quandoo.de", "quandoo.co.uk",
];

function hostIn(hostname, hosts) {
  return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

/** Whether the extension will accept this link (the checklist shows every link either way). */
export function isAssistantUrl(value) {
  let url;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== "https:" || url.username || url.password || url.port || value.length > 2048) return false;
  if (isCjUrl(value)) {
    try { return isBookingComUrl(new URL(url.searchParams.get("url") || "").toString()); } catch { return false; }
  }
  if (hostIn(url.hostname, ["booking.com"])) return false;
  if (hostIn(url.hostname, ["google.com"])) return url.pathname.startsWith("/maps");
  return hostIn(url.hostname, ASSISTANT_HOSTS) && !hostIn(url.hostname, CJ_HOSTS);
}

function clean(value, max) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}

function isoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function clock(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/T?(\d{2}):(\d{2})/);
  return match && Number(match[1]) < 24 && Number(match[2]) < 60 ? `${match[1]}:${match[2]}` : null;
}

function count(value, min, max, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
}

/**
 * The checklist entries the assistant can open, each with a stable id the
 * checklist can match statuses back to. Entries it can't open stay on the
 * checklist as ordinary links.
 */
export function assistantEntries(entries) {
  return checklistItems(entries).map((entry, index) => ({ entry, id: `${entry.type}-${index}` })).filter(({ entry }) => isAssistantUrl(entry.exactUrl)).slice(0, MAX_ITEMS);
}

/** The trip payload sent to the extension: no traveler details, no prices, no free-form HTML. */
export function assistantTrip({ entries, city, country, start, end, adults, children, tripId = null, flight = null }) {
  const items = assistantEntries(entries).map(({ entry, id }) => ({
    id,
    type: entry.type,
    name: clean(entry.name, 120) || "Booking",
    url: entry.exactUrl,
    ...(isoDate(entry.departureDate || entry.scheduledAt?.slice?.(0, 10)) ? { date: isoDate(entry.departureDate || entry.scheduledAt.slice(0, 10)) } : {}),
    ...(clock(entry.reservationTime || entry.scheduledAt) ? { time: clock(entry.reservationTime || entry.scheduledAt) } : {}),
  }));
  if (!items.length) return null;
  const startDate = isoDate(start);
  const endDate = isoDate(end) && (!startDate || end >= startDate) ? end : null;
  const trip = {
    tripId: clean(tripId || "", 200) || null,
    destination: { city: clean(city, 80) || "Your trip", country: clean(country, 80) },
    dates: { start: startDate, end: endDate },
    travelers: { adults: count(adults, 1, 30, 1), children: count(children, 0, 20, 0) },
    items,
  };
  if (flight && /^[A-Z]{3}$/.test(flight.origin || "") && /^[A-Z]{3}$/.test(flight.destination || "")) {
    trip.flight = { origin: flight.origin, destination: flight.destination, departureDate: isoDate(flight.departureDate), returnDate: isoDate(flight.returnDate), cabin: /^[A-Z_]{1,20}$/.test(flight.cabin || "") ? flight.cabin : null };
  }
  return trip;
}

function requestId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `r${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/** Sends one request to the extension's bridge on this page; resolves null if nothing answers. */
export function assistantRequest(type, extra = {}, { timeoutMs = 1500 } = {}) {
  if (typeof window === "undefined") return Promise.resolve(null);
  const id = requestId();
  return new Promise((resolve) => {
    const done = (value) => { window.removeEventListener("message", onMessage); clearTimeout(timer); resolve(value); };
    const onMessage = (event) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.channel === ASSISTANT_CHANNEL && data.kind === "response" && data.requestId === id) done(data);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    window.addEventListener("message", onMessage);
    window.postMessage({ channel: ASSISTANT_CHANNEL, v: ASSISTANT_PROTOCOL, kind: "request", requestId: id, type, ...extra }, window.location.origin);
  });
}

/** Listens for status events the extension pushes to this tab. Returns an unsubscribe function. */
export function onAssistantStatus(listener) {
  const handler = (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data;
    if (data?.channel === ASSISTANT_CHANNEL && data.kind === "event" && data.type === "SESSION_STATUS" && data.status?.sessionId) listener(data.status);
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}

/** Desktop Chrome (or another Chromium browser that installs Chrome Web Store extensions). */
export function canUseExtension(navigatorLike) {
  const ua = navigatorLike?.userAgent || "";
  if (navigatorLike?.userAgentData) return !navigatorLike.userAgentData.mobile && navigatorLike.userAgentData.brands?.some((brand) => /Chrom/.test(brand.brand));
  return /Chrome\//.test(ua) && !/Mobile|Android|iPhone|iPad|CriOS|EdgiOS/.test(ua);
}

export const ASSISTANT_STATUS_LABELS = {
  not_started: "Not started",
  opening: "Opening",
  opened: "Opened",
  filling: "Filling",
  filled: "Filled",
  needs_attention: "Needs attention",
  ready_to_review: "Ready to review",
  ready_to_pay: "Ready to pay",
  user_complete: "Marked complete",
  failed_safely: "Stopped safely",
};

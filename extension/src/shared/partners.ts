import { DEV_FIXTURE_ORIGIN } from "./env.ts";

// Every hostname the assistant will ever open, and which of them have a form
// adapter. Anything not listed here is rejected before a tab is opened.

export type PartnerId = "booking" | "getyourguide" | "opentable" | "globtrek-flights" | "reservation-platform" | "google-maps";

export interface PartnerInfo {
  id: PartnerId;
  name: string;
  /** Registrable domains; a hostname matches when equal or a subdomain. */
  domains: readonly string[];
  /** Host permission patterns requested (optionally) before the assistant may fill forms there. */
  originPatterns: readonly string[];
  /** Whether an adapter exists for this partner at all. */
  hasAdapter: boolean;
}

export const PARTNERS: readonly PartnerInfo[] = [
  { id: "booking", name: "Booking.com", domains: ["booking.com"], originPatterns: ["https://www.booking.com/*", "https://secure.booking.com/*"], hasAdapter: true },
  { id: "getyourguide", name: "GetYourGuide", domains: ["getyourguide.com"], originPatterns: ["https://www.getyourguide.com/*"], hasAdapter: true },
  { id: "opentable", name: "OpenTable", domains: ["opentable.com", "opentable.co.uk", "opentable.ca", "opentable.com.au", "opentable.de", "opentable.ie", "opentable.jp", "opentable.com.mx"], originPatterns: ["https://www.opentable.com/*"], hasAdapter: true },
  // GlobTrek's own (future) Duffel-powered checkout; the site is already a content-script host.
  { id: "globtrek-flights", name: "GlobTrek flight checkout", domains: ["glob-trek.com"], originPatterns: [], hasAdapter: true },
  { id: "reservation-platform", name: "Restaurant reservation site", domains: ["resy.com", "exploretock.com", "sevenrooms.com", "thefork.com", "thefork.co.uk", "thefork.it", "thefork.fr", "thefork.es", "quandoo.com", "quandoo.de", "quandoo.co.uk"], originPatterns: [], hasAdapter: false },
  { id: "google-maps", name: "Google Maps", domains: ["google.com"], originPatterns: [], hasAdapter: false },
];

// GlobTrek's Commission Junction click hosts. A CJ link is accepted only when its
// `url` parameter points at a Booking.com page, and it is opened exactly as given
// so the affiliate tracking survives.
export const CJ_HOSTS: readonly string[] = ["kqzyfj.com", "dpbolvw.net", "anrdoezrs.net", "jdoqocy.com", "tkqlhce.com", "qksrv.net"];

export function hostMatches(hostname: string, domains: readonly string[]): boolean {
  const host = hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export function partnerById(id: PartnerId): PartnerInfo {
  const partner = PARTNERS.find((entry) => entry.id === id);
  if (!partner) throw new Error(`Unknown partner ${id}`);
  return partner;
}

export interface ClassifiedUrl {
  partner: PartnerInfo;
  /** The page the traveler lands on (the CJ target for affiliate links). */
  landingUrl: URL;
  affiliate: boolean;
  fixture: boolean;
}

function parse(value: string): URL | null {
  try { return new URL(value); } catch { return null; }
}

function isIpAddress(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":") || hostname.startsWith("[");
}

/**
 * Decides whether a URL is one the assistant may open, and for which partner.
 * Only https, no credentials, no IP hosts, no non-default ports; development
 * builds additionally accept the local fixture server.
 */
export function classifyUrl(value: string, { dev = false }: { dev?: boolean } = {}): ClassifiedUrl | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  const url = parse(value);
  if (!url) return null;
  if (dev && url.origin === DEV_FIXTURE_ORIGIN) {
    const segment = url.pathname.split("/")[1] ?? "";
    const partner = PARTNERS.find((entry) => entry.id === segment && entry.hasAdapter);
    return partner ? { partner, landingUrl: url, affiliate: false, fixture: true } : null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port || isIpAddress(url.hostname)) return null;
  if (hostMatches(url.hostname, CJ_HOSTS)) {
    const target = parse(url.searchParams.get("url") ?? "");
    if (!target || target.protocol !== "https:" || !hostMatches(target.hostname, ["booking.com"])) return null;
    return { partner: partnerById("booking"), landingUrl: target, affiliate: true, fixture: false };
  }
  // Booking.com links must leave through GlobTrek's CJ link (the website's rule);
  // a raw one would lose affiliate credit, so it is refused rather than "fixed".
  if (hostMatches(url.hostname, ["booking.com"])) return null;
  const partner = PARTNERS.find((entry) => entry.id !== "booking" && hostMatches(url.hostname, entry.domains));
  if (!partner) return null;
  if (partner.id === "google-maps" && !url.pathname.startsWith("/maps")) return null;
  return { partner, landingUrl: url, affiliate: false, fixture: false };
}

/** The partner whose adapter should run on a page the traveler is looking at. */
export function partnerForPage(href: string, { dev = false }: { dev?: boolean } = {}): PartnerInfo | null {
  const url = parse(href);
  if (!url) return null;
  if (dev && url.origin === DEV_FIXTURE_ORIGIN) return classifyUrl(href, { dev })?.partner ?? null;
  if (url.protocol !== "https:") return null;
  return PARTNERS.find((entry) => entry.hasAdapter && hostMatches(url.hostname, entry.domains)) ?? null;
}

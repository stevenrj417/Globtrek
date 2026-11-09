import { adapterFieldKeys, type Adapter } from "../adapters/types.ts";
import { adapterFor, autofillAllowed } from "../adapters/index.ts";
import type { FillReport } from "../content/engine.ts";
import type { FieldKey } from "../profile/fields.ts";
import { classifyUrl, type PartnerId } from "../shared/partners.ts";
import type { PublicSessionStatus, TripPayload } from "../shared/schema.ts";
import type { BookingStatus } from "../shared/status.ts";

// A booking session: one trip, its approved links, and where each booking stands.
// Sessions hold trip details (destination, dates, party size, partner links) but
// never traveler details — those stay in the profile store.

export interface SessionItem {
  id: string;
  type: TripPayload["items"][number]["type"];
  name: string;
  /** Exactly as GlobTrek supplied it — CJ affiliate wrapper included. */
  url: string;
  date: string | null;
  time: string | null;
  partnerId: PartnerId;
  partnerName: string;
  affiliate: boolean;
  fixture: boolean;
  /** Whether an adapter may fill this partner's pages. */
  autofill: boolean;
  autofillNote: string | null;
  status: BookingStatus;
  tabId: number | null;
  note: string | null;
  filled: string[];
  needsManual: string[];
  selectorsVersion: string | null;
  updatedAt: number;
}

export interface BookingSession {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** The GlobTrek origin that started the session, and its tab for status updates. */
  origin: string;
  sourceTabId: number | null;
  trip: Omit<TripPayload, "items">;
  items: SessionItem[];
  /** Profile fields any adapter in this session can use (shown to the traveler before anything is filled). */
  requiredFields: FieldKey[];
  mode: "guided" | "all" | null;
}

export function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return `s_${Array.from(bytes, (b) => (b % 36).toString(36)).join("")}`;
}

export function createSession(trip: TripPayload, { origin, sourceTabId, dev = false, now = Date.now() }: { origin: string; sourceTabId: number | null; dev?: boolean; now?: number }): BookingSession {
  const items: SessionItem[] = trip.items.map((item) => {
    const classified = classifyUrl(item.url, { dev });
    if (!classified) throw new Error("Unapproved link reached createSession");
    const adapter = adapterFor(classified.partner.id);
    const allowed = adapter ? autofillAllowed(adapter, { fixture: classified.fixture, dev }) : false;
    return {
      id: item.id,
      type: item.type,
      name: item.name,
      url: item.url,
      date: item.date,
      time: item.time,
      partnerId: classified.partner.id,
      partnerName: classified.partner.name,
      affiliate: classified.affiliate,
      fixture: classified.fixture,
      autofill: allowed,
      autofillNote: adapter && !allowed ? adapter.policy.reason : adapter ? null : `GlobTrek doesn't fill forms on ${classified.partner.name}. Use the copy buttons.`,
      status: "not_started",
      tabId: null,
      note: null,
      filled: [],
      needsManual: [],
      selectorsVersion: null,
      updatedAt: now,
    };
  });
  const required = new Set<FieldKey>();
  for (const item of items) {
    const adapter = item.autofill ? adapterFor(item.partnerId) : null;
    if (adapter) adapterFieldKeys(adapter).forEach((key) => required.add(key));
  }
  const { items: _items, ...rest } = trip;
  return { id: newSessionId(), createdAt: now, updatedAt: now, origin, sourceTabId, trip: rest, items, requiredFields: [...required], mode: null };
}

export function updateItem(session: BookingSession, itemId: string, patch: Partial<SessionItem>, now = Date.now()): BookingSession {
  return {
    ...session,
    updatedAt: now,
    items: session.items.map((item) => (item.id === itemId ? { ...item, ...patch, updatedAt: now } : item)),
  };
}

/** Translates an engine report into a status the traveler can act on. Never claims more than the report shows. */
export function statusFromReport(report: FillReport, adapter: Adapter): Pick<SessionItem, "status" | "note" | "filled" | "needsManual" | "selectorsVersion"> {
  const filled = [...new Set(report.filled.map((field) => field.label))];
  const needsManual = [
    ...report.skipped.filter((field) => field.reason !== "kept_existing").map((field) => field.label),
    ...report.missing.map((field) => `${field.label} (not in your profile)`),
  ];
  const base = { filled, needsManual: [...new Set(needsManual)], selectorsVersion: report.selectorsVersion };
  switch (report.pageKind) {
    case "payment":
      return { ...base, status: "ready_to_pay", note: "Review and pay on the partner site." };
    case "confirmation":
      return { ...base, status: "needs_attention", note: "This looks like a confirmation page. Mark it complete once you've checked your confirmation email." };
    case "search":
    case "product":
      return { ...base, status: "opened", note: adapter.guidance[report.pageKind] ?? "Continue on the partner site." };
    default:
      break;
  }
  if (report.framedForm) return { ...base, status: "needs_attention", note: "This form is inside a secure frame the assistant can't reach. Use the copy buttons." };
  if (!report.filled.length && report.skipped.some((field) => field.reason === "not_found")) {
    return { ...base, status: "needs_attention", note: `The assistant couldn't find ${adapter.name}'s form fields (selectors ${adapter.selectorsVersion}). The page may have changed — use the copy buttons.` };
  }
  if (!report.filled.length && !report.skipped.length) {
    return { ...base, status: "needs_attention", note: "Nothing to fill on this page yet. Continue on the partner site, then press Fill again." };
  }
  if (base.needsManual.length) return { ...base, status: "needs_attention", note: "Some details need you. Check the highlighted list, then review on the partner site." };
  return { ...base, status: report.paymentFieldsPresent ? "ready_to_pay" : "ready_to_review", note: report.paymentFieldsPresent ? "Review and pay on the partner site." : "Filled. Review everything on the partner site before you continue." };
}

export function publicStatus(session: BookingSession): PublicSessionStatus {
  return {
    sessionId: session.id,
    updatedAt: session.updatedAt,
    items: session.items.map((item) => ({ id: item.id, status: item.status, partner: item.partnerName, note: item.note ? item.note.slice(0, 200) : null })),
  };
}

export const MAX_SESSIONS = 10;
export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function pruneSessions(sessions: Record<string, BookingSession>, now = Date.now()): Record<string, BookingSession> {
  const kept = Object.values(sessions).filter((session) => now - session.updatedAt < SESSION_TTL_MS).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS);
  return Object.fromEntries(kept.map((session) => [session.id, session]));
}

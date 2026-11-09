import { adapterFor } from "../adapters/index.ts";
import { adapterFieldKeys } from "../adapters/types.ts";
import { PASSPORT_FIELDS, resolveFields } from "../profile/fields.ts";
import { sanitizePassports } from "../profile/sanitize.ts";
import { chromeAreas, loadProfile, loadSettings, STORAGE_KEYS } from "../profile/store.ts";
import { logEvent } from "../security/log.ts";
import { assertNoPaymentData } from "../security/payment-guard.ts";
import { createSession, publicStatus, pruneSessions, statusFromReport, updateItem, type BookingSession, type SessionItem } from "../session/manager.ts";
import { DEV_FIXTURE_ORIGIN, IS_DEV, VERSION } from "../shared/env.ts";
import type { FillCommand, FillResponse, UiRequest, UiResponse } from "../shared/internal.ts";
import { isAllowedWebOrigin, SchemaError, validateWebRequest } from "../shared/schema.ts";
import { DEMO_TRIP, SHOWCASE_TRIP } from "./demo.ts";

const areas = chromeAreas();

// ---------- session storage (serialised so concurrent tab events can't clobber each other)

let queue: Promise<unknown> = Promise.resolve();

async function readSessions(): Promise<Record<string, BookingSession>> {
  const { [STORAGE_KEYS.sessions]: sessions } = await areas.local.get([STORAGE_KEYS.sessions]);
  return sessions && typeof sessions === "object" ? (sessions as Record<string, BookingSession>) : {};
}

function mutate<T>(change: (sessions: Record<string, BookingSession>) => { sessions: Record<string, BookingSession>; result: T }): Promise<T> {
  const next = queue.then(async () => {
    const { sessions, result } = change(await readSessions());
    await areas.local.set({ [STORAGE_KEYS.sessions]: pruneSessions(sessions) });
    return result;
  });
  queue = next.catch(() => undefined);
  return next;
}

async function changeItem(sessionId: string, itemId: string, patch: Partial<SessionItem>): Promise<BookingSession | null> {
  const session = await mutate((sessions) => {
    const current = sessions[sessionId];
    if (!current) return { sessions, result: null };
    const updated = updateItem(current, itemId, patch);
    return { sessions: { ...sessions, [sessionId]: updated }, result: updated };
  });
  if (session) await broadcast(session);
  return session;
}

/** Tells the GlobTrek tab (statuses only) and the extension's own pages that something changed. */
async function broadcast(session: BookingSession): Promise<void> {
  if (session.sourceTabId !== null) {
    chrome.tabs.sendMessage(session.sourceTabId, { type: "SESSION_STATUS", status: publicStatus(session) }, { frameId: 0 }).catch(() => undefined);
  }
  chrome.runtime.sendMessage({ type: "SESSIONS_CHANGED" }).catch(() => undefined);
}

async function findByTab(tabId: number): Promise<{ session: BookingSession; item: SessionItem } | null> {
  const sessions = await readSessions();
  for (const session of Object.values(sessions)) {
    const item = session.items.find((entry) => entry.tabId === tabId);
    if (item) return { session, item };
  }
  return null;
}

// ---------- website requests (via the bridge content script on GlobTrek pages)

async function handleWebRequest(raw: unknown, sender: chrome.runtime.MessageSender): Promise<Record<string, unknown>> {
  const origin = sender.origin ?? (sender.url ? new URL(sender.url).origin : "");
  if (!sender.tab || sender.frameId !== 0 || !isAllowedWebOrigin(origin, { dev: IS_DEV })) return { ok: false, error: "origin_not_allowed" };
  let request;
  try { request = validateWebRequest(raw, { dev: IS_DEV }); }
  catch (error) {
    logEvent("web_request_rejected", { field: error instanceof SchemaError ? error.path.split("[")[0] : "unknown" });
    return { ok: false, error: "invalid_request", detail: error instanceof SchemaError ? error.message.slice(0, 160) : "invalid" };
  }
  switch (request.type) {
    case "PING":
      return { ok: true, installed: true, version: VERSION, protocol: 1 };
    case "GET_STATUS": {
      const session = (await readSessions())[request.sessionId];
      // A page may only read sessions its own origin started.
      return session && session.origin === origin ? { ok: true, status: publicStatus(session) } : { ok: false, error: "not_found" };
    }
    case "OPEN_SESSION": {
      const session = (await readSessions())[request.sessionId];
      if (!session || session.origin !== origin) return { ok: false, error: "not_found" };
      const url = chrome.runtime.getURL(`assistant.html#/session/${session.id}`);
      const existing = (await chrome.tabs.query({ url: chrome.runtime.getURL("assistant.html") + "*" }).catch(() => [])).find((tab) => tab.url === url);
      if (existing?.id !== undefined) {
        await chrome.tabs.update(existing.id, { active: true });
        if (existing.windowId !== undefined) await chrome.windows.update(existing.windowId, { focused: true }).catch(() => undefined);
      } else {
        await chrome.tabs.create({ url, active: true, ...(sender.tab.index !== undefined ? { index: sender.tab.index + 1 } : {}) });
      }
      return { ok: true, status: publicStatus(session) };
    }
    case "START_SESSION": {
      const session = createSession(request.trip, { origin, sourceTabId: sender.tab.id ?? null, dev: IS_DEV });
      await mutate((sessions) => ({ sessions: { ...sessions, [session.id]: session }, result: null }));
      const assistantTab: chrome.tabs.CreateProperties = { url: chrome.runtime.getURL(`assistant.html#/session/${session.id}`), active: true };
      if (sender.tab.index !== undefined) assistantTab.index = sender.tab.index + 1;
      if (sender.tab.windowId !== undefined) assistantTab.windowId = sender.tab.windowId;
      await chrome.tabs.create(assistantTab);
      logEvent("session_started", { items: session.items.length });
      return { ok: true, sessionId: session.id, status: publicStatus(session) };
    }
  }
}

// ---------- extension page requests

async function openItems(sessionId: string, itemIds: string[]): Promise<BookingSession | null> {
  const session = (await readSessions())[sessionId];
  if (!session) return null;
  let latest: BookingSession | null = session;
  for (const [position, itemId] of itemIds.entries()) {
    const item = session.items.find((entry) => entry.id === itemId);
    if (!item) continue;
    await changeItem(sessionId, itemId, { status: "opening", note: null });
    try {
      // The exact approved URL, unchanged, so CJ affiliate tracking is preserved.
      const tab = await chrome.tabs.create({ url: item.url, active: position === 0 });
      latest = await changeItem(sessionId, itemId, { tabId: tab.id ?? null, status: "opening" });
    } catch {
      latest = await changeItem(sessionId, itemId, { status: "failed_safely", note: "Chrome couldn't open this tab. Use the link instead." });
    }
  }
  return latest;
}

async function hasHostAccess(url: string): Promise<boolean> {
  try {
    const origin = new URL(url).origin;
    return await chrome.permissions.contains({ origins: [`${origin}/*`] });
  } catch {
    return false;
  }
}

async function fillItem(sessionId: string, itemId: string, passportsInput: unknown, { automatic = false } = {}): Promise<BookingSession | null> {
  const session = (await readSessions())[sessionId];
  const item = session?.items.find((entry) => entry.id === itemId);
  if (!session || !item || item.tabId === null) return null;
  const adapter = adapterFor(item.partnerId);
  if (!adapter || !item.autofill) {
    return changeItem(sessionId, itemId, { status: "needs_attention", note: item.autofillNote ?? "Use the copy buttons for this booking." });
  }
  const tab = await chrome.tabs.get(item.tabId).catch(() => null);
  if (!tab?.url) {
    return changeItem(sessionId, itemId, { status: "needs_attention", note: automatic ? null : "The assistant needs your permission for this site, or the tab was closed." });
  }
  const tabUrl = new URL(tab.url);
  const onFixture = IS_DEV && tabUrl.origin === DEV_FIXTURE_ORIGIN && tabUrl.pathname.startsWith(`/${adapter.id}/`);
  if (!onFixture && (tabUrl.protocol !== "https:" || !adapter.hosts.includes(tabUrl.hostname))) {
    return automatic ? session : changeItem(sessionId, itemId, { status: "opened", note: `Still on the way to ${adapter.name}. Press Fill once the page has loaded.` });
  }
  if (!(await hasHostAccess(tab.url))) {
    return changeItem(sessionId, itemId, { status: "needs_attention", note: `Allow the assistant on ${adapter.name} to fill this page.` });
  }
  const profile = await loadProfile(areas);
  if (!profile) return changeItem(sessionId, itemId, { status: "needs_attention", note: "Add your details first. Nothing has been filled." });
  const travelerIds = new Set(profile.travelers.map((traveler) => traveler.id));
  // Passport values arrive only from an explicit, per-page confirmation in the assistant UI.
  const passports = !automatic && passportsInput ? sanitizePassports(passportsInput, travelerIds) : [];
  const keys = adapterFieldKeys(adapter).filter((key) => passports.length || !PASSPORT_FIELDS.has(key));
  const values = resolveFields(profile, keys, passports) as Record<string, string>;
  assertNoPaymentData(values, "fill");
  await changeItem(sessionId, itemId, { status: "filling", note: null });
  try {
    await chrome.scripting.executeScript({ target: { tabId: item.tabId, frameIds: [0] }, files: ["content/fill.js"] });
    const command: FillCommand = { type: "GT_FILL", adapterId: adapter.id, fixture: onFixture, values };
    const response = (await chrome.tabs.sendMessage(item.tabId, command, { frameId: 0 })) as FillResponse | undefined;
    if (!response?.ok) {
      logEvent("fill_refused", { adapter: adapter.id, reason: response && !response.ok ? response.error : "no_response" });
      return changeItem(sessionId, itemId, { status: "failed_safely", note: "The assistant stopped without changing anything. Use the copy buttons." });
    }
    logEvent("fill_done", { adapter: adapter.id, filled: response.report.filled.length, skipped: response.report.skipped.length, page: response.report.pageKind });
    return changeItem(sessionId, itemId, statusFromReport(response.report, adapter));
  } catch {
    return changeItem(sessionId, itemId, { status: "failed_safely", note: "The assistant couldn't reach this page (it may have changed or blocked extensions). Nothing was submitted." });
  }
}

async function handleUiRequest(request: UiRequest): Promise<UiResponse> {
  switch (request.type) {
    case "UI_GET_SESSIONS":
      return { ok: true, sessions: Object.values(await readSessions()).sort((a, b) => b.updatedAt - a.updatedAt) };
    case "UI_SET_MODE": {
      const session = await mutate((sessions) => {
        const current = sessions[request.sessionId];
        if (!current) return { sessions, result: null };
        const updated = { ...current, mode: request.mode, updatedAt: Date.now() };
        return { sessions: { ...sessions, [current.id]: updated }, result: updated };
      });
      return session ? { ok: true, session } : { ok: false, error: "This booking session has ended." };
    }
    case "UI_OPEN_ITEMS": {
      const session = await openItems(request.sessionId, request.itemIds.slice(0, 12));
      return session ? { ok: true, session } : { ok: false, error: "This booking session has ended." };
    }
    case "UI_FOCUS_ITEM": {
      const item = (await readSessions())[request.sessionId]?.items.find((entry) => entry.id === request.itemId);
      if (item?.tabId == null) return { ok: false, error: "That tab isn't open." };
      const tab = await chrome.tabs.update(item.tabId, { active: true }).catch(() => null);
      if (tab?.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true }).catch(() => undefined);
      return tab ? { ok: true } : { ok: false, error: "That tab was closed." };
    }
    case "UI_FILL_ITEM": {
      const session = await fillItem(request.sessionId, request.itemId, request.passports);
      return session ? { ok: true, session } : { ok: false, error: "Open this booking first." };
    }
    case "UI_MARK_COMPLETE": {
      const session = await changeItem(request.sessionId, request.itemId, request.complete ? { status: "user_complete", note: "You marked this booked." } : { status: "opened", note: null });
      return session ? { ok: true, session } : { ok: false, error: "This booking session has ended." };
    }
    case "UI_END_SESSION":
      await mutate((sessions) => {
        const { [request.sessionId]: _removed, ...rest } = sessions;
        return { sessions: rest, result: null };
      });
      return { ok: true };
    case "UI_DEV_DEMO_SESSION": {
      if (!IS_DEV) return { ok: false, error: "Not available." };
      const session = createSession(request.variant === "showcase" ? SHOWCASE_TRIP : DEMO_TRIP, { origin: DEV_FIXTURE_ORIGIN, sourceTabId: null, dev: true });
      await mutate((sessions) => ({ sessions: { ...sessions, [session.id]: session }, result: null }));
      return { ok: true, sessionId: session.id, session };
    }
  }
}

function isExtensionPage(sender: chrome.runtime.MessageSender): boolean {
  return sender.id === chrome.runtime.id && typeof sender.url === "string" && sender.url.startsWith(`chrome-extension://${chrome.runtime.id}/`) && !sender.tab?.url?.startsWith("http");
}

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return false;
  const envelope = message as { bridge?: unknown; message?: unknown; type?: unknown } | null;
  if (envelope?.bridge === true) {
    handleWebRequest(envelope.message, sender).then(sendResponse, () => sendResponse({ ok: false, error: "internal" }));
    return true;
  }
  if (typeof envelope?.type === "string" && envelope.type.startsWith("UI_") && isExtensionPage(sender)) {
    handleUiRequest(envelope as UiRequest).then(sendResponse, (error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message.slice(0, 200) : "Something went wrong." }));
    return true;
  }
  return false;
});

// ---------- tab lifecycle

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status !== "complete") return;
  void (async () => {
    const found = await findByTab(tabId);
    if (!found) return;
    const { session, item } = found;
    if (item.status === "opening" || item.status === "not_started") await changeItem(session.id, item.id, { status: "opened", note: item.autofill ? null : item.autofillNote });
    const settings = await loadSettings(areas);
    // Automatic fill only for partners whose adapter is enabled and whose site the traveler already allowed.
    if (settings.autoFill && item.autofill && !["user_complete", "ready_to_pay"].includes(item.status)) await fillItem(session.id, item.id, null, { automatic: true });
  })();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void (async () => {
    const found = await findByTab(tabId);
    if (found && found.item.status !== "user_complete") await changeItem(found.session.id, found.item.id, { tabId: null, note: "Tab closed. Open it again when you're ready." });
    else if (found) await changeItem(found.session.id, found.item.id, { tabId: null });
  })();
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") void chrome.tabs.create({ url: chrome.runtime.getURL("assistant.html#/welcome") });
});


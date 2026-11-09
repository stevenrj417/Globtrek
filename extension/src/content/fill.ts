import { adapterFor, autofillAllowed } from "../adapters/index.ts";
import { isFieldKey, type FieldKey } from "../profile/fields.ts";
import { DEV_FIXTURE_ORIGIN, IS_DEV } from "../shared/env.ts";
import type { FillCommand, FillResponse } from "../shared/internal.ts";
import type { PartnerId } from "../shared/partners.ts";
import { fillPage } from "./engine.ts";

// Injected with chrome.scripting.executeScript into one partner tab, top frame
// only, after the traveler asks. It answers a single fill command from the
// background worker and re-checks for itself that this page is one its adapter
// is allowed on. It never reads payment fields and never submits.

declare global {
  interface Window { __globtrekFillReady?: boolean }
}

function pathFor(fixture: boolean): string {
  // Fixture pages live under /<adapter-id>/..., mirroring the partner's real paths.
  return fixture ? location.pathname.replace(/^\/[^/]+/, "") || "/" : location.pathname;
}

async function handle(command: FillCommand): Promise<FillResponse> {
  const adapter = adapterFor(command.adapterId as PartnerId);
  if (!adapter) return { ok: false, error: "unknown_adapter" };
  const fixture = IS_DEV && location.origin === DEV_FIXTURE_ORIGIN && location.pathname.startsWith(`/${adapter.id}/`);
  if (command.fixture !== fixture) return { ok: false, error: "page_mismatch" };
  if (!fixture && (location.protocol !== "https:" || !adapter.hosts.includes(location.hostname))) return { ok: false, error: "host_not_allowed" };
  if (!autofillAllowed(adapter, { fixture })) return { ok: false, error: "autofill_disabled" };
  const values: Partial<Record<FieldKey, string>> = {};
  for (const [key, value] of Object.entries(command.values)) if (isFieldKey(key) && typeof value === "string") values[key] = value;
  const report = await fillPage(document, adapter, values, { pathname: pathFor(fixture) });
  return { ok: true, report };
}

if (window.top === window && !window.__globtrekFillReady) {
  window.__globtrekFillReady = true;
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id || sender.tab) return false;
    const command = message as FillCommand;
    if (!command || command.type !== "GT_FILL") return false;
    handle(command).then(sendResponse, () => sendResponse({ ok: false, error: "fill_failed" }));
    return true;
  });
}

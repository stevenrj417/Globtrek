import { CHANNEL, PROTOCOL_VERSION, MAX_MESSAGE_BYTES, byteLength, isAllowedWebOrigin } from "../shared/schema.ts";
import { IS_DEV } from "../shared/env.ts";

// Runs on GlobTrek's own pages only. It relays booking-assistant requests from
// the page to the background worker (which validates them in full) and relays
// session status back. It carries no traveler data in either direction.

if (window.top === window && isAllowedWebOrigin(location.origin, { dev: IS_DEV })) {
  document.documentElement.dataset.globtrekAssistant = String(PROTOCOL_VERSION);

  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data as { channel?: unknown; kind?: unknown; requestId?: unknown } | null;
    if (!data || data.channel !== CHANNEL || data.kind !== "request") return;
    const requestId = typeof data.requestId === "string" ? data.requestId.slice(0, 40) : "";
    if (byteLength(data) > MAX_MESSAGE_BYTES) {
      window.postMessage({ channel: CHANNEL, v: PROTOCOL_VERSION, kind: "response", requestId, ok: false, error: "too_large" }, location.origin);
      return;
    }
    chrome.runtime.sendMessage({ bridge: true, message: data }).then(
      (response: unknown) => window.postMessage({ channel: CHANNEL, v: PROTOCOL_VERSION, kind: "response", requestId, ...(response as object) }, location.origin),
      () => window.postMessage({ channel: CHANNEL, v: PROTOCOL_VERSION, kind: "response", requestId, ok: false, error: "unavailable" }, location.origin),
    );
  });

  chrome.runtime.onMessage.addListener((message: unknown, sender) => {
    if (sender.id !== chrome.runtime.id || sender.tab) return false;
    const event = message as { type?: unknown; status?: unknown };
    if (event?.type === "SESSION_STATUS") window.postMessage({ channel: CHANNEL, v: PROTOCOL_VERSION, kind: "event", type: "SESSION_STATUS", status: event.status }, location.origin);
    return false;
  });
}

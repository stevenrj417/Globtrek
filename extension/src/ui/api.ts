import type { UiRequest, UiResponse } from "../shared/internal.ts";

export async function send(request: UiRequest): Promise<UiResponse> {
  try {
    const response = (await chrome.runtime.sendMessage(request)) as UiResponse | undefined;
    return response ?? { ok: false, error: "The assistant didn't respond. Try again." };
  } catch {
    return { ok: false, error: "The assistant didn't respond. Try again." };
  }
}

export function onSessionsChanged(listener: () => void): void {
  chrome.runtime.onMessage.addListener((message: unknown, sender) => {
    if (sender.id === chrome.runtime.id && (message as { type?: string })?.type === "SESSIONS_CHANGED") listener();
    return false;
  });
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

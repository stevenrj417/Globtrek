import { IS_DEV } from "../shared/env.ts";

// The only logger in the extension. It accepts an event name and a small set of
// non-personal facts (counts, statuses, adapter ids). Strings are dropped unless
// they are short identifiers, so traveler details can't reach the console even by
// mistake. Nothing is ever sent off the device.

type Fact = string | number | boolean | null;
const SAFE_TOKEN = /^[a-z0-9_.:-]{1,40}$/i;

export function safeFacts(facts: Record<string, unknown>): Record<string, Fact> {
  const out: Record<string, Fact> = {};
  for (const [key, value] of Object.entries(facts)) {
    if (typeof value === "number" || typeof value === "boolean" || value === null) out[key] = value;
    else if (typeof value === "string" && SAFE_TOKEN.test(value) && !/@/.test(value) && !/\d{5,}/.test(value)) out[key] = value;
    else out[key] = "[redacted]";
  }
  return out;
}

export function logEvent(event: string, facts: Record<string, unknown> = {}): void {
  if (!IS_DEV) return;
  console.info(`[globtrek] ${event}`, safeFacts(facts));
}

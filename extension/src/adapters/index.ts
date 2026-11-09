import { IS_DEV } from "../shared/env.ts";
import type { PartnerId } from "../shared/partners.ts";
import { bookingAdapter } from "./booking.ts";
import { getYourGuideAdapter } from "./getyourguide.ts";
import { globTrekFlightsAdapter } from "./globtrek-flights.ts";
import { openTableAdapter } from "./opentable.ts";
import type { Adapter } from "./types.ts";

export const ADAPTERS: readonly Adapter[] = [bookingAdapter, getYourGuideAdapter, openTableAdapter, globTrekFlightsAdapter];

export function adapterFor(id: PartnerId): Adapter | null {
  return ADAPTERS.find((adapter) => adapter.id === id) ?? null;
}

/**
 * Whether autofill may run for this adapter on this page. Live partner pages
 * follow the adapter's policy. Development builds also fill the local sanitized
 * fixtures (never a partner's real site) so the engine can be exercised end to end.
 */
export function autofillAllowed(adapter: Adapter, { fixture, dev = IS_DEV }: { fixture: boolean; dev?: boolean }): boolean {
  if (fixture) return dev;
  return adapter.policy.autofill;
}

export type { Adapter };

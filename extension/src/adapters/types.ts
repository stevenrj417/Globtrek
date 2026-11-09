import type { FieldKey } from "../profile/fields.ts";
import type { PartnerId } from "../shared/partners.ts";

// An adapter describes one partner's checkout form as data: where it runs, how
// to recognise each page, and which selector holds each field. It contains no
// behaviour of its own — the shared engine does the filling — so an adapter can
// never click, submit or navigate.

export type PageKind = "search" | "product" | "details" | "review" | "payment" | "confirmation" | "unknown";

export interface PageRule {
  kind: PageKind;
  /** Path patterns, tested against `location.pathname`. */
  path?: RegExp;
  /** Any of these selectors present marks the page (checked after `path`). */
  marker?: string[];
}

export interface FieldRule {
  key: FieldKey;
  /** Tried in order; the first visible, editable match wins. */
  selectors: string[];
  control?: "text" | "select" | "textarea";
  /** For selects: how to match the stored value to an option. */
  match?: "value" | "text" | "country" | "dial-code" | "hour";
  /** Optional on the partner's form: a blank profile value isn't reported as needing attention. */
  optional?: boolean;
}

export interface UnsupportedField {
  label: string;
  reason: string;
}

export interface AdapterPolicy {
  /** Whether autofill may run on the live partner site. */
  autofill: boolean;
  reason: string;
  termsUrl: string;
  reviewedOn: string;
}

export interface Adapter {
  id: PartnerId;
  name: string;
  /** Bumped whenever selectors change; reported with every fill so breakage is traceable. */
  selectorsVersion: string;
  /** Exact hostnames the adapter may run on. */
  hosts: readonly string[];
  policy: AdapterPolicy;
  pages: readonly PageRule[];
  fields: readonly FieldRule[];
  unsupported: readonly UnsupportedField[];
  /** What the traveler is told to do on a page where nothing can be filled yet. */
  guidance: Partial<Record<PageKind, string>>;
  timeoutMs: number;
  maxPasses: number;
}

export function adapterFieldKeys(adapter: Adapter): FieldKey[] {
  return [...new Set(adapter.fields.map((field) => field.key))];
}

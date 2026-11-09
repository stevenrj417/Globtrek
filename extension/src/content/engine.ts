import type { Adapter, FieldRule, PageKind } from "../adapters/types.ts";
import { FIELD_LABELS, type FieldKey } from "../profile/fields.ts";

// The fill engine. It runs inside a partner tab, only after the traveler asked,
// and only with the values its adapter needs. It:
//   - sets values through the native setter and fires input/change/blur, so
//     React/Vue-controlled forms register them;
//   - never overwrites something already typed;
//   - never touches password, hidden, file or payment-card fields, and never
//     reads their values;
//   - never clicks, submits, or navigates;
//   - waits (MutationObserver, bounded by a timeout and a pass limit) for forms
//     rendered late, then stops observing;
//   - reports what it filled, what it couldn't, and why — field names only, never values.

export interface FieldOutcome {
  key: FieldKey;
  label: string;
}

export interface SkippedField extends FieldOutcome {
  reason: "not_found" | "kept_existing" | "no_matching_option" | "not_editable";
}

export interface FillReport {
  adapterId: string;
  selectorsVersion: string;
  pageKind: PageKind;
  filled: FieldOutcome[];
  skipped: SkippedField[];
  /** Fields the traveler has no saved value for. */
  missing: FieldOutcome[];
  paymentFieldsPresent: boolean;
  /** A cross-origin frame that likely holds the form (the engine can't and won't reach into it). */
  framedForm: boolean;
  passes: number;
  timedOut: boolean;
}

export interface FillOptions {
  pathname: string;
  timeoutMs?: number;
  maxPasses?: number;
}

const PAYMENT_FIELD = "[autocomplete^='cc-'], input[name*='card' i], input[name*='cvc' i], input[name*='cvv' i], input[id*='cardnumber' i], input[data-card-field]";
const NEVER_TOUCH_TYPES = new Set(["hidden", "password", "file", "submit", "button", "reset", "image", "checkbox", "radio"]);

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isControl(element: Element | null): element is Control {
  if (!element) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function isVisible(element: Element): boolean {
  if (element.closest("[hidden], [aria-hidden='true'], [inert]")) return false;
  const view = element.ownerDocument.defaultView;
  for (let node: Element | null = element; node; node = node.parentElement) {
    const style = view?.getComputedStyle(node);
    if (style && (style.display === "none" || style.visibility === "hidden")) return false;
  }
  return true;
}

function isPaymentField(element: Element): boolean {
  return element.matches(PAYMENT_FIELD);
}

function editable(element: Control): boolean {
  if (element.disabled) return false;
  if (element instanceof element.ownerDocument.defaultView!.HTMLInputElement) {
    if (NEVER_TOUCH_TYPES.has(element.type) || element.readOnly) return false;
  }
  if (element instanceof element.ownerDocument.defaultView!.HTMLTextAreaElement && element.readOnly) return false;
  return !isPaymentField(element);
}

function find(doc: Document, rule: FieldRule, used: Set<Element>): { element: Control | null; editable: boolean } {
  let blocked = false;
  for (const selector of rule.selectors) {
    let matches: Element[];
    try { matches = Array.from(doc.querySelectorAll(selector)); } catch { continue; }
    for (const element of matches) {
      if (!isControl(element) || used.has(element) || !isVisible(element)) continue;
      if (!editable(element)) { blocked = true; continue; }
      return { element, editable: true };
    }
  }
  return { element: null, editable: !blocked };
}

/** Sets a value the way a person typing would be seen by framework-controlled inputs. */
export function setValueLikeUser(element: Control, value: string): void {
  const win = element.ownerDocument.defaultView!;
  const proto = element instanceof win.HTMLTextAreaElement ? win.HTMLTextAreaElement.prototype : element instanceof win.HTMLSelectElement ? win.HTMLSelectElement.prototype : win.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  element.focus({ preventScroll: true });
  if (setter) setter.call(element, value); else element.value = value;
  element.dispatchEvent(new win.Event("input", { bubbles: true }));
  element.dispatchEvent(new win.Event("change", { bubbles: true }));
  // A background tab has no system focus, so blur() wouldn't fire; validators that run on blur still need it.
  if (element.ownerDocument.hasFocus() && element.ownerDocument.activeElement === element) element.blur();
  else { element.dispatchEvent(new win.FocusEvent("blur")); element.dispatchEvent(new win.FocusEvent("focusout", { bubbles: true })); }
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  "united states": ["us", "usa", "united states of america", "u.s.", "u.s.a."],
  "united kingdom": ["gb", "uk", "great britain", "britain"],
};

function norm(value: string): string {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function chooseOption(select: HTMLSelectElement, value: string, match: FieldRule["match"]): string | null {
  const options = Array.from(select.options).filter((option) => !option.disabled);
  const wanted = norm(value);
  const by = (test: (option: HTMLOptionElement) => boolean) => options.find(test)?.value ?? null;
  switch (match) {
    case "hour": {
      const hour = Number(value);
      return by((option) => Number(option.value) === hour) ?? by((option) => new RegExp(`^${hour}(:00)?\\b`).test(option.text.trim()));
    }
    case "dial-code": {
      const digits = value.replace(/\D/g, "");
      return by((option) => option.value.replace(/\D/g, "") === digits && digits.length > 0) ?? by((option) => new RegExp(`\\+${digits}\\b`).test(option.text));
    }
    case "country": {
      const names = new Set([wanted, ...(COUNTRY_ALIASES[wanted] ?? [])]);
      for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) if (aliases.includes(wanted)) { names.add(canonical); aliases.forEach((alias) => names.add(alias)); }
      return by((option) => names.has(norm(option.text)) || names.has(norm(option.value)));
    }
    case "text":
      return by((option) => norm(option.text) === wanted);
    default:
      return by((option) => norm(option.value) === wanted) ?? by((option) => norm(option.text) === wanted);
  }
}

export function detectPage(adapter: Adapter, doc: Document, pathname: string): PageKind {
  for (const rule of adapter.pages) {
    if (rule.path && !rule.path.test(pathname)) continue;
    if (rule.marker && !rule.marker.some((selector) => { try { return Boolean(doc.querySelector(selector)); } catch { return false; } })) continue;
    return rule.kind;
  }
  return "unknown";
}

function hasForeignFrame(doc: Document): boolean {
  const origin = doc.location?.origin;
  return Array.from(doc.querySelectorAll("iframe")).some((frame) => {
    try { return new URL(frame.src, doc.baseURI).origin !== origin && isVisible(frame); } catch { return false; }
  });
}

/** One pass over the adapter's field map. Returns how many fields were newly filled. */
function fillPass(doc: Document, adapter: Adapter, values: Partial<Record<FieldKey, string>>, state: { done: Set<number>; used: Set<Element>; filled: FieldOutcome[]; skipped: Map<number, SkippedField> }): number {
  let count = 0;
  adapter.fields.forEach((rule, index) => {
    if (state.done.has(index)) return;
    const value = values[rule.key];
    if (!value) return;
    const label = FIELD_LABELS[rule.key];
    const { element, editable: canEdit } = find(doc, rule, state.used);
    if (!element) {
      state.skipped.set(index, { key: rule.key, label, reason: canEdit ? "not_found" : "not_editable" });
      return;
    }
    state.used.add(element);
    state.done.add(index);
    state.skipped.delete(index);
    const win = doc.defaultView!;
    if (element instanceof win.HTMLSelectElement) {
      const option = chooseOption(element, value, rule.match);
      if (option === null) { state.skipped.set(index, { key: rule.key, label, reason: "no_matching_option" }); return; }
      if (element.value && element.selectedIndex > 0 && element.value !== option) { state.skipped.set(index, { key: rule.key, label, reason: "kept_existing" }); return; }
      setValueLikeUser(element, option);
    } else {
      if (element.value.trim()) { state.skipped.set(index, { key: rule.key, label, reason: "kept_existing" }); return; }
      setValueLikeUser(element, value);
    }
    state.filled.push({ key: rule.key, label });
    count += 1;
  });
  return count;
}

/**
 * Fills the current page. Resolves once every field with a value is handled,
 * the pass limit is reached, or the timeout elapses — whichever comes first.
 */
export function fillPage(doc: Document, adapter: Adapter, values: Partial<Record<FieldKey, string>>, options: FillOptions): Promise<FillReport> {
  const timeoutMs = options.timeoutMs ?? adapter.timeoutMs;
  const maxPasses = options.maxPasses ?? adapter.maxPasses;
  const state = { done: new Set<number>(), used: new Set<Element>(), filled: [] as FieldOutcome[], skipped: new Map<number, SkippedField>() };
  const wanted = adapter.fields.map((rule, index) => ({ rule, index })).filter(({ rule }) => Boolean(values[rule.key]));
  const missing = [...new Set(adapter.fields.filter((rule) => !values[rule.key] && !rule.optional).map((rule) => rule.key))].map((key) => ({ key, label: FIELD_LABELS[key] }));
  let passes = 0;

  const report = (timedOut: boolean): FillReport => {
    const pageKind = detectPage(adapter, doc, options.pathname);
    return {
      adapterId: adapter.id,
      selectorsVersion: adapter.selectorsVersion,
      pageKind,
      filled: state.filled,
      skipped: [...state.skipped.values()],
      missing,
      paymentFieldsPresent: Boolean(doc.querySelector(PAYMENT_FIELD)),
      framedForm: state.filled.length === 0 && hasForeignFrame(doc),
      passes,
      timedOut,
    };
  };

  const kind = detectPage(adapter, doc, options.pathname);
  // Nothing to fill on search, product, payment or confirmation pages.
  if (kind !== "details" && kind !== "unknown") return Promise.resolve(report(false));

  const complete = () => wanted.every(({ index }) => state.done.has(index));
  const run = () => { passes += 1; fillPass(doc, adapter, values, state); };
  run();
  if (complete() || passes >= maxPasses) return Promise.resolve(report(false));

  return new Promise((resolve) => {
    const win = doc.defaultView!;
    let settled = false;
    let scheduled = false;
    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      win.clearTimeout(timer);
      resolve(report(timedOut));
    };
    const observer = new win.MutationObserver(() => {
      if (scheduled || settled) return;
      scheduled = true;
      // Let the framework finish rendering the batch before filling.
      win.setTimeout(() => {
        scheduled = false;
        if (settled) return;
        run();
        if (complete() || passes >= maxPasses) finish(false);
      }, 50);
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    const timer = win.setTimeout(() => finish(true), timeoutMs);
  });
}

import type { ViewContext } from "../assistant.ts";
import { h, announce, append, nextId } from "../dom.ts";
import { send, copyText } from "../api.ts";
import { adapterFor } from "../../adapters/index.ts";
import { adapterFieldKeys } from "../../adapters/types.ts";
import { FIELD_LABELS, PASSPORT_FIELDS, resolveFields, type FieldKey } from "../../profile/fields.ts";
import type { BookingSession, SessionItem } from "../../session/manager.ts";
import { partnerById } from "../../shared/partners.ts";
import { STATUS_LABELS, STATUS_TONE } from "../../shared/status.ts";
import type { PassportRecord, Profile } from "../../profile/types.ts";
import { isUnlocked, readPassports, unlockVault } from "../state.ts";

const TYPE_LABELS: Record<SessionItem["type"], string> = { hotel: "Stay", flight: "Flight", experience: "Activity", restaurant: "Dinner" };

// Fields offered as copy buttons where a partner has no adapter (or it's switched off).
const COPY_FIELDS: Record<SessionItem["type"], FieldKey[]> = {
  hotel: ["lead.firstName", "lead.lastName", "contact.email", "contact.phone", "contact.addressLine1", "contact.city", "contact.postalCode", "contact.country", "stay.arrivalTime", "stay.specialRequests", "stay.hotelLoyalty"],
  flight: ["lead.firstName", "lead.middleName", "lead.lastName", "lead.dateOfBirth", "contact.email", "contact.phone"],
  experience: ["lead.firstName", "lead.lastName", "contact.email", "contact.phone", "activity.comments"],
  restaurant: ["lead.firstName", "lead.lastName", "contact.phone", "contact.email", "dining.specialRequests"],
};

function day(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "";
}

function fieldsFor(item: SessionItem): FieldKey[] {
  const adapter = item.autofill ? adapterFor(item.partnerId) : null;
  return adapter ? adapterFieldKeys(adapter).filter((key) => !PASSPORT_FIELDS.has(key)) : COPY_FIELDS[item.type];
}

function pill(item: SessionItem): HTMLElement {
  return h("span", { class: `pill ${STATUS_TONE[item.status]}` }, STATUS_LABELS[item.status]);
}

function copyPanel(item: SessionItem, profile: Profile | null): HTMLElement | null {
  if (!profile) return null;
  const keys = [...new Set([...fieldsFor(item), ...COPY_FIELDS[item.type]])];
  const values = resolveFields(profile, keys);
  const rows = keys.filter((key) => values[key]);
  if (!rows.length) return null;
  return h("details", { class: "copy" },
    h("summary", null, `Copy my details for ${item.partnerName}`),
    h("div", { class: "copy-list" }, rows.map((key) => {
      const button = h("button", { type: "button", class: "btn btn-quiet", "aria-label": `Copy ${FIELD_LABELS[key]}` }, "Copy");
      button.addEventListener("click", async () => {
        const ok = await copyText(values[key] ?? "");
        button.textContent = ok ? "Copied" : "Couldn't copy";
        announce(ok ? `${FIELD_LABELS[key]} copied` : "Copy failed");
        window.setTimeout(() => { button.textContent = "Copy"; }, 1600);
      });
      return h("div", { class: "copy-row" }, h("span", null, h("span", { class: "subtle" }, `${FIELD_LABELS[key]}: `), values[key] ?? ""), button);
    })),
  );
}

async function askPassportConsent(partner: string, profile: Profile, mode: string): Promise<PassportRecord[] | null> {
  const dialog = h("dialog", { class: "dialog", "aria-labelledby": "pp-title" });
  const error = h("p", { class: "error-text", role: "alert" });
  const passphrase = h("input", { type: "password", autocomplete: "current-password", id: "pp-pass", minLength: 10 });
  const needsUnlock = mode === "encrypted" && !isUnlocked();
  return new Promise((resolve) => {
    const close = (value: PassportRecord[] | null) => { dialog.close(); dialog.remove(); resolve(value); };
    dialog.append(h("form", { class: "inner stack", method: "dialog", on: { submit: async (event: Event) => {
      event.preventDefault();
      try {
        if (needsUnlock) await unlockVault(passphrase.value);
        const ids = new Set(profile.travelers.map((traveler) => traveler.id));
        const records = await readPassports({ passportMode: mode } as never, ids);
        close(records ?? []);
      } catch (failure) { error.textContent = failure instanceof Error ? failure.message : "Couldn't unlock."; }
    } } },
      h("h2", { id: "pp-title", class: "title" }, `Fill passport details on ${partner}?`),
      h("p", { class: "small muted" }, "The passport number, issuing country and expiry date for each traveler will be typed into this page only. They are not sent to GlobTrek, and the assistant won't submit anything."),
      needsUnlock ? h("label", { class: "field", htmlFor: "pp-pass" }, h("span", { class: "label" }, "Passport passphrase"), passphrase) : null,
      error,
      h("div", { class: "row" },
        h("button", { type: "submit", class: "btn btn-primary" }, "Fill passport details"),
        h("button", { type: "button", class: "btn btn-secondary", on: { click: () => close(null) } }, "Not this time"),
      ),
    ));
    document.body.append(dialog);
    dialog.showModal();
  });
}

async function requestAccess(partnerIds: string[]): Promise<boolean> {
  const origins = [...new Set(partnerIds.flatMap((id) => partnerById(id as never).originPatterns))];
  if (!origins.length) return true;
  try {
    if (await chrome.permissions.contains({ origins })) return true;
    return await chrome.permissions.request({ origins });
  } catch {
    return false;
  }
}

export async function renderSession({ root, state, navigate }: ViewContext, sessionId: string): Promise<() => void> {
  const body = h("div", { class: "stack-lg", "aria-busy": "true" }, h("h1", { class: "sr-only" }, "Your trip"), h("p", { class: "muted" }, h("span", { class: "spinner", "aria-hidden": "true" }), " Loading your trip…"));
  root.append(body);
  let session: BookingSession | null = null;
  let message = "";

  const act = async (work: () => Promise<{ ok: boolean; error?: string; session?: BookingSession }>, done?: string) => {
    const response = await work();
    if (!response.ok) { message = response.error ?? "Something went wrong."; announce(message); }
    else { message = ""; if (response.session) session = response.session; if (done) announce(done); }
    draw();
  };

  const openItems = async (ids: string[]) => {
    // Ask Chrome for site access first, inside the click, as Chrome requires.
    const partners = [...new Set((session?.items ?? []).filter((item) => ids.includes(item.id) && item.autofill && !item.fixture).map((item) => item.partnerId))];
    if (partners.length) await requestAccess(partners);
    await act(() => send({ type: "UI_OPEN_ITEMS", sessionId, itemIds: ids }), ids.length > 1 ? `${ids.length} tabs opened` : "Tab opened");
  };

  const fill = async (item: SessionItem) => {
    if (!item.fixture && item.autofill) await requestAccess([item.partnerId]);
    let passports: PassportRecord[] | undefined;
    const adapter = adapterFor(item.partnerId);
    if (adapter && state.profile && state.settings.passportMode !== "off" && adapterFieldKeys(adapter).some((key) => PASSPORT_FIELDS.has(key))) {
      passports = (await askPassportConsent(item.partnerName, state.profile, state.settings.passportMode)) ?? undefined;
    }
    await act(() => send({ type: "UI_FILL_ITEM", sessionId, itemId: item.id, ...(passports ? { passports } : {}) }), "Fill finished");
  };

  function itemRow(item: SessionItem): HTMLElement {
    const notOpened = item.status === "not_started" || item.tabId === null;
    const detailId = nextId("detail");
    const when = [day(item.date), item.time].filter(Boolean).join(" · ");
    return h("li", { class: "item", dataset: { item: item.id } },
      h("div", null,
        h("div", { class: "row", style: "gap: 10px" }, h("span", { class: "micro" }, TYPE_LABELS[item.type]), pill(item)),
        h("p", { class: "item-name" }, item.name),
        h("p", { class: "subtle", id: detailId }, `on ${item.partnerName}${when ? ` · ${when}` : ""}${item.affiliate ? " · GlobTrek affiliate link" : ""}`),
      ),
      h("div", { class: "item-actions" },
        notOpened
          ? h("button", { type: "button", class: "btn btn-primary btn-sm", "aria-describedby": detailId, on: { click: () => openItems([item.id]) } }, `Open ${item.partnerName}`)
          : h("button", { type: "button", class: "btn btn-secondary btn-sm", "aria-describedby": detailId, on: { click: () => act(() => send({ type: "UI_FOCUS_ITEM", sessionId, itemId: item.id })) } }, "Go to tab"),
        item.autofill && !notOpened && item.status !== "user_complete"
          ? h("button", { type: "button", class: "btn btn-secondary btn-sm", "aria-describedby": detailId, on: { click: () => fill(item) } }, item.status === "filling" ? "Filling…" : "Fill this page")
          : null,
        h("button", { type: "button", class: "btn btn-quiet", "aria-pressed": item.status === "user_complete" ? "true" : "false", on: { click: () => act(() => send({ type: "UI_MARK_COMPLETE", sessionId, itemId: item.id, complete: item.status !== "user_complete" }), item.status === "user_complete" ? "Marked not booked" : "Marked booked") } }, item.status === "user_complete" ? "Undo booked" : "I've booked this"),
      ),
      h("div", { class: "item-detail" },
        item.note ? h("p", { class: `small ${item.status === "needs_attention" || item.status === "failed_safely" ? "notice warn" : "muted"}` }, item.note) : null,
        !item.autofill && item.autofillNote && item.note !== item.autofillNote ? h("p", { class: "subtle" }, item.autofillNote) : null,
        item.filled.length ? h("div", null, h("p", { class: "micro", style: "margin: 10px 0 0" }, "Filled"), h("ul", { class: "chips filled" }, item.filled.map((label) => h("li", null, label)))) : null,
        item.needsManual.length ? h("div", null, h("p", { class: "micro", style: "margin: 10px 0 0" }, "Needs you"), h("ul", { class: "chips manual" }, item.needsManual.map((label) => h("li", null, label)))) : null,
        item.status === "ready_to_pay" ? h("p", { class: "notice small", style: "margin-top: 10px" }, h("strong", null, "Review and pay on the partner site."), " Chrome can fill your saved card there; GlobTrek never sees it.") : null,
        copyPanel(item, state.profile),
      ),
    );
  }

  function preflight(current: BookingSession): HTMLElement {
    const fillable = current.items.filter((item) => item.autofill);
    const keys = current.requiredFields.filter((key) => !PASSPORT_FIELDS.has(key));
    const values = state.profile ? resolveFields(state.profile, keys) : {};
    const partners = [...new Set(fillable.map((item) => item.partnerName))];
    const copyOnly = [...new Set(current.items.filter((item) => !item.autofill).map((item) => item.partnerName))];
    return h("section", { class: "panel panel-raised stack", "aria-labelledby": "preflight" },
      h("h2", { id: "preflight", class: "title" }, "Before anything opens"),
      partners.length
        ? h("p", { class: "small muted" }, `These details will be typed into ${partners.join(", ")} — only on pages you open, and only into the form you're looking at:`)
        : h("p", { class: "small muted" }, "None of this trip's partners allow automated filling, so nothing will be typed for you. Each booking opens with GlobTrek's exact link, and copy buttons put your details one click away."),
      partners.length ? h("dl", { class: "grid-2 small", style: "margin: 0" }, keys.map((key) => h("div", null,
        h("dt", { class: "subtle" }, FIELD_LABELS[key]),
        h("dd", { style: "margin: 2px 0 0" }, values[key] ? values[key] : h("span", { class: "subtle" }, "Not in your profile — left blank")),
      ))) : null,
      copyOnly.length ? h("p", { class: "small" }, h("strong", null, "Copy buttons only: "), copyOnly.join(", "), ". Nothing is sent to these sites by the assistant.") : null,
      partners.length && current.items.some((item) => item.autofill && !item.fixture) ? h("p", { class: "notice small" }, `Chrome will ask to let the assistant "read and change your data" on ${partners.join(", ")}. It needs that to type into those checkout forms. It never reads card fields, never submits, and you can remove access in chrome://extensions at any time.`) : null,
      h("p", { class: "subtle" }, "Never filled: card numbers, security codes, passwords, one-time codes, or terms checkboxes."),
    );
  }

  function draw(): void {
    // Re-rendering replaces the buttons; put keyboard focus back where it was.
    const active = document.activeElement as HTMLElement | null;
    const focusItem = active?.closest<HTMLElement>("[data-item]")?.dataset.item;
    const focusIndex = focusItem && active ? Array.from(active.closest("[data-item]")!.querySelectorAll("button, a, summary")).indexOf(active) : -1;
    body.removeAttribute("aria-busy");
    body.replaceChildren();
    window.queueMicrotask(() => {
      if (!focusItem || focusIndex < 0) return;
      const row = body.querySelector<HTMLElement>(`[data-item="${CSS.escape(focusItem)}"]`);
      const controls = row ? Array.from(row.querySelectorAll<HTMLElement>("button, a, summary")) : [];
      (controls[focusIndex] ?? controls[0])?.focus({ preventScroll: true });
    });
    if (!session) {
      body.append(h("div", { class: "empty stack" },
        h("h1", { class: "title" }, "This trip isn't here anymore"),
        h("p", { class: "muted" }, "It may have been finished or erased. Go back to GlobTrek and choose Book my trip again."),
        h("a", { class: "btn btn-secondary", href: "#/" }, "See your trips"),
      ));
      return;
    }
    const current = session;
    const { trip } = current;
    const travelers = trip.travelers.adults + trip.travelers.children + trip.travelers.infants;
    const done = current.items.filter((item) => item.status === "user_complete").length;
    const next = current.items.find((item) => item.status === "not_started");
    const started = current.items.some((item) => item.status !== "not_started");

    append(body, [
      h("div", { class: "stack" },
        h("p", { class: "eyebrow" }, "Book your trip"),
        h("h1", { class: "display" }, trip.destination.city, trip.destination.country ? h("span", { class: "muted" }, `, ${trip.destination.country}`) : null),
        h("p", { class: "tabular muted" }, [trip.dates.start && trip.dates.end ? `${day(trip.dates.start)} – ${day(trip.dates.end)}` : null, `${travelers} traveler${travelers === 1 ? "" : "s"}`, `${current.items.length} booking${current.items.length === 1 ? "" : "s"}`].filter(Boolean).join(" · ")),
        h("div", { class: "progress-line", role: "progressbar", "aria-label": "Bookings marked complete", "aria-valuemin": "0", "aria-valuemax": String(current.items.length), "aria-valuenow": String(done) }, h("div", { style: `width: ${(done / current.items.length) * 100}%` })),
        h("p", { class: "subtle tabular", "aria-live": "polite" }, `${done} of ${current.items.length} marked booked`),
      ),
      message ? h("p", { class: "notice danger", role: "alert" }, message) : h("span"),
      !state.profile ? h("section", { class: "panel stack" },
        h("h2", { class: "title" }, "Add your details once"),
        h("p", { class: "muted small" }, "The assistant needs your name and contact details to help at checkout. They stay on this device."),
        h("a", { class: "btn btn-primary", href: `#/profile/return-${current.id}` }, "Add my details"),
      ) : null,
      started ? null : preflight(current),
      started ? null : h("section", { class: "stack", "aria-labelledby": "how" },
        h("h2", { id: "how", class: "micro" }, "How would you like to open them?"),
        h("div", { class: "choices" },
          h("button", { type: "button", class: "choice", on: { click: async () => { await act(() => send({ type: "UI_SET_MODE", sessionId, mode: "guided" })); if (next) await openItems([next.id]); } } },
            h("strong", null, "Guide me one at a time", h("span", { class: "tag" }, "Recommended")),
            h("span", { class: "small muted" }, `Opens ${next ? next.partnerName : "the first booking"} now. Finish it, then come back for the next.`),
          ),
          h("button", { type: "button", class: "choice", on: { click: async () => { await act(() => send({ type: "UI_SET_MODE", sessionId, mode: "all" })); await openItems(current.items.filter((item) => item.status === "not_started").map((item) => item.id)); } } },
            h("strong", null, "Open everything"),
            h("span", { class: "small muted" }, `Opens all ${current.items.length} bookings in their own tabs at once.`),
          ),
        ),
      ),
      started && current.mode === "guided" && next ? h("div", { class: "panel row between" },
        h("p", { style: "margin: 0" }, h("span", { class: "micro" }, "Next up  "), h("strong", null, next.name), h("span", { class: "subtle" }, ` on ${next.partnerName}`)),
        h("button", { type: "button", class: "btn btn-primary btn-sm", on: { click: () => openItems([next.id]) } }, `Open ${next.partnerName} →`),
      ) : null,
      h("section", { "aria-labelledby": "list-heading" },
        h("h2", { id: "list-heading", class: "micro", style: "margin-bottom: 12px" }, "Your bookings"),
        h("ol", { class: "items" }, current.items.map((item) => itemRow(item))),
      ),
      h("p", { class: "subtle" }, "Prices, availability and terms are shown and confirmed by each partner. Seats, meals and bags are preferences until the airline confirms them. GlobTrek may earn a commission on bookings made through its links; your price doesn't change."),
      h("div", { class: "row" },
        h("button", { type: "button", class: "btn btn-quiet", on: { click: async () => { await send({ type: "UI_END_SESSION", sessionId }); navigate("#/"); } } }, "End and erase this trip checklist"),
      ),
    ]);
  }

  const load = async () => {
    const response = await send({ type: "UI_GET_SESSIONS" });
    session = response.ok ? response.sessions?.find((entry) => entry.id === sessionId) ?? null : null;
    draw();
  };
  await load();
  const listener = () => { void load(); };
  window.addEventListener("globtrek:sessions", listener);
  return () => window.removeEventListener("globtrek:sessions", listener);
}

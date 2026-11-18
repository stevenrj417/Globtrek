import type { ViewContext } from "../assistant.ts";
import { h, announce, nextId } from "../dom.ts";
import { areas, saveProfile } from "../state.ts";
import { emptyProfile, emptyTraveler, type Profile, type Traveler, type TravelerType } from "../../profile/types.ts";
import { PaymentDataError } from "../../security/payment-guard.ts";

// The traveler details: only what a partner form actually asks for (names, email,
// phone and an optional note). Saved locally and used for every booking.

interface FieldOptions {
  type?: string;
  autocomplete?: string;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
}

function input(label: string, value: string, onInput: (value: string) => void, options: FieldOptions = {}): HTMLElement {
  const id = nextId("f");
  const hintId = options.hint ? `${id}-hint` : undefined;
  return h("label", { class: "field", htmlFor: id },
    h("span", { class: "label" }, label),
    h("input", { id, type: options.type ?? "text", value, autocomplete: options.autocomplete ?? "off", placeholder: options.placeholder, maxLength: options.maxLength ?? 120, "aria-describedby": hintId, on: { input: (event: Event) => onInput((event.target as HTMLInputElement).value) } }),
    options.hint ? h("span", { class: "hint", id: hintId }, options.hint) : null,
  );
}

function textarea(label: string, value: string, onInput: (value: string) => void, hint: string): HTMLElement {
  const id = nextId("f");
  return h("label", { class: "field", htmlFor: id },
    h("span", { class: "label" }, label),
    h("textarea", { id, value, maxLength: 500, "aria-describedby": `${id}-hint`, on: { input: (event: Event) => onInput((event.target as HTMLTextAreaElement).value) } }),
    h("span", { class: "hint", id: `${id}-hint` }, hint),
  );
}

function select<T extends string>(label: string, value: T, options: [T, string][], onChange: (value: T) => void): HTMLElement {
  const id = nextId("f");
  return h("label", { class: "field", htmlFor: id },
    h("span", { class: "label" }, label),
    h("select", { id, on: { change: (event: Event) => onChange((event.target as HTMLSelectElement).value as T) } },
      options.map(([optionValue, text]) => h("option", { value: optionValue, selected: optionValue === value }, text))),
  );
}

export async function renderProfile({ root, state, navigate }: ViewContext, param: string): Promise<null> {
  const draft: Profile = structuredClone(state.profile ?? emptyProfile());
  const returnTo = param.startsWith("return-") ? param.slice("return-".length) : null;
  const statusLine = h("p", { class: "small", role: "status", "aria-live": "polite" });
  const travelers = h("div", { class: "stack-lg" });

  const save = async () => {
    try {
      const saved = await saveProfile(areas, draft);
      state.profile = saved;
      const status = state.settings.storageMode === "device" ? "Saved on this device." : "Saved for this browser session only.";
      statusLine.textContent = status;
      statusLine.className = "small";
      announce(status);
      if (returnTo) navigate(`#/session/${returnTo}`);
    } catch (error) {
      statusLine.textContent = error instanceof PaymentDataError ? error.message : "Couldn't save. Check the highlighted fields.";
      statusLine.className = "small error-text";
    }
  };

  function travelerFields(traveler: Traveler, position: number): HTMLElement {
    const isLead = traveler.id === draft.leadTravelerId;
    return h("fieldset", { class: "stack" },
      h("legend", null, isLead ? "You" : `Traveler ${position + 1}`),
      h("div", { class: "grid-2" },
        input("First name", traveler.legalFirstName, (value) => { traveler.legalFirstName = value; }, { autocomplete: isLead ? "given-name" : "off", hint: "As on the ID you'll travel with." }),
        input("Last name", traveler.legalLastName, (value) => { traveler.legalLastName = value; }, { autocomplete: isLead ? "family-name" : "off" }),
        isLead ? null : select<TravelerType>("Age", traveler.type, [["adult", "Adult"], ["child", "Child (2–11)"], ["infant", "Infant (under 2)"]], (value) => { traveler.type = value; }),
      ),
      isLead ? null : h("div", null, h("button", { type: "button", class: "btn btn-quiet", on: { click: () => {
        draft.travelers = draft.travelers.filter((entry) => entry.id !== traveler.id);
        draft.groups.forEach((group) => { group.travelerIds = group.travelerIds.filter((id) => id !== traveler.id); });
        drawTravelers();
      } } }, "Remove")),
    );
  }

  function drawTravelers(): void {
    const ordered = [...draft.travelers].sort((a, b) => Number(b.id === draft.leadTravelerId) - Number(a.id === draft.leadTravelerId));
    travelers.replaceChildren(...ordered.map(travelerFields));
  }

  const c = draft.contact;
  root.append(h("div", { class: "stack-lg", style: "max-width: 720px" },
    h("div", { class: "stack" },
      h("p", { class: "eyebrow" }, "My details"),
      h("h1", { class: "display" }, "Enter it once."),
      h("p", { class: "muted", style: "max-width: 58ch" }, state.settings.storageMode === "device"
        ? "Just what a booking form asks for. Saved on this computer only: no GlobTrek account, nothing uploaded."
        : "Just what a booking form asks for. Kept for this browser session, then forgotten."),
    ),
    travelers,
    h("div", null, h("button", { type: "button", class: "btn btn-secondary btn-sm", on: { click: () => { draft.travelers.push(emptyTraveler("adult")); drawTravelers(); } } }, "Add a traveler")),
    h("fieldset", { class: "stack" },
      h("legend", null, "How partners reach you"),
      h("div", { class: "grid-2" },
        input("Email", c.email, (value) => { c.email = value; }, { type: "email", autocomplete: "email" }),
        h("div", { class: "row", style: "align-items: flex-start; flex-wrap: nowrap" },
          h("div", { style: "width: 84px; flex: none" }, input("Code", c.phoneCountryCode, (value) => { c.phoneCountryCode = value; }, { placeholder: "+1", autocomplete: "tel-country-code", maxLength: 5 })),
          h("div", { style: "flex: 1" }, input("Phone", c.phoneNumber, (value) => { c.phoneNumber = value; }, { type: "tel", autocomplete: "tel-national", maxLength: 25 })),
        ),
      ),
    ),
    h("fieldset", { class: "stack" },
      h("legend", null, "Requests · optional"),
      textarea("Anything partners should know", draft.stay.specialRequests, (value) => { draft.stay.specialRequests = value; }, "A quiet room, a dietary need, step-free access. Partners decide whether they can meet it."),
    ),
    h("p", { class: "subtle", style: "margin: 0" }, "Never add card numbers or passwords here. You pay on the partner's own checkout."),
    h("div", { class: "row", style: "position: sticky; bottom: 0; background: var(--bg); padding: 14px 0; border-top: 1px solid var(--border)" },
      h("button", { type: "button", class: "btn btn-primary", on: { click: save } }, returnTo ? "Save and return to my trip" : "Save my details"),
      statusLine,
    ),
  ));
  drawTravelers();
  return null;
}

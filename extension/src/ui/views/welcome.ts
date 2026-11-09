import type { ViewContext } from "../assistant.ts";
import { h, announce } from "../dom.ts";
import { saveSettings, areas } from "../state.ts";
import type { StorageMode } from "../../profile/types.ts";

// First run. Explains, in plain language, what the assistant does and never does,
// and asks where the traveler's details should live. No account, no sign-in.
export async function renderWelcome({ root, state, navigate }: ViewContext): Promise<null> {
  let mode: StorageMode = state.settings.storageMode;
  let autoFill = state.settings.autoFill;

  const choice = (value: StorageMode, title: string, body: string, tag?: string) => h("label", { class: "choice" },
    h("input", { type: "radio", name: "storage", value, checked: mode === value, on: { change: () => { mode = value; } } }),
    h("strong", null, title, tag ? h("span", { class: "tag" }, tag) : null),
    h("span", { class: "small muted" }, body),
  );

  root.append(h("div", { class: "stack-lg" },
    h("div", { class: "stack" },
      h("p", { class: "eyebrow" }, "GlobTrek Booking Assistant"),
      h("h1", { class: "display" }, "Your trip, booked from one tab."),
      h("p", { class: "muted", style: "max-width: 60ch" }, "Plan on GlobTrek, then let the assistant open each booking on the partner's site and fill in your details where the partner allows it. You review and pay on the partner's site — the assistant stops before anything is booked."),
    ),
    h("div", { class: "grid-2" },
      h("section", { class: "panel", "aria-labelledby": "does" },
        h("h2", { id: "does", class: "micro" }, "What it does"),
        h("ol", { class: "steps", style: "margin-top: 14px" },
          h("li", null, "Shows exactly which details it will use and which sites will receive them."),
          h("li", null, "Opens your stay, flight, activities and dinners in their own tabs, using GlobTrek's exact links."),
          h("li", null, "Fills your name and contact details on partners that allow it, and gives you copy buttons everywhere else."),
          h("li", null, "Keeps a checklist of what's opened, filled, needs you, or is ready to pay."),
        ),
      ),
      h("section", { class: "panel", "aria-labelledby": "never" },
        h("h2", { id: "never", class: "micro" }, "What it never does"),
        h("ul", { class: "small", style: "margin: 14px 0 0; padding-left: 18px; line-height: 1.8" },
          h("li", null, "Book, reserve, confirm or pay for you"),
          h("li", null, "Accept terms or declarations on your behalf"),
          h("li", null, "Store or read card numbers, CVV codes or bank logins"),
          h("li", null, "Store partner passwords or one-time codes"),
          h("li", null, "Send your details to GlobTrek, analytics or anyone else"),
          h("li", null, "Run on sites you haven't allowed"),
        ),
      ),
    ),
    h("fieldset", null,
      h("legend", null, "Where should your details live?"),
      h("p", { class: "small muted", style: "margin-top: 0" }, "No GlobTrek account is needed either way. You can change this, export your details, or erase them at any time."),
      h("div", { class: "choices" },
        choice("device", "Save on this device", "Kept in Chrome's storage for this extension on this computer, so next time is faster. Not synced, not uploaded.", "Recommended"),
        choice("once", "Use once and forget", "Held in memory only. Erased when you close Chrome or press Forget — you'll enter details again next trip."),
      ),
      h("label", { class: "check", style: "margin-top: 16px" },
        h("input", { type: "checkbox", checked: autoFill, on: { change: (event: Event) => { autoFill = (event.target as HTMLInputElement).checked; } } }),
        h("span", null, h("strong", null, "Fill automatically when a partner page is ready. "), h("span", { class: "muted" }, "Only on partners you've allowed, and never past the review step. Turn off to fill each page with a click.")),
      ),
    ),
    h("p", { class: "notice small" }, "Extension storage isn't a password manager. Passport storage is optional, off by default, and encrypted with a passphrase only you know if you turn it on."),
    h("div", { class: "row" },
      h("button", { type: "button", class: "btn btn-primary", on: { click: async () => {
        await saveSettings(areas, { ...state.settings, storageMode: mode, autoFill, onboarded: true });
        announce("Saved. Next, add your details.");
        navigate("#/profile");
      } } }, "Continue to my details →"),
      h("a", { class: "btn btn-quiet", href: "https://www.glob-trek.com/booking-assistant/privacy", target: "_blank", rel: "noopener" }, "Read the privacy policy"),
    ),
  ));
  return null;
}

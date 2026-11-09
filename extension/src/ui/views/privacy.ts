import type { ViewContext } from "../assistant.ts";
import { h, announce } from "../dom.ts";
import { areas, removeAllPassports, saveSettings, lockVault } from "../state.ts";
import { exportData, forgetEverything, loadVault } from "../../profile/store.ts";
import { storedFieldSummary } from "../../profile/fields.ts";
import { PARTNERS } from "../../shared/partners.ts";
import type { PassportMode, StorageMode } from "../../profile/types.ts";

function confirmDialog(title: string, body: string, action: string): Promise<boolean> {
  const dialog = h("dialog", { class: "dialog", "aria-labelledby": "confirm-title", "aria-describedby": "confirm-body" });
  return new Promise((resolve) => {
    const close = (value: boolean) => { dialog.close(); dialog.remove(); resolve(value); };
    dialog.addEventListener("cancel", () => close(false));
    dialog.append(h("div", { class: "inner stack" },
      h("h2", { id: "confirm-title", class: "title" }, title),
      h("p", { id: "confirm-body", class: "small muted" }, body),
      h("div", { class: "row" },
        h("button", { type: "button", class: "btn btn-danger", on: { click: () => close(true) } }, action),
        h("button", { type: "button", class: "btn btn-secondary", autofocus: true, on: { click: () => close(false) } }, "Cancel"),
      ),
    ));
    document.body.append(dialog);
    dialog.showModal();
  });
}

export async function renderPrivacy({ root, state, refresh }: ViewContext): Promise<null> {
  const summary = storedFieldSummary(state.profile);
  const hasVault = Boolean(await loadVault(areas));
  const granted = (await chrome.permissions.getAll()).origins ?? [];
  const partnerAccess = PARTNERS.filter((partner) => partner.originPatterns.some((pattern) => granted.includes(pattern)));

  const radio = <T extends string>(name: string, value: T, current: T, title: string, body: string, onPick: (value: T) => void) => h("label", { class: "choice" },
    h("input", { type: "radio", name, value, checked: value === current, on: { change: () => onPick(value) } }),
    h("strong", null, title), h("span", { class: "small muted" }, body),
  );

  const setStorage = async (storageMode: StorageMode) => { await saveSettings(areas, { ...state.settings, storageMode }); announce(storageMode === "device" ? "Now saving on this device" : "Now in use-once mode"); await refresh(); };
  const setPassport = async (passportMode: PassportMode) => {
    if (passportMode !== state.settings.passportMode && state.settings.passportMode !== "off" && !(await confirmDialog("Change passport storage?", "Passports stored under the current setting will be deleted.", "Delete and change"))) { await refresh(); return; }
    lockVault();
    await saveSettings(areas, { ...state.settings, passportMode });
    announce("Passport setting saved");
    await refresh();
  };

  root.append(h("div", { class: "stack-lg" },
    h("div", { class: "stack" },
      h("p", { class: "eyebrow" }, "Privacy & data"),
      h("h1", { class: "display" }, "Your details, your device."),
      h("p", { class: "muted", style: "max-width: 62ch" }, "No GlobTrek account. No analytics on your traveler details. Nothing leaves this device unless you open a partner's page and the assistant types your details into it."),
    ),

    h("section", { class: "panel stack", "aria-labelledby": "stored" },
      h("h2", { id: "stored", class: "title" }, "What's stored right now"),
      summary.length
        ? h("ul", { class: "grid-2 small", style: "list-style: none; padding: 0; margin: 18px 0 0" }, summary.map((row) => h("li", null, h("strong", null, row.label), h("span", { class: "subtle" }, row.count > 1 ? ` · ${row.count} travelers` : ""))))
        : h("p", { class: "muted small" }, "No traveler details are stored."),
      h("p", { class: "small" }, h("strong", null, "Passports: "), state.settings.passportMode === "off" ? "off (none stored)" : state.settings.passportMode === "session" ? "this browser session only" : hasVault ? "encrypted on this device" : "encrypted storage on, none saved yet"),
      h("p", { class: "small" }, h("strong", null, "Never stored: "), "card numbers, security codes, bank logins, partner passwords, one-time codes."),
      h("p", { class: "small" }, h("strong", null, "Trip checklists: "), "destination, dates, party size and partner links for trips you started (kept 14 days)."),
    ),

    h("fieldset", { class: "stack" },
      h("legend", null, "Where details live"),
      h("div", { class: "choices" },
        radio("storage", "device", state.settings.storageMode, "Save on this device", "Kept in this extension's Chrome storage on this computer.", setStorage),
        radio("storage", "once", state.settings.storageMode, "Use once and forget", "Memory only; erased when Chrome closes.", setStorage),
      ),
      h("label", { class: "check" }, h("input", { type: "checkbox", checked: state.settings.autoFill, on: { change: async (event: Event) => { await saveSettings(areas, { ...state.settings, autoFill: (event.target as HTMLInputElement).checked }); announce("Saved"); await refresh(); } } }), h("span", null, "Fill automatically when an allowed partner page is ready")),
    ),

    h("fieldset", { class: "stack" },
      h("legend", null, "Passports (optional)"),
      h("div", { class: "choices" },
        radio("passport", "off", state.settings.passportMode, "Off", "Default. Nothing stored.", setPassport),
        radio("passport", "session", state.settings.passportMode, "This session only", "In memory until Chrome closes.", setPassport),
        radio("passport", "encrypted", state.settings.passportMode, "Encrypted on this device", "AES-256 with your passphrase. Auto-locks after inactivity.", setPassport),
      ),
      h("p", { class: "subtle", style: "margin: 0" }, "This is a convenience lock, not a password manager. Passport details are typed into a page only after you confirm for that page, and never into URLs, logs or GlobTrek."),
      h("div", null, h("button", { type: "button", class: "btn btn-danger", on: { click: async () => {
        if (!(await confirmDialog("Delete all passport details?", "Every saved passport record is erased from this device and this session. This can't be undone.", "Delete passports"))) return;
        await removeAllPassports();
        announce("Passport details deleted");
        await refresh();
      } } }, "Delete passport details")),
    ),

    h("section", { class: "panel stack", "aria-labelledby": "access" },
      h("h2", { id: "access", class: "title" }, "Site access"),
      h("p", { class: "small muted" }, "The assistant runs on GlobTrek's own site to show booking status. It can fill forms only on partner sites you've allowed:"),
      partnerAccess.length
        ? h("ul", { class: "small", style: "padding-left: 18px" }, partnerAccess.map((partner) => h("li", null, partner.name, " ", h("button", { type: "button", class: "btn btn-quiet", on: { click: async () => { await chrome.permissions.remove({ origins: [...partner.originPatterns] }); announce(`Access to ${partner.name} removed`); await refresh(); } } }, "Remove access"))))
        : h("p", { class: "small" }, "No partner sites allowed yet."),
    ),

    h("section", { class: "stack", "aria-labelledby": "controls" },
      h("h2", { id: "controls", class: "micro" }, "Export or erase"),
      h("div", { class: "row" },
        h("button", { type: "button", class: "btn btn-secondary", on: { click: async () => {
          const blob = new Blob([JSON.stringify(await exportData(areas), null, 2)], { type: "application/json" });
          const link = h("a", { href: URL.createObjectURL(blob), download: `globtrek-assistant-export-${new Date().toISOString().slice(0, 10)}.json` });
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
          announce("Export saved");
        } } }, "Export my data"),
        h("button", { type: "button", class: "btn btn-danger", on: { click: async () => {
          if (!(await confirmDialog("Forget all my information?", "Your profile, traveling party, groups, preferences, passports, settings and trip checklists are erased from this device. Partner sites keep whatever you submitted to them. This can't be undone.", "Forget everything"))) return;
          lockVault();
          await forgetEverything(areas);
          announce("Everything erased");
          location.hash = "#/welcome";
        } } }, "Forget all my information"),
      ),
      h("p", { class: "subtle" }, "Exports include passports only in encrypted form. To remove the extension entirely, use chrome://extensions — Chrome deletes its storage too."),
    ),
    h("p", { class: "small" }, h("a", { href: "https://www.glob-trek.com/booking-assistant/privacy", target: "_blank", rel: "noopener" }, "Read the full privacy policy ↗")),
  ));
  return null;
}

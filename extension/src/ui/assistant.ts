import { IS_DEV, VERSION } from "../shared/env.ts";
import { h, clear, announce } from "./dom.ts";
import { loadState, startAutoLock, type AppState } from "./state.ts";
import { onSessionsChanged } from "./api.ts";
import { renderWelcome } from "./views/welcome.ts";
import { renderSession } from "./views/session.ts";
import { renderSessions } from "./views/sessions.ts";
import { renderProfile } from "./views/profile.ts";
import { renderPrivacy } from "./views/privacy.ts";

// The full booking-assistant page: onboarding, the trip checklist, the traveler
// profile, and privacy controls. Routes live in the hash so every screen can be
// linked from the popup and from GlobTrek.

export interface ViewContext {
  root: HTMLElement;
  state: AppState;
  navigate: (hash: string) => void;
  refresh: () => Promise<void>;
}

const NAV: [string, string][] = [["#/", "Bookings"], ["#/profile", "My details"], ["#/privacy", "Privacy & data"]];

const app = document.getElementById("app")!;
let state: AppState;
let cleanup: (() => void) | null = null;

function shell(active: string): HTMLElement {
  const main = h("main", { id: "main", tabIndex: -1 });
  clear(app);
  app.append(
    h("a", { href: "#main", class: "sr-only", on: { click: (event: Event) => { event.preventDefault(); main.focus(); } } }, "Skip to content"),
    h("div", { class: "shell" },
      h("header", { class: "topbar" },
        h("a", { class: "wordmark", href: "#/", "aria-label": "GlobTrek Booking Assistant, home" }, h("img", { src: "icons/icon-48.png", alt: "" }), "GlobTrek"),
        h("nav", { "aria-label": "Assistant" }, NAV.map(([href, label]) => h("a", { href, "aria-current": active === href ? "page" : undefined }, label))),
      ),
      main,
      h("footer", { class: "foot" },
        h("span", null, `Booking Assistant ${VERSION}${IS_DEV ? " · development build" : ""}`),
        h("span", null, "Your details stay on this device. GlobTrek never sees your payment details."),
      ),
    ),
  );
  return main;
}

async function route(): Promise<void> {
  cleanup?.();
  cleanup = null;
  state = await loadState();
  const hash = location.hash || "#/";
  if (!state.settings.onboarded && !hash.startsWith("#/welcome") && !hash.startsWith("#/session/")) { location.replace("#/welcome"); return; }
  const [, page = "", param = ""] = hash.split("/");
  const active = page === "profile" ? "#/profile" : page === "privacy" ? "#/privacy" : "#/";
  const root = shell(active);
  const context: ViewContext = {
    root,
    state,
    navigate: (next) => { location.hash = next; },
    refresh: () => route(),
  };
  const titles: Record<string, string> = { welcome: "Welcome", profile: "My details", privacy: "Privacy & data", session: "Your trip" };
  document.title = `${titles[page] ?? "Bookings"} · GlobTrek Booking Assistant`;
  switch (page) {
    case "welcome": cleanup = await renderWelcome(context); break;
    case "session": cleanup = await renderSession(context, param); break;
    case "profile": cleanup = await renderProfile(context, param); break;
    case "privacy": cleanup = await renderPrivacy(context); break;
    default: cleanup = await renderSessions(context);
  }
  // Move focus to the new screen's heading so keyboard and screen-reader users land in context.
  const heading = root.querySelector("h1");
  if (heading) { heading.setAttribute("tabindex", "-1"); (heading as HTMLElement).focus({ preventScroll: true }); announce(heading.textContent ?? ""); }
}

window.addEventListener("hashchange", () => { void route(); });
onSessionsChanged(() => window.dispatchEvent(new CustomEvent("globtrek:sessions")));
void loadState().then((initial) => { startAutoLock(initial.settings.autoLockMinutes); return route(); });

import { h } from "./dom.ts";
import { send } from "./api.ts";
import { STATUS_LABELS, STATUS_TONE } from "../shared/status.ts";
import { loadState } from "./state.ts";

// The toolbar popup: where the current trip stands, and the way into the full assistant.
const app = document.getElementById("app")!;

function open(hash: string): void {
  void chrome.tabs.create({ url: chrome.runtime.getURL(`assistant.html${hash}`) });
  window.close();
}

async function render(): Promise<void> {
  const [{ settings, profile }, response] = await Promise.all([loadState(), send({ type: "UI_GET_SESSIONS" })]);
  const session = response.ok ? response.sessions?.[0] : undefined;
  const main = h("main", { class: "stack" },
    h("div", { class: "row between" },
      h("span", { class: "wordmark" }, h("img", { src: "icons/icon-32.png", alt: "" }), "GlobTrek"),
      h("span", { class: "micro" }, "Booking assistant"),
    ),
    !settings.onboarded
      ? h("div", { class: "stack" }, h("h1", { class: "title" }, "Welcome"), h("p", { class: "small muted" }, "Set up in a minute — no account needed."), h("button", { type: "button", class: "btn btn-primary btn-block", on: { click: () => open("#/welcome") } }, "Get started"))
      : session
        ? h("div", { class: "stack" },
          h("h1", { class: "title" }, session.trip.destination.city),
          h("ul", { class: "items" }, session.items.map((item) => h("li", { class: "item", style: "padding: 12px 0" },
            h("div", null, h("p", { class: "small", style: "margin: 0; font-weight: 500" }, item.name), h("p", { class: "subtle", style: "margin: 0" }, item.partnerName)),
            h("span", { class: `pill ${STATUS_TONE[item.status]}` }, STATUS_LABELS[item.status]),
          ))),
          h("button", { type: "button", class: "btn btn-primary btn-block", on: { click: () => open(`#/session/${session.id}`) } }, "Open trip checklist"),
        )
        : h("div", { class: "stack" }, h("h1", { class: "title" }, "No trip in progress"), h("p", { class: "small muted" }, "Plan on GlobTrek and choose Book my trip."), h("a", { class: "btn btn-secondary btn-block", href: "https://www.glob-trek.com/discover", target: "_blank", rel: "noopener" }, "Plan a trip")),
    h("div", { class: "row between small" },
      h("button", { type: "button", class: "btn btn-quiet", on: { click: () => open("#/profile") } }, profile ? "My details" : "Add my details"),
      h("button", { type: "button", class: "btn btn-quiet", on: { click: () => open("#/privacy") } }, "Privacy & data"),
    ),
  );
  app.replaceChildren(main);
}

void render();

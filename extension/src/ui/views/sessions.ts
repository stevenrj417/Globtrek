import type { ViewContext } from "../assistant.ts";
import { h } from "../dom.ts";
import { send } from "../api.ts";
import { IS_DEV } from "../../shared/env.ts";
import { STATUS_LABELS } from "../../shared/status.ts";

function day(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "";
}

export async function renderSessions({ root, navigate, state }: ViewContext): Promise<() => void> {
  const list = h("div", { "aria-live": "polite" }, h("p", { class: "muted" }, h("span", { class: "spinner", "aria-hidden": "true" }), " Loading your trips…"));
  root.append(h("div", { class: "stack-lg" },
    h("div", { class: "stack" },
      h("p", { class: "eyebrow" }, "Bookings"),
      h("h1", { class: "display" }, "Your trips"),
      !state.profile ? h("p", { class: "notice" }, "You haven't added your details yet. ", h("a", { href: "#/profile" }, "Add them now"), " so the assistant can help at checkout.") : null,
    ),
    list,
  ));

  const draw = async () => {
    const response = await send({ type: "UI_GET_SESSIONS" });
    list.replaceChildren();
    if (!response.ok) { list.append(h("p", { class: "notice danger", role: "alert" }, response.error)); return; }
    const sessions = response.sessions ?? [];
    if (!sessions.length) {
      list.append(h("div", { class: "empty stack" },
        h("p", { class: "title" }, "No trip in progress"),
        h("p", { class: "muted", style: "max-width: 46ch; margin-inline: auto" }, "Plan a trip on GlobTrek and choose Book my trip. It will appear here with every booking ready to open."),
        h("div", { class: "row", style: "justify-content: center" },
          h("a", { class: "btn btn-primary", href: "https://www.glob-trek.com/discover", target: "_blank", rel: "noopener" }, "Plan a trip on GlobTrek"),
          IS_DEV ? h("button", { type: "button", class: "btn btn-secondary", on: { click: async () => { const demo = await send({ type: "UI_DEV_DEMO_SESSION" }); if (demo.ok && demo.sessionId) navigate(`#/session/${demo.sessionId}`); } } }, "Load fixture demo trip (dev)") : null,
        ),
      ));
      return;
    }
    if (IS_DEV) list.append(h("p", { class: "row" },
      h("button", { type: "button", class: "btn btn-quiet", on: { click: async () => { const demo = await send({ type: "UI_DEV_DEMO_SESSION", variant: "fixtures" }); if (demo.ok && demo.sessionId) navigate(`#/session/${demo.sessionId}`); } } }, "Load fixture demo trip (dev)"),
      h("button", { type: "button", class: "btn btn-quiet", on: { click: async () => { const demo = await send({ type: "UI_DEV_DEMO_SESSION", variant: "showcase" }); if (demo.ok && demo.sessionId) navigate(`#/session/${demo.sessionId}`); } } }, "Load showcase trip (dev)"),
    ));
    list.append(h("ul", { class: "items" }, sessions.map((session) => {
      const done = session.items.filter((item) => item.status === "user_complete").length;
      return h("li", { class: "item" },
        h("div", null,
          h("p", { class: "micro" }, [day(session.trip.dates.start), day(session.trip.dates.end)].filter(Boolean).join(" – ") || "Dates open"),
          h("p", { class: "item-name" }, session.trip.destination.city, session.trip.destination.country ? h("span", { class: "muted" }, `, ${session.trip.destination.country}`) : null),
          h("p", { class: "subtle tabular" }, `${done} of ${session.items.length} booked · ${session.items.map((item) => STATUS_LABELS[item.status]).filter((label, index, all) => all.indexOf(label) === index).join(", ")}`),
        ),
        h("div", { class: "item-actions" }, h("a", { class: "btn btn-secondary btn-sm", href: `#/session/${session.id}` }, "Open checklist")),
      );
    })));
  };
  await draw();
  const listener = () => { void draw(); };
  window.addEventListener("globtrek:sessions", listener);
  return () => window.removeEventListener("globtrek:sessions", listener);
}

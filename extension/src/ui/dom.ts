// A tiny element builder for the extension's pages. Text is always set as text
// (never innerHTML), so nothing from a partner, the website or the profile can
// become markup.

type Child = Node | string | number | false | null | undefined;
type Props = Record<string, unknown> & { class?: string; on?: Partial<Record<keyof HTMLElementEventMap, (event: Event) => void>> };

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props | null = null, ...children: (Child | Child[])[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "on") {
        for (const [event, handler] of Object.entries(value as Record<string, EventListener>)) element.addEventListener(event, handler);
      } else if (key === "class") {
        element.className = String(value);
      } else if (key === "dataset") {
        Object.assign(element.dataset, value);
      } else if (key in element && !key.startsWith("aria") && key !== "role" && key !== "for") {
        (element as unknown as Record<string, unknown>)[key] = value;
      } else {
        element.setAttribute(key === "htmlFor" ? "for" : key, value === true ? "" : String(value));
      }
    }
  }
  append(element, children);
  return element;
}

export function append(parent: Node, children: (Child | Child[])[]): void {
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === "string" || typeof child === "number" ? document.createTextNode(String(child)) : child);
  }
}

export function clear(element: Element): void {
  while (element.firstChild) element.removeChild(element.firstChild);
}

let uid = 0;
export function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}-${uid}`;
}

/** Announces a message to screen readers through the page's polite live region. */
export function announce(message: string): void {
  const region = document.getElementById("live");
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => { region.textContent = message; }, 30);
}

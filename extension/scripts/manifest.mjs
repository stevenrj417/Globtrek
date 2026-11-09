// Generates manifest.json. Production requests only what shipped features use:
//   storage    — the traveler profile, settings and trip checklists, on this device
//   scripting  — inject the fill script into a partner tab after the traveler asks
//   content script on https://www.glob-trek.com — detect the extension and relay trip status
//   optional host permissions — only partners whose adapter is enabled, requested at the moment of use
// Not requested: <all_urls>, tabs, history, cookies, downloads, clipboard, debugger, webRequest.

export const NAME = "GlobTrek One Tab Booking Assistant";
export const DESCRIPTION = "Open every booking from your GlobTrek trip and fill your details where partners allow. You review and pay on their site.";

/** Partner origins whose adapters are enabled (kept in sync with src/adapters by tests/manifest.test.ts). */
export const ENABLED_PARTNER_ORIGINS = ["https://www.getyourguide.com/*"];

export function buildManifest({ version, dev }) {
  if (DESCRIPTION.length > 132) throw new Error("Chrome Web Store descriptions must be 132 characters or fewer");
  const siteMatches = ["https://www.glob-trek.com/*"];
  const devSiteMatches = ["http://localhost:3010/*", "http://127.0.0.1:3010/*", "http://localhost:3001/*", "http://127.0.0.1:3001/*", "http://localhost:3000/*", "https://*.vercel.app/*"];
  const manifest = {
    manifest_version: 3,
    name: dev ? `${NAME} (dev)` : NAME,
    short_name: "GlobTrek Assistant",
    version,
    description: DESCRIPTION,
    minimum_chrome_version: "120",
    homepage_url: "https://www.glob-trek.com/booking-assistant",
    icons: { 16: "icons/icon-16.png", 32: "icons/icon-32.png", 48: "icons/icon-48.png", 128: "icons/icon-128.png" },
    action: { default_popup: "popup.html", default_title: "GlobTrek Booking Assistant", default_icon: { 16: "icons/icon-16.png", 32: "icons/icon-32.png" } },
    background: { service_worker: "background.js", type: "module" },
    permissions: ["storage", "scripting"],
    optional_host_permissions: ENABLED_PARTNER_ORIGINS,
    content_scripts: [{ matches: dev ? [...siteMatches, ...devSiteMatches] : siteMatches, js: ["content/bridge.js"], run_at: "document_start", all_frames: false }],
    content_security_policy: { extension_pages: "script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" },
  };
  // Development only: the local sanitized-fixture server, so the fill engine can be exercised end to end.
  if (dev) manifest.host_permissions = ["http://localhost:4599/*"];
  return manifest;
}

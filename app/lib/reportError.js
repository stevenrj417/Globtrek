// Sends a client-side crash to GlobTrek's server log (no page content, no user data).
export function reportClientError(error, where) {
  try {
    const body = JSON.stringify({ where, message: String(error?.message || error || "unknown").slice(0, 300), digest: error?.digest || null, path: window.location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/client-error", new Blob([body], { type: "application/json" }));
    else fetch("/api/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // Reporting must never cause a second error.
  }
}

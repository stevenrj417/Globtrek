// Where a sign-in may send the traveler afterwards: a path on this site only.
// Rejects absolute URLs, protocol-relative "//host" and the "/\host" form that
// browsers also treat as another host.
export function safeNextPath(value) {
  const path = String(value || "");
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f]/.test(path) || path.length > 512) return "/";
  try {
    const url = new URL(path, "https://www.glob-trek.com");
    return url.origin === "https://www.glob-trek.com" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

import { SITE_URL } from "./lib/site";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/my-trips", "/results", "/thinking", "/trip/", "/unsubscribe", "/auth/", "/flight/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

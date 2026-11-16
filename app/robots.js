import { SITE_URL } from "./lib/site";

// Personal, account and redirect routes. Everything else is public.
export const PRIVATE_PATHS = ["/api/", "/account", "/my-trips", "/results", "/thinking", "/alternatives", "/trip/", "/s/", "/trip-reminders", "/unsubscribe", "/auth/", "/flight/", "/go"];

// Search engines and AI assistants that cite or link to sources. Naming them
// makes it explicit that they're welcome on public pages; the private paths
// stay off-limits for every crawler.
export const NAMED_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "Applebot-Extended",
  "Google-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Amazonbot",
  "CCBot",
];

export default function robots() {
  return {
    rules: [
      { userAgent: NAMED_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

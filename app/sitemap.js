const siteUrl = "https://www.glob-trek.com";

const routes = [
  "",
  "/discover",
  "/cruises",
  "/road-trips",
  "/road-trips/quiz",
  "/about",
  "/how-it-works",
  "/contact",
  "/privacy",
  "/terms",
  "/affiliate-disclosure",
];

export default function sitemap() {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}

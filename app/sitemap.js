const siteUrl = "https://www.glob-trek.com";

const routes = [
  "",
  "/discover",
  "/about",
  "/how-it-works",
  "/contact",
  "/privacy",
  "/terms",
  "/affiliate-disclosure",
  "/demo-booking",
];

export default function sitemap() {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}

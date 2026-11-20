import { publishedDestinations } from "./data/destinationCatalog";
import { publishedGuides } from "./lib/guides/buildGuide";
import { CONTENT_UPDATED, SITE_URL } from "./lib/site";

const routes = [
  "",
  "/discover",
  // Uncomment these routes when Cruises and Road Trips return to navigation.
  // "/cruises",
  // "/road-trips",
  // "/road-trips/quiz",
  "/destinations",
  "/guides",
  "/about",
  "/how-it-works",
  "/help",
  "/contact",
  "/feedback",
  "/privacy",
  "/booking-assistant",
  "/booking-assistant/privacy",
  "/terms",
  "/affiliate-disclosure",
  "/photo-credits",
];

// Only indexable pages: quiz results are personal, and unpublished destinations stay out.
export default function sitemap() {
  return [
    ...routes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: new Date(`${CONTENT_UPDATED}T00:00:00Z`),
      changeFrequency: route === "" ? "weekly" : "monthly",
      priority: route === "" ? 1 : 0.8,
    })),
    ...publishedDestinations.map((item) => ({
      url: `${SITE_URL}/destinations/${item.slug}`,
      lastModified: item.modelDate ? new Date(`${item.modelDate}T00:00:00Z`) : new Date(`${CONTENT_UPDATED}T00:00:00Z`),
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    ...publishedGuides().map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: new Date(`${CONTENT_UPDATED}T00:00:00Z`),
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ];
}

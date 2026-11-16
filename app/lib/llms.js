// Plain-text guides for AI assistants and search tools (/llms.txt, /llms-full.txt).
// Built from the same catalog and site facts as the pages, so they stay current.
import { destinations } from "../data/destinations.js";
import { publishedDestinations } from "../data/destinationCatalog.js";
import { formatRange } from "./format.js";
import { AFFILIATE_DISCLOSURE, CONTENT_UPDATED, INSTAGRAM_URL, SITE_URL } from "./site.js";

const pages = [
  ["Find your trip", "/discover", "The seven-question planner. Free, no account needed."],
  ["Destinations on a budget", "/destinations", `${publishedDestinations.length} destination guides with estimated 5-night costs before flights, best months and nearest airport.`],
  ["How it works", "/how-it-works", "The questions, how destinations are matched and priced, and how booking works."],
  ["Help", "/help", "Answers on cost estimates, booking, accounts and how GlobTrek makes money."],
  ["About", "/about", "Why GlobTrek recommends one trip instead of a long list."],
  ["Affiliate disclosure", "/affiliate-disclosure", "Which links can earn GlobTrek a commission, and through which networks."],
  ["Booking Assistant", "/booking-assistant", "Optional Chrome extension that opens each booking from a trip on the provider's site."],
  ["Privacy", "/privacy", "What GlobTrek stores and how to delete it."],
  ["Terms", "/terms", "Terms of use."],
  ["Contact", "/contact", "How to reach GlobTrek."],
];

const summary = `GlobTrek (${SITE_URL}) is a free, budget-first trip planner. A traveler answers seven short questions (budget, setting, pace, trip length, where they'll sleep, what matters most, and how well known the place should be), adds dates and a home airport, and gets one recommended destination that fits, instead of a long list.`;

const facts = [
  `Free to use. No account is needed; an optional account saves trips.`,
  `Budget comes first: a destination is shown only when its estimated cost fits the traveler's budget. ${destinations.length} destinations can be recommended.`,
  "Each trip shows an estimated total before flights, a per-night stay estimate, places to stay, things to do and places to eat, and why it matches the answers.",
  "Estimates are planning figures from GlobTrek's cost models (lodging, food, activities, local transport, adjusted by month), not live quotes. Live prices and availability are on the provider's site.",
  "GlobTrek does not sell travel, take payment or hold reservations. Travelers book directly with providers such as Booking.com.",
  `How it makes money: affiliate commissions. Booking.com stay and flight links go through the CJ Affiliate network; tour and ticket links go to WeGoTrip through Travelpayouts. Restaurant and activity map links earn nothing. ${AFFILIATE_DISCLOSURE}`,
  "Being an affiliate is not an endorsement by Booking.com, WeGoTrip or any other provider.",
];

const limits = [
  "Prices are estimates, not quotes; flights are shown separately and may be observed fares or a distance-based estimate.",
  "GlobTrek recommends; it doesn't book. Changes and cancellations go through the provider.",
  "Costs are shown in US dollars.",
  "Hotel listings come from an affiliate feed of real properties; they are not live availability.",
];

function list(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function pageLinks() {
  return pages.map(([title, path, note]) => `- [${title}](${SITE_URL}${path}): ${note}`).join("\n");
}

export function llmsText() {
  return `# GlobTrek

> ${summary}

${list(facts)}

## Main pages

${pageLinks()}

## Limitations

${list(limits)}

## More

- [Full guide with every destination page](${SITE_URL}/llms-full.txt)
- [Sitemap](${SITE_URL}/sitemap.xml)
- [Instagram](${INSTAGRAM_URL})

Last updated ${CONTENT_UPDATED}.
`;
}

export function llmsFullText() {
  const guides = [...publishedDestinations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `- [${item.name}, ${item.country}](${SITE_URL}/destinations/${item.slug}): ${formatRange(item.estimate.low, item.estimate.high)} for 1 traveler, 5 nights, before flights. Best time: ${item.season}. Known for ${item.knownFor}. Nearest airport ${item.airport}.`)
    .join("\n");

  return `${llmsText()}
## How a trip is picked

1. The traveler's budget sets a ceiling. Destinations whose typical estimate for the chosen length and party size is over it are left out.
2. Setting (coast, mountains, city, history & culture, nature & wildlife), pace and priorities are matched against each destination's profile.
3. A knownness score from 0 (hidden) to 100 (world famous) is matched to the traveler's slider.
4. Places with fuller data (checked stays, verified activities, local prices) rank ahead of thinner ones.
5. The result lists which answers it matches. Changing one answer changes the trip.

## Destination guides

Estimates are GlobTrek planning figures, not quotes. Each guide shows the cost breakdown, monthly prices and when the model was last reviewed.

${guides}
`;
}

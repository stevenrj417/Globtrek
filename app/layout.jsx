import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AssistantPrompt } from "./components/AssistantPrompt";
import { AuthProvider } from "./components/AuthProvider";
import { OfflineNotice } from "./components/OfflineNotice";
import { CONTACT_EMAIL, INSTAGRAM_URL, LEGAL_NAME, SITE_URL } from "./lib/site";

const description = "Simple, affordable trip planning. Answer a few quick questions and get one trip that fits your budget.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "GlobTrek · One Tab Travel", template: "%s · GlobTrek" },
  description,
  applicationName: "GlobTrek",
  // No site-wide title, description or url here: link previews then use each
  // page's own <title> and description instead of the home page's.
  openGraph: { type: "website", siteName: "GlobTrek", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport = {
  themeColor: "#f7f7f4",
};

const organization = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "GlobTrek", description: "GlobTrek makes a free, budget-first trip planner. It earns affiliate commissions when travelers book through its links.", legalName: LEGAL_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.png`, sameAs: [INSTAGRAM_URL], ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL, contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: CONTACT_EMAIL } } : {}) },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "GlobTrek", url: SITE_URL, description, inLanguage: "en-US", publisher: { "@id": `${SITE_URL}/#organization` } },
    // The planner itself. Free to use; no ratings or offers are claimed.
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#planner`,
      name: "GlobTrek trip planner",
      url: `${SITE_URL}/discover`,
      applicationCategory: "TravelApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      description: "A free trip planner. Answer seven short questions about budget, setting, pace, trip length, stay style, priorities and how well known a place should be, and get one destination that fits, with an estimated cost before flights, places to stay, things to do and links to book with travel providers.",
      featureList: ["Budget-first destination matching", "Estimated trip cost before flights", "Per-night stay estimates", "Places to stay, things to do and places to eat", "Links to book on Booking.com and other providers"],
      provider: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
        <AuthProvider>{children}</AuthProvider>
        <OfflineNotice />
        <AssistantPrompt />
        <Analytics />
      </body>
    </html>
  );
}

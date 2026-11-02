import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "./components/AuthProvider";
import { OfflineNotice } from "./components/OfflineNotice";
import { CONTACT_EMAIL, INSTAGRAM_URL, LEGAL_NAME, SITE_URL } from "./lib/site";

const description = "Simple, affordable trip planning. Answer a few quick questions and get one trip that fits your budget.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "GlobTrek · One Tab Travel", template: "%s · GlobTrek" },
  description,
  applicationName: "GlobTrek",
  openGraph: { type: "website", siteName: "GlobTrek", title: "GlobTrek · One Tab Travel", description, url: SITE_URL, locale: "en_US" },
  twitter: { card: "summary_large_image", title: "GlobTrek · One Tab Travel", description },
};

export const viewport = {
  themeColor: "#f7f7f4",
};

const organization = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "GlobTrek", legalName: LEGAL_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.png`, sameAs: [INSTAGRAM_URL], ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL, contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: CONTACT_EMAIL } } : {}) },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "GlobTrek", url: SITE_URL, publisher: { "@id": `${SITE_URL}/#organization` } },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
        <AuthProvider>{children}</AuthProvider>
        <OfflineNotice />
        <Analytics />
      </body>
    </html>
  );
}

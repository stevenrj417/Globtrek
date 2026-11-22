import { Breadcrumb, PageHero } from "../components/TravelPage";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { TrustStrip } from "../components/TrustStrip";
import { SurpriseClient } from "./SurpriseClient";
import { photoFor } from "../lib/themed/cards";

export const metadata = {
  title: "Surprise me: a random trip that fits your budget",
  description: "Tell GlobTrek your budget and how long you have. We'll pick somewhere you can actually afford, flights and all, and show you the math.",
  alternates: { canonical: "/surprise" },
};

export default function SurprisePage() {
  const hero = photoFor({ id: "RAK" });
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Surprise me", null]]} />
    <PageHero short centered image={hero.url} alt={hero.alt} chips={["Somewhere you can afford"]} title="Surprise me." subtitle="Your budget, your dates. We pick the place, and it really does fit." />
    <div className="mt-10"><SurpriseClient /></div>
    <TrustStrip className="mx-auto mt-14 max-w-[1280px] px-5 sm:px-8" />
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

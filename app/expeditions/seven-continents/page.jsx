import { Breadcrumb, PageHero } from "../../components/TravelPage";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { TrustStrip } from "../../components/TrustStrip";
import { TripPricer } from "../../components/TripPricer";
import { CONTINENT_STOPS } from "../../data/themedTrips";
import { photoFor } from "../../lib/themed/cards";
import { AFFILIATE_DISCLOSURE } from "../../lib/site";

export const metadata = {
  title: "All seven continents: plan and price a round-the-world trip",
  description: "Pick how many months you have. GlobTrek builds a route through all seven continents, Antarctica included, and prices every flight, night, meal and ship.",
  alternates: { canonical: "/expeditions/seven-continents" },
};

export default function SevenContinentsPage() {
  const hero = photoFor({ id: "CPT" });
  return <main className="min-h-screen bg-bg text-ink">
    <SiteHeader />
    <Breadcrumb items={[["Home", "/"], ["Trip ideas", "/trip-ideas#the-big-ones"], ["Seven continents", null]]} />
    <PageHero image={hero.url} alt={hero.alt} chips={["7 continents", "1 to 12 months"]} title="Every continent. Your timeline." subtitle="Slide to the number of months you have. GlobTrek picks the stops, orders them around the world and prices it all, Antarctic ship included." />
    <section className="mx-auto mt-10 max-w-[1280px] px-5 sm:px-8">
      <ol className="grid gap-px bg-black/10 sm:grid-cols-7">{CONTINENT_STOPS.map((item, index) => <li key={item.continent} className="bg-bg py-3 sm:px-3 sm:first:pl-0"><span className="tabular text-micro font-medium uppercase tracking-label">{index + 1}</span><p className="mt-1 text-sm font-medium">{item.continent}</p></li>)}</ol>
      <p className="mt-4 max-w-3xl text-base leading-7">The longer you go, the more cities each continent gets: one each for a month, up to five each for a year. You head east around the world and finish in South America, so Antarctica is a short hop from Ushuaia.</p>
    </section>
    <div className="mx-auto mt-10 max-w-[1280px] px-5 sm:px-8"><TripPricer kind="continents" showMonths months={3} heading="Your seven continents" /></div>
    <TrustStrip className="mx-auto mt-10 max-w-[1280px] px-5 sm:px-8" />
    <p className="mx-auto mt-12 max-w-[1280px] px-5 text-xs leading-5 sm:px-8">{AFFILIATE_DISCLOSURE}</p>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

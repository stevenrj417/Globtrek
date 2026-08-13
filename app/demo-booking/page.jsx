import { DemoStay } from "../components/DemoStay";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata = { title: "Stay design demo · GlobTrek" };

export default function DemoBookingPage() {
  return <main className="min-h-screen bg-[#f7f7f4] text-[#171717]"><SiteHeader actionHref="/discover" actionLabel="Find my trip" /><div className="py-14 sm:py-20"><DemoStay /></div><SiteFooter /></main>;
}

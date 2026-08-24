import Link from "next/link";
import Image from "next/image";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { JourneyCards, JourneySearch } from "../components/JourneyDiscovery";
import { cruiseDiscovery } from "../data/journeyDiscovery";

export const metadata = { title: "GlobTrek Cruises", description: "Discover an ocean journey shaped around your pace, priorities, and complete-trip budget." };

export default function CruisesPage() {
  return <main className="min-h-screen bg-[#f7f7f4] text-[#171714]">
    <SiteHeader actionHref="/cruises/quiz" actionLabel="Create my cruise" />
    <section className="px-3 pb-3 pt-3 sm:px-5 sm:pb-5"><div className="relative mx-auto min-h-[calc(100svh-7.25rem)] max-w-[1880px] overflow-hidden bg-[#728c99]"><Image src="/cruise-hero-v2.jpg" alt="A cruise ship sailing through calm coastal water at sunset" fill priority sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/70" /><div className="absolute inset-x-0 bottom-0 px-6 pb-10 text-center text-white sm:px-12 sm:pb-14 lg:px-16 lg:pb-16"><p className="text-[10px] uppercase tracking-[0.24em] text-white/75">GlobTrek Cruises</p><div className="mt-5 flex flex-col items-center gap-9"><h1 className="max-w-6xl font-serif text-[clamp(4rem,9.4vw,9.5rem)] font-normal leading-[.8] tracking-[-0.065em]">It’s the journey that counts.</h1><Link href="/cruises/quiz" className="inline-flex min-h-14 shrink-0 items-center justify-between gap-12 bg-white px-6 text-xs font-semibold uppercase tracking-[0.09em] text-black transition hover:bg-[#eee9df]">Create my cruise <span aria-hidden="true">→</span></Link></div></div></div></section>
    <section className="px-6 py-20 text-center sm:px-12 sm:py-28"><div className="mx-auto max-w-[1050px]"><h2 className="font-serif text-[clamp(3.2rem,6vw,6.7rem)] leading-[.88] tracking-[-0.055em]">Begin with the ocean.<br />We’ll work out the port.</h2><p className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-black/58">Choose the coast, rhythm, and experiences that call to you. The journey takes shape around the budget you actually have.</p><Link href="/cruises/quiz" className="mt-8 inline-block border-b border-black pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-black">Create my cruise</Link></div></section>
    <section className="bg-[#f4f1eb] px-6 py-20 sm:px-10 sm:py-28"><div className="mx-auto max-w-[1320px]"><div className="mb-12 text-center"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6b36]">Already know the region?</p><h2 className="mt-5 font-serif text-[clamp(3.2rem,6vw,6rem)] leading-[.88] tracking-[-0.055em]">Start with the ocean you know.</h2></div><JourneySearch items={cruiseDiscovery} basePath="/cruises/quiz" /></div></section>
    <JourneyCards items={cruiseDiscovery} basePath="/cruises/quiz" eyebrow="Trending cruise journeys" taller />
    <SiteFooter />
  </main>;
}

import Image from "next/image";
import { ProductPlanner } from "../components/ProductPlanner";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata = { title: "GlobTrek Cruises", description: "Personalized cruise planning shaped around your dates, budget, and travel style." };

export default function CruisesPage() {
  return <main className="min-h-screen bg-[#f7f7f4] text-[#171714]">
    <SiteHeader actionHref="#plan" actionLabel="Plan a cruise" />
    <section className="px-4 pb-20 pt-4 sm:px-6 sm:pb-28"><div className="relative mx-auto min-h-[78svh] max-w-[1880px] overflow-hidden bg-[#d9d7d1]"><Image src="/luxury-coast.jpg" alt="A luminous coastline viewed from above the sea" fill priority className="object-cover" sizes="100vw" quality={90} /><div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/55" /><div className="absolute inset-x-0 bottom-0 px-6 pb-10 text-white sm:px-12 sm:pb-16"><p className="text-[10px] uppercase tracking-[0.22em] text-white/75">GlobTrek Cruises</p><h1 className="mt-5 max-w-5xl font-serif text-[clamp(4.2rem,10vw,10rem)] font-normal leading-[.78] tracking-[-0.065em]">The horizon,<br />made personal.</h1><a href="#plan" className="mt-9 inline-flex min-h-13 items-center bg-white px-6 text-xs font-semibold uppercase tracking-[0.09em] text-black">Start planning <span className="ml-5">↓</span></a></div></div></section>
    <section className="border-t border-black/10 px-6 py-20 sm:px-12 sm:py-28"><div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-2 lg:gap-24"><p className="font-serif text-[clamp(3rem,5vw,5.5rem)] leading-[.92] tracking-[-0.05em]">A voyage should fit more than a calendar.</p><div className="max-w-xl self-end text-base leading-8 text-black/58"><p>GlobTrek shapes cruise ideas around where you want to sail, how you like to spend a day, and what the complete journey should cost.</p><div className="mt-10 grid grid-cols-2 gap-6 border-t border-black/12 pt-7 text-xs"><p>Ports and regions</p><p>Cabins and onboard rhythm</p><p>Shore experiences</p><p>One considered plan</p></div></div></div></section>
    <section id="plan"><ProductPlanner product="cruise" /></section>
    <SiteFooter />
  </main>;
}

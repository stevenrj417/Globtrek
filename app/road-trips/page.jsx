import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

export const metadata = {
  title: "GlobTrek Road Trips",
  description: "Discover a road trip shaped around the landscapes, pace, and budget that move you.",
};

export default function RoadTripsPage() {
  return <main className="min-h-screen bg-[#f7f7f4] text-[#171714]">
    <SiteHeader actionHref="/road-trips/quiz" actionLabel="Create my route" />
    <section className="px-3 pb-3 pt-3 sm:px-5 sm:pb-5">
      <div className="relative mx-auto min-h-[calc(100svh-7.25rem)] max-w-[1880px] overflow-hidden bg-[#b9a992]">
        <Image src="/quiz/road-trips.jpg" alt="An open-top car paused above the Pacific coast" fill priority className="object-cover image-calm" sizes="100vw" quality={90} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/68" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-10 text-white sm:px-12 sm:pb-14 lg:px-16 lg:pb-16">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/75">GlobTrek Road Trips</p>
          <div className="mt-5 flex flex-col items-start justify-between gap-9 md:flex-row md:items-end">
            <h1 className="max-w-5xl font-serif text-[clamp(4.2rem,10vw,10rem)] font-normal leading-[.78] tracking-[-0.065em]">Take the<br />long way.</h1>
            <Link href="/road-trips/quiz" className="inline-flex min-h-14 items-center justify-between gap-12 bg-white px-6 text-xs font-semibold uppercase tracking-[0.09em] text-black transition hover:bg-[#eee9df]">Create my route <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </div>
    </section>
    <section className="px-6 py-20 sm:px-12 sm:py-28">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:gap-24">
        <h2 className="max-w-4xl font-serif text-[clamp(3.2rem,6vw,6.7rem)] leading-[.88] tracking-[-0.055em]">A journey discovered by feeling, then made real.</h2>
        <div className="border-t border-black/15 pt-6 text-sm leading-7 text-black/58"><p>Choose the landscapes, rhythm, and distance that call to you. GlobTrek shapes the road around a budget that still leaves room for the experience.</p><Link href="/road-trips/quiz" className="mt-8 inline-block border-b border-black pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-black">Find the road worth taking</Link></div>
      </div>
    </section>
    <SiteFooter />
  </main>;
}

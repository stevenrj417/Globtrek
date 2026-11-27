import Image from "./components/Photo";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { EmailSignup } from "./components/EmailSignup";
import { TripCard } from "./components/TripCard";
import { beautifulPlaces } from "./data/trending";
import { DestinationSearch } from "./components/DestinationSearch";

export const metadata = {
  description: "Free trip planner: answer seven quick questions and get one affordable trip that fits your budget, with an estimated cost, places to stay and things to do.",
  alternates: { canonical: "/" },
};

const tripHref = (trip) => `/discover/quick?destination=${trip.id}&destinationName=${encodeURIComponent(trip.name)}&source=beautiful`;

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <section id="discover" className="px-4 pb-16 pt-4 sm:px-6 sm:pb-28">
        <div className="group relative mx-auto min-h-[82svh] max-w-[1880px] overflow-hidden bg-placeholder sm:min-h-[86svh]">
          <Image src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" alt="A bright alpine lake and green mountains" fill preload fetchPriority="high" className="image-calm hero-drift object-cover" sizes="(min-width: 1880px) 1880px, 100vw" quality={75} />
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/70 via-black/30 to-transparent" aria-hidden="true" />
          <div className="rise absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-12 text-center sm:pb-16 lg:pb-20">
            <h1 className="max-w-4xl font-serif text-[clamp(2.6rem,7vw,6.5rem)] font-normal leading-[0.92] tracking-tight-3 text-white [text-shadow:0_2px_24px_rgba(0,0,0,.35)]">Where to next?</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/90">Tell us how you like to travel. We&apos;ll find the place.</p>
            <div className="mt-8 flex w-full flex-col items-center gap-3">
              <DestinationSearch variant="hero" />
              <div className="flex flex-col items-center gap-2">
                <Link href="/discover" className="group inline-flex min-h-12 min-w-[13rem] items-center justify-center gap-2 bg-white px-7 text-micro font-medium uppercase tracking-label text-black transition-colors duration-200 hover:bg-white/85">Plan my trip <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span></Link>
                <Link href="/surprise" className="inline-flex min-h-11 items-center gap-2 text-micro font-medium uppercase tracking-label text-white/90 underline decoration-white/40 underline-offset-4 transition hover:text-white hover:decoration-white">or surprise me <span aria-hidden="true">✦</span></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="trips" aria-labelledby="trips-heading" className="reveal scroll-mt-24 pb-[var(--section-space)]">
        <div className="mx-auto max-w-[1520px] px-5 sm:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 sm:mb-14">
            <h2 id="trips-heading" className="font-serif text-3xl tracking-tight-3 sm:text-5xl">Three of the most beautiful places on Earth</h2>
            <Link href="/trip-ideas" className="inline-flex min-h-11 items-center text-micro font-medium uppercase tracking-label underline underline-offset-4">More trip ideas →</Link>
          </div>
          <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-x-6 md:overflow-visible md:px-0 lg:gap-x-8">
            {beautifulPlaces.map((trip) => (
              <div key={trip.id} className="w-[82%] shrink-0 snap-start md:w-auto">
                <TripCard trip={trip} href={tripHref(trip)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Set this condition to true to restore the fashion-photo inspiration strip. */}
      {false && <section id="luxury" aria-label="Luxury travel inspiration" className="reveal border-t border-black/10 bg-surface-sunken py-20 sm:py-32">
        <div className="mx-auto grid max-w-[1460px] gap-5 px-5 sm:px-8 md:grid-cols-3 md:gap-7 lg:gap-9">
          {[
            ["/luxury-snow.jpg", "A fashion portrait in a snowy alpine landscape"],
            ["/luxury-coast.jpg", "A woman in a flowing white dress overlooking the sea"],
            ["/luxury-paris-bw.jpg", "A black-and-white fashion portrait in front of the Eiffel Tower"],
          ].map(([src, alt]) => (
            <div className="group relative aspect-[4/5] overflow-hidden bg-placeholder" key={src}>
              <Image src={src} alt={alt} fill className="image-calm object-cover" sizes="(min-width: 768px) 33vw, 100vw" quality={90} />
            </div>
          ))}
        </div>
      </section>}
      <EmailSignup />
      <SiteFooter />
    </main>
  );
}

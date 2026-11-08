import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { EmailSignup } from "./components/EmailSignup";
import { TripCard } from "./components/TripCard";
import { trendingTrips } from "./data/trending";
import { CHEAP_STAYS } from "./data/cheapStays";
import { formatMoney } from "./lib/recommendation/tripEstimate";
import { BookingLogo, BookingPartnerBadge } from "./components/PartnerLogo";

const steps = [
  ["01", "Answer 7 quick questions", "Setting, pace, budget and when you can go."],
  ["02", "Get one trip that fits", "A destination, stays and things to do, inside your budget."],
  ["03", "Book with our travel partners", <>GlobTrek is a <BookingLogo className="mx-0.5 h-3 w-auto" /> affiliate partner. Check live prices and book on the partner&apos;s site.</>],
];

const vibes = [
  ["Coast", "Ocean", "/quiz/ocean.jpg", "A bright Mediterranean coastline"],
  ["Mountains", "Mountains", "/quiz/mountains.jpg", "A snowy mountain landscape"],
  ["City", "Cities", "/quiz/cities.jpg", "A city street in Paris"],
  ["History & culture", "Culture", "/quiz/culture.jpg", "A quiet tree-lined street in Kyoto"],
  ["Surprise me", "Surprise Me", "/quiz/surprise-me.jpg", "Rio de Janeiro seen from above"],
];

function budgetFacts() {
  return trendingTrips.map((trip) => {
    const stay = CHEAP_STAYS[trip.airport];
    return stay?.bedNight ? { trip, text: `Hostel beds from ~${formatMoney(stay.bedNight)} a night` } : null;
  }).filter(Boolean);
}

const tripHref = (trip) => `/discover/quick?destination=${trip.id}&destinationName=${encodeURIComponent(trip.name)}&source=trending`;

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <section id="discover" className="px-4 pb-16 pt-4 sm:px-6 sm:pb-24">
        <div className="group relative mx-auto min-h-[72vh] max-w-[1880px] overflow-hidden bg-placeholder sm:min-h-[78vh]">
          <Image src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" alt="A bright alpine lake and green mountains" fill preload className="image-calm object-cover" sizes="(min-width: 1880px) 1880px, 100vw" quality={75} />
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/55 via-black/20 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-10 text-center sm:pb-14 lg:pb-16">
            <h1 className="whitespace-nowrap text-[clamp(1.65rem,5vw,5.25rem)] font-extralight uppercase leading-[0.9] tracking-tight-3 text-white">One Tab Travel</h1>
            <Link href="/discover" className="btn btn-primary mt-6">Find your trip <span aria-hidden="true">→</span></Link>
            <p className="mt-3 text-xs text-white/90">A few quick questions. One affordable trip.</p>
          </div>
        </div>
      </section>

      <section aria-label="Booking partner" className="border-t border-black/10 bg-surface py-5">
        <div className="mx-auto flex max-w-[1520px] flex-col items-center justify-center gap-2 px-5 text-center sm:flex-row sm:gap-5 sm:px-8">
          <BookingPartnerBadge />
          <p className="text-xs leading-5 text-muted">Plan with GlobTrek. Check live stays and complete your reservation on Booking.com.</p>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="border-t border-black/10 py-12 sm:py-16">
        <div className="mx-auto max-w-[1520px] px-5 sm:px-8">
          <h2 id="how-heading" className="sr-only">How it works</h2>
          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {steps.map(([number, title, body]) => (
              <li key={number} className="flex gap-5 sm:block">
                <span className="tabular text-xs font-semibold tracking-caps text-brass">{number}</span>
                <div className="sm:mt-3">
                  <p className="text-lg font-medium tracking-tight-1">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="trips" className="reveal scroll-mt-24 border-t border-black/10 py-[var(--section-space)]">
        <div className="mx-auto max-w-[1520px] px-5 sm:px-8">
          <div className="mb-12 text-center">
            <p className="eyebrow">Easy on the wallet</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight-3 sm:text-5xl">Good trips that don&apos;t cost a fortune.</h2>
          </div>
          <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-x-6 md:overflow-visible md:px-0 lg:gap-x-8">
            {trendingTrips.map((trip) => (
              <div key={trip.id} className="w-[82%] shrink-0 snap-start md:w-auto">
                <TripCard trip={trip} href={tripHref(trip)} />
              </div>
            ))}
          </div>
          <ul className="mx-auto mt-14 grid max-w-5xl gap-px border border-black/10 bg-black/10 sm:grid-cols-3">
            {budgetFacts().map(({ trip, text }) => (
              <li key={trip.id} className="bg-bg">
                <Link href={tripHref(trip)} className="block h-full p-5 transition-colors duration-150 hover:bg-surface">
                  <span className="eyebrow">{trip.name}</span>
                  <span className="tabular mt-2 block text-sm font-medium">{text}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-xs text-subtle">Cheapest well-reviewed beds on Booking.com, taxes in, checked November 2026. Not live prices.</p>
        </div>
      </section>

      <section aria-labelledby="vibe-heading" className="reveal border-t border-black/10 py-[var(--section-space)]">
        <div className="mx-auto max-w-[1520px] px-5 sm:px-8">
          <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Browse by vibe</p>
              <h2 id="vibe-heading" className="mt-3 text-3xl font-semibold tracking-tight-3 sm:text-4xl">Start with a setting.</h2>
            </div>
            <Link href="/destinations" className="text-sm text-muted underline decoration-black/25 underline-offset-4 hover:text-ink">All destinations</Link>
          </div>
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
            {vibes.map(([label, setting, image, alt]) => (
              <Link key={setting} href={`/discover?setting=${encodeURIComponent(setting)}`} className="group w-[44%] shrink-0 snap-start md:w-auto">
                <div className="relative aspect-[3/4] overflow-hidden bg-placeholder">
                  <Image src={image} alt={alt} fill className="image-calm object-cover" sizes="(min-width: 768px) 20vw, 44vw" />
                </div>
                <p className="mt-3 text-sm font-medium">{label} <span aria-hidden="true" className="text-subtle">→</span></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="why-heading" className="border-t border-black/10 py-[var(--section-space)]">
        <div className="mx-auto max-w-[var(--width-reading)] px-5 text-center">
          <p className="eyebrow">Why one trip?</p>
          <h2 id="why-heading" className="mt-3 text-2xl font-semibold tracking-tight-2 sm:text-3xl">Choosing is the hard part. We do it for you.</h2>
          <p className="mt-4 text-base leading-7 text-muted">Most travel sites show hundreds of options and leave the choosing to you. GlobTrek weighs your budget, pace and timing, then shows the one trip that fits best.</p>
          <Link href="/how-it-works#method" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium underline decoration-black/25 underline-offset-4 hover:decoration-black">How we pick trips</Link>
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

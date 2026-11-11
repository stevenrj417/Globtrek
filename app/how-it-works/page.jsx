import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { BookingLogo } from "../components/PartnerLogo";

export const metadata = {
  title: "How it works",
  description: "How GlobTrek turns a few answers into one affordable trip, and how trips are picked.",
  alternates: { canonical: "/how-it-works" },
};

const questions = ["Your budget", "Where you'd like to be", "How busy your days are", "How long you can go", "Where you'll sleep", "What matters most", "Famous or hidden"];

const method = [
  ["Budget comes first", "Each destination has a cost model for lodging, food, activities and local transport, adjusted by month. A trip only appears when its typical estimate fits your budget, and the model leans toward clean, well-reviewed budget and mid-range stays."],
  ["Fit, not volume", "Your setting, pace and priorities are matched against each destination's profile. The result tells you which of your answers it matches, so you can see why it was picked."],
  ["Famous or hidden, your call", "Every destination has a knownness score from 0 (hidden gem) to 100 (world famous). The slider in the quiz sets which end of that scale you want."],
  ["Real places only", "Hotels are matched to real listings, and a booking link appears only once it has been verified. When a rating, price or photo isn't available, it isn't shown."],
];

function Step({ number, title, children, image, alt, reverse, overlay }) {
  return (
    <section className="grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:gap-20">
      <div className={`relative aspect-[4/3] overflow-hidden bg-placeholder ${reverse ? "lg:order-2" : ""}`}>
        <Image src={image} alt={alt} fill className="image-calm object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
        {overlay}
      </div>
      <div className="max-w-lg">
        <p className="tabular text-micro uppercase tracking-editorial text-subtle">Step {number}</p>
        <h2 className="mt-4 font-serif text-[clamp(2rem,3.4vw,3rem)] font-normal leading-[1.05] tracking-tight-2">{title}</h2>
        <div className="mt-5 space-y-4 text-base leading-7 text-muted sm:text-[17px] sm:leading-8">{children}</div>
      </div>
    </section>
  );
}

const card = "absolute bottom-4 left-4 right-4 bg-white/95 p-5 shadow-overlay backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-auto sm:w-80";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <header className="mx-auto max-w-[1400px] px-6 pb-8 pt-14 sm:px-8 sm:pt-24">
        <p className="text-micro uppercase tracking-editorial text-subtle">How it works</p>
        <h1 className="mt-5 max-w-4xl text-balance font-serif text-[clamp(2.6rem,6vw,5.5rem)] font-normal leading-[1.02] tracking-tight-2">Seven questions. One trip worth taking.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">Tell us how you like to travel and what you can spend. GlobTrek does the comparing and shows you the one trip that fits.</p>
      </header>

      <div className="mx-auto max-w-[1400px] divide-y divide-black/10 px-6 sm:px-8">
        <Step number="1" title="You tell us how you travel" image="/quiz/v2/adventure-days.jpg" alt="A hiker on the ridge of Mangart, Slovenia"
          overlay={<ol className={`${card} hidden sm:block`}>
            {questions.map((question, index) => <li key={question} className="flex gap-3 py-1 text-sm"><span className="tabular w-4 text-subtle">{index + 1}</span>{question}</li>)}
          </ol>}>
          <p>Seven short questions, most answered with a single tap: your budget, where you&apos;d like to be, how busy you want your days, how long you can go, where you&apos;ll sleep, what matters most and how well known the place should be. Then your dates and home airport.</p>
          <p>Nothing to sign up for. If you don&apos;t mind either way, choose &ldquo;No preference&rdquo; and we&apos;ll keep your options open.</p>
        </Step>

        <Step number="2" title="We compare, you get one trip" image="/quiz/v2/ocean.jpg" alt="Atrani on the Amalfi Coast, Italy" reverse
          overlay={<div className={card}>
            <p className="text-micro uppercase tracking-editorial text-subtle">Example · why this trip</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {["Coast", "Relaxed pace", "Food first", "Fits your budget"].map((match) => <li key={match} className="flex items-center gap-2"><span aria-hidden="true" className="text-success">✓</span>{match}</li>)}
            </ul>
          </div>}>
          <p>GlobTrek checks every destination against your answers and your budget, then shows the single best fit with stays, things to do and places to eat.</p>
          <p>Not quite right? Change one answer and the trip changes with it.</p>
        </Step>

        <Step number="3" title="You book with the partner" image="/quiz/v2/private-room.jpg" alt="A canopy bed in a quiet hotel suite"
          overlay={<div className={card}>
            <p className="text-sm">Live prices and booking on</p>
            <BookingLogo className="mt-2 h-5 w-auto" />
          </div>}>
          <p>When you&apos;re ready, continue to Booking.com or another partner to see live prices and book. The partner handles payment and the reservation.</p>
          <p>GlobTrek is free to use. We may earn a commission when you book through a partner link. <Link href="/affiliate-disclosure" className="text-ink underline decoration-black/25 underline-offset-4 hover:decoration-black">How this works</Link></p>
        </Step>
      </div>

      <section id="method" aria-labelledby="method-heading" className="mt-12 scroll-mt-24 bg-ink text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-20 sm:px-8 sm:py-28">
          <p className="text-micro uppercase tracking-editorial text-white/55">How we pick trips</p>
          <h2 id="method-heading" className="mt-4 max-w-2xl font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal leading-[1.05] tracking-tight-2">The method, without the fine print.</h2>
          <dl className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {method.map(([term, body]) => (
              <div key={term} className="border-t border-white/20 pt-6">
                <dt className="font-serif text-xl">{term}</dt>
                <dd className="mt-3 text-[15px] leading-7 text-white/70">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-4 py-4 sm:px-6">
        <div className="relative mx-auto flex h-[min(64vh,640px)] min-h-[420px] max-w-[1880px] items-end overflow-hidden bg-placeholder">
          <Image src="/quiz/v2/surprise-me.jpg" alt="Hot-air balloons lifting off over Cappadocia" fill className="image-calm object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" aria-hidden="true" />
          <div className="relative w-full px-6 pb-12 text-white sm:px-12 sm:pb-16">
            <h2 className="font-serif text-[clamp(2.25rem,5vw,4.5rem)] font-normal leading-none tracking-tight-2">Ready when you are.</h2>
            <Link href="/discover" className="mt-8 inline-flex min-h-12 items-center gap-2 bg-white px-7 text-micro font-medium uppercase tracking-label text-black transition-opacity hover:opacity-90">Find my trip <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

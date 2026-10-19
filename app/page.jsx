import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { EmailSignup } from "./components/EmailSignup";

const trips = [
  { id: "MEX", name: "Mexico City", country: "Mexico", stay: "1 week", price: "Est. $1,000–$2,300", image: "https://images.unsplash.com/photo-1518659526054-190340b32735", alt: "Mexico City seen from above" },
  { id: "HAN", name: "Hanoi", country: "Vietnam", stay: "5 nights", price: "Est. $700–$1,600", image: "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a", alt: "A street scene in Hanoi" },
  { id: "LIS", name: "Lisbon", country: "Portugal", stay: "5 nights", price: "Est. $1,200–$2,600", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b", alt: "Lisbon rooftops in warm light" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <SiteHeader />

      <section id="discover" className="px-4 pb-20 pt-4 sm:px-6 sm:pb-28">
        <div className="group relative mx-auto min-h-[72vh] max-w-[1880px] overflow-hidden bg-[#deded8] sm:min-h-[78vh]">
          <Image src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" alt="A bright alpine lake and green mountains" fill preload className="image-calm object-cover" sizes="100vw" quality={82} />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-10 text-center sm:pb-14 lg:pb-16">
            <h1 className="whitespace-nowrap text-[clamp(1.65rem,5vw,5.25rem)] font-extralight uppercase leading-[0.9] tracking-[-0.045em] text-white [text-shadow:0_1px_18px_rgba(0,0,0,0.28)]">One Tab Travel</h1>
            <Link href="/discover" className="mt-6 inline-flex min-h-12 items-center bg-[#171717] px-6 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-black">Find your trip <span className="ml-3" aria-hidden="true">→</span></Link>
            <p className="mt-3 text-xs text-white [text-shadow:0_1px_18px_rgba(0,0,0,0.28)]">A few quick questions. One affordable trip.</p>
          </div>
        </div>
      </section>

      <section id="trips" className="reveal border-t border-black/10 py-20 sm:py-28">
        <div className="mx-auto max-w-[1520px] px-5 sm:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#707070]">Easy on the wallet</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Good trips that don&apos;t cost a fortune.</h2>
          </div>
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-3 lg:gap-x-8">
            {trips.map((trip) => (
              <Link href={`/discover/quick?destination=${trip.id}&destinationName=${encodeURIComponent(trip.name)}&source=trending`} className="group block" key={trip.id} aria-label={`Plan a personalized ${trip.name} trip`}>
                <div className="relative aspect-[4/5] overflow-hidden bg-[#dfdfda]">
                  <Image src={trip.image} alt={trip.alt} fill className="image-calm object-cover" sizes="(min-width: 768px) 33vw, 100vw" quality={80} />
                </div>
                <div className="mt-4 border-b border-black/10 pb-4 text-center">
                  <h3 className="text-xl font-medium tracking-[-0.03em] sm:text-2xl">{trip.name}</h3>
                  <p className="mt-1 text-xs text-[#707070]">{trip.country}</p>
                  <p className="mt-3 text-sm font-medium">{trip.price}</p>
                  <p className="mt-1 text-xs text-[#707070]">{trip.stay} · before flights</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Set this condition to true to restore the fashion-photo inspiration strip. */}
      {false && <section id="luxury" aria-label="Luxury travel inspiration" className="reveal border-t border-black/10 bg-[#efefeb] py-20 sm:py-32">
        <div className="mx-auto grid max-w-[1460px] gap-5 px-5 sm:px-8 md:grid-cols-3 md:gap-7 lg:gap-9">
          {[
            ["/luxury-snow.jpg", "A fashion portrait in a snowy alpine landscape"],
            ["/luxury-coast.jpg", "A woman in a flowing white dress overlooking the sea"],
            ["/luxury-paris-bw.jpg", "A black-and-white fashion portrait in front of the Eiffel Tower"],
          ].map(([src, alt]) => (
            <div className="group relative aspect-[4/5] overflow-hidden bg-[#dddcd7]" key={src}>
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

import Link from "next/link";
import { EditorialPage } from "../components/EditorialPage";
import { AFFILIATE_DISCLOSURE } from "../lib/site";

export const metadata = {
  title: "Help",
  description: "Answers about how GlobTrek works, how it makes money, and who to contact about a booking.",
  alternates: { canonical: "/help" },
};

const BOOKING_HELP = "https://www.booking.com/customer-service.html";

const faqs = [
  ["Is GlobTrek a Booking.com partner?", <>Yes. GlobTrek participates in the Booking.com Affiliate Partner Program. We help you plan the trip, then send you to Booking.com to check live availability and complete eligible stay reservations.</>, "Yes. GlobTrek participates in the Booking.com Affiliate Partner Program. GlobTrek helps plan the trip, then sends travelers to Booking.com to check live availability and complete eligible stay reservations."],
  ["How does GlobTrek make money?", <>GlobTrek is a Booking.com affiliate partner and that&apos;s the only way GlobTrek makes money. {AFFILIATE_DISCLOSURE} You pay the travel provider directly. <Link href="/affiliate-disclosure">Read the affiliate disclosure</Link>.</>, `GlobTrek is a Booking.com affiliate partner and that's the only way GlobTrek makes money. ${AFFILIATE_DISCLOSURE} You pay the travel provider directly.`],
  ["Is it really free?", <>Yes. The quiz, your trip and saved trips cost nothing. You only pay the partner if you decide to book.</>, "Yes. The quiz, your trip and saved trips cost nothing. You only pay the partner if you decide to book."],
  ["Are the prices exact?", <>No. Trip totals are estimates built from GlobTrek&apos;s planning averages for each destination, your trip length and the number of travelers. Live room prices and availability are on the partner&apos;s site, and those are the prices you pay.</>, "No. Trip totals are estimates built from GlobTrek's planning averages for each destination, your trip length and the number of travelers. Live room prices and availability are on the partner's site, and those are the prices you pay."],
  ["Why only one trip?", <>Comparing dozens of options is the tiring part of planning. GlobTrek does that comparison for you and shows the trip that fits your answers best. If it isn&apos;t right, change one answer or retake the quiz.</>, "Comparing dozens of options is the tiring part of planning. GlobTrek does that comparison for you and shows the trip that fits your answers best. If it isn't right, change one answer or retake the quiz."],
  ["Who books my hotel?", <>The partner does. GlobTrek never takes payment. When you continue to Booking.com, Booking.com handles the reservation, payment, changes and cancellations.</>, "The partner does. GlobTrek never takes payment. When you continue to Booking.com, Booking.com handles the reservation, payment, changes and cancellations."],
  ["Something went wrong with my booking. Who do I contact?", <>Contact the company you booked with, because they hold your reservation. For stays booked on Booking.com, use <a href={BOOKING_HELP} rel="noopener">Booking.com customer service</a>.</>, "Contact the company you booked with, because they hold your reservation. For stays booked on Booking.com, use Booking.com customer service."],
  ["How are destinations chosen?", <>Your answers about setting, pace, priorities, budget, timing and departure airport are compared with each destination&apos;s profile. Destinations whose estimated cost doesn&apos;t fit your budget are left out. A slider from hidden places to iconic ones sets how well known the result should be. <Link href="/how-it-works#method">More on how we pick trips</Link>.</>, "Your answers about setting, pace, priorities, budget, timing and departure airport are compared with each destination's profile. Destinations whose estimated cost doesn't fit your budget are left out. A slider from hidden places to iconic ones sets how well known the result should be."],
  ["How often is information updated?", <>Each destination&apos;s cost model carries the date it was last reviewed. Hotel prices are never stored as live prices: you see current rates on the partner&apos;s site.</>, "Each destination's cost model carries the date it was last reviewed. Hotel prices are never stored as live prices: you see current rates on the partner's site."],
  ["What is the Booking Assistant?", <>An optional Chrome extension for computers. When you choose Book my trip, it opens each booking from your trip with GlobTrek&apos;s exact link and fills in your details where the partner allows it. It never books or pays for you, and your details stay on your computer. <Link href="/booking-assistant">How it works</Link>.</>, "An optional Chrome extension for computers. When you choose Book my trip, it opens each booking from your trip with GlobTrek's exact link and fills in your details where the partner allows it. It never books or pays for you, and your details stay on your computer."],
  ["Do I need an account?", <>No. An account is optional and only used to save trips. <Link href="/privacy">See what we store</Link>.</>, "No. An account is optional and only used to save trips."],
];

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([question, , text]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text } })),
};

export default function HelpPage() {
  return (
    <EditorialPage eyebrow="Help" title="Questions, answered." intro="How GlobTrek works, how it makes money, and who to contact about a booking.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="max-w-[var(--width-reading)] divide-y divide-black/10 border-y border-black/10">
        {faqs.map(([question, answer]) => (
          <details key={question} className="group">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-medium tracking-tight-1 [&::-webkit-details-marker]:hidden">
              {question}
              <span aria-hidden="true" className="text-xl text-subtle transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <div className="pb-6 text-base leading-7 text-muted [&_a]:text-ink [&_a]:underline [&_a]:decoration-black/25 [&_a]:underline-offset-4">{answer}</div>
          </details>
        ))}
      </div>
      <p className="mt-12 text-base text-muted">Still stuck? <Link href="/contact" className="text-ink underline decoration-black/25 underline-offset-4">Contact GlobTrek</Link>.</p>
    </EditorialPage>
  );
}

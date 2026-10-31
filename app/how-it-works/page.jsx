import Link from "next/link";
import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "How it works",
  description: "How GlobTrek turns a few answers into one affordable trip, and how trips are picked.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  {
    number: "01",
    title: "Tell us how you travel",
    body: "Seven short questions: setting, pace, trip length, stay style, what matters most, budget, and when and where you're leaving from.",
  },
  {
    number: "02",
    title: "Get one trip",
    body: "GlobTrek compares your answers with each destination and shows the one that fits best, with stays, things to do and places to eat.",
  },
  {
    number: "03",
    title: "Book with the partner",
    body: "When you're ready, continue to Booking.com or another partner to see live prices and book. The partner handles payment and the reservation.",
  },
];

const method = [
  ["Budget comes first", "Each destination has a cost model for lodging, food, activities and local transport, adjusted by month. A trip is only shown when its typical estimate fits your budget. The model leans toward clean, well-reviewed budget and mid-range stays, not luxury."],
  ["Fit, not volume", "Your setting, pace and priorities are matched against each destination's profile. The result says which of your answers it matches, so you can see why it was picked."],
  ["Famous or hidden, your call", "Every destination has a knownness score from 0 (hidden gem) to 100 (world famous). The slider in the quiz sets which end of that scale you want."],
  ["Real places only", "Hotels are matched to real listings, and a booking link only appears once it has been verified. When a rating, price or photo isn't available, it isn't shown. GlobTrek doesn't fill gaps with guesses."],
];

export default function HowItWorksPage() {
  return (
    <EditorialPage eyebrow="How it works" title="How it works" intro="A few quick questions, one affordable trip, no pile of tabs.">
      {steps.map((step) => (
        <EditorialSection number={step.number} title={step.title} key={step.number}>
          <p>{step.body}</p>
        </EditorialSection>
      ))}
      <section id="method" className="scroll-mt-28 pt-16">
        <p className="eyebrow">How we pick trips</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight-2 sm:text-4xl">The method, plainly.</h2>
        <dl className="mt-8 grid max-w-4xl gap-x-12 gap-y-8 sm:grid-cols-2">
          {method.map(([term, body]) => (
            <div key={term}>
              <dt className="text-lg font-medium tracking-tight-1">{term}</dt>
              <dd className="mt-2 text-base leading-7 text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="pt-12">
        <Link className="btn btn-primary" href="/discover">Find my trip</Link>
      </div>
    </EditorialPage>
  );
}

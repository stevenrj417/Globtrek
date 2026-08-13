import Link from "next/link";
import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "How It Works | GlobTrek",
  description: "How GlobTrek turns traveler preferences into considered trip recommendations.",
};

const steps = [
  {
    number: "01",
    title: "Tell us how you travel",
    body: "Answer a short set of questions about pace, interests, destination preferences, accommodation style, budget, and timing.",
  },
  {
    number: "02",
    title: "GlobTrek builds your match",
    body: "Your preferences are compared with the character of each destination so the recommendation reflects the way you want the trip to feel—not a generic search-result list.",
  },
  {
    number: "03",
    title: "Book with the provider",
    body: "When a recommendation is bookable through an external travel service, you continue to that provider to review final availability, pricing, terms, and complete the reservation.",
  },
];

export default function HowItWorksPage() {
  return (
    <EditorialPage
      eyebrow="The process"
      title="How it works"
      intro="A considered route from personal preferences to a trip that makes sense."
    >
      {steps.map((step) => (
        <EditorialSection number={step.number} title={step.title} key={step.number}>
          <p>{step.body}</p>
        </EditorialSection>
      ))}
      <div className="pt-12">
        <Link className="inline-flex min-h-12 items-center bg-[#171717] px-7 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-black" href="/discover">
          Start your match
        </Link>
      </div>
    </EditorialPage>
  );
}

import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "Terms | GlobTrek",
  description: "Practical terms for the current GlobTrek travel discovery product.",
};

export default function TermsPage() {
  return (
    <EditorialPage
      eyebrow="Terms"
      title="Using GlobTrek."
      intro="These practical early-access terms describe the current product. They should be reviewed by qualified counsel before commercial booking functionality launches."
    >
      <EditorialSection number="01" title="Travel discovery and recommendations">
        <p>
          GlobTrek provides destination discovery, preference matching, editorial planning information, and links that may lead to external travel services. Recommendations are informational and depend on the preferences and limited destination information available to the product.
        </p>
      </EditorialSection>
      <EditorialSection number="02" title="Information can change">
        <p>
          Trip estimates, destination information, schedules, and suggested itineraries may be incomplete or change over time. Confirm important travel details directly with the relevant provider before relying on them.
        </p>
      </EditorialSection>
      <EditorialSection number="03" title="External providers and bookings">
        <p>
          Final pricing, availability, taxes, fees, cancellation rules, and booking terms are determined by the external provider. A booking completed on another service is subject to that service’s terms and policies. The current GlobTrek product is not represented as the merchant of record and does not process reservation payments.
        </p>
      </EditorialSection>
      <EditorialSection number="04" title="Early-access status">
        <p>
          Features and recommendation logic may evolve. Do not use GlobTrek as the sole source for visa, health, safety, accessibility, insurance, or other high-stakes travel decisions.
        </p>
      </EditorialSection>
      <EditorialSection number="05" title="Business details to complete">
        <p>
          Product owner TODO: insert the responsible business entity, notice address, governing law, dispute process, and counsel-approved effective date before commercial launch.
        </p>
      </EditorialSection>
    </EditorialPage>
  );
}

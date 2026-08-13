import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "Affiliate Disclosure | GlobTrek",
  description: "How affiliate links may support GlobTrek.",
};

export default function AffiliateDisclosurePage() {
  return (
    <EditorialPage
      eyebrow="Affiliate disclosure"
      title="A clear route to booking."
      intro="Some links on GlobTrek may be affiliate links. That relationship should be understandable before you leave the site."
    >
      <EditorialSection number="01" title="How affiliate links work">
        <p>
          GlobTrek may receive compensation when a traveler follows an eligible link and completes a qualifying action or booking with an external provider. Compensation supports the product and does not turn GlobTrek into the booking provider.
        </p>
      </EditorialSection>
      <EditorialSection number="02" title="Pricing and decisions">
        <p>
          An affiliate relationship does not guarantee that a price is the lowest available or that pricing is unaffected in every circumstance. Compare the provider’s final price, availability, fees, and terms before booking.
        </p>
      </EditorialSection>
      <EditorialSection number="03" title="Where the transaction happens">
        <p>
          When you continue to an external provider, that provider controls the transaction, payment, reservation, customer service, and applicable terms. GlobTrek will identify external booking transitions near active booking links.
        </p>
      </EditorialSection>
    </EditorialPage>
  );
}

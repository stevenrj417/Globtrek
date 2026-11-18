import { EditorialPage, EditorialSection } from "../components/EditorialPage";
import { BookingPartnerBadge } from "../components/PartnerLogo";
import { AFFILIATE_DISCLOSURE } from "../lib/site";

export const metadata = {
  title: "Affiliate disclosure",
  description: "How GlobTrek earns money: affiliate commissions from Booking.com (through CJ Affiliate) and WeGoTrip (through Travelpayouts). Free to use; you pay the provider directly.",
  alternates: { canonical: "/affiliate-disclosure" },
};

export default function AffiliateDisclosurePage() {
  return (
    <EditorialPage updated="2026-11-11"
      eyebrow="Affiliate disclosure"
      title="A clear route to booking."
      intro="GlobTrek is a Booking.com affiliate through the CJ Affiliate network, and a WeGoTrip affiliate for tours and tickets through Travelpayouts. We make those relationships clear before you leave the site."
    >
      <BookingPartnerBadge className="mb-12" />
      <EditorialSection number="01" title="Our partner relationships">
        <p>
          <strong>{AFFILIATE_DISCLOSURE}</strong> GlobTrek is a Booking.com affiliate through the CJ Affiliate network: we may receive a commission when a traveler follows an eligible Booking.com link and completes a qualifying booking. Tour and ticket links go to WeGoTrip through the Travelpayouts partner network, and may earn a commission the same way. Being an affiliate is not an endorsement by Booking.com or WeGoTrip. Compensation supports GlobTrek and does not turn GlobTrek into the booking provider. You pay the travel provider directly.
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

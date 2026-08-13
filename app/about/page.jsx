import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "About | GlobTrek",
  description: "Why GlobTrek is building a more considered way to discover and organize travel.",
};

export default function AboutPage() {
  return (
    <EditorialPage
      eyebrow="About GlobTrek"
      title="Start with the traveler."
      intro="Travel planning has become a collection of tabs. Flights in one place. Hotels in another. Saved restaurants somewhere else. Experiences buried in screenshots."
    >
      <EditorialSection number="01" title="A more considered starting point">
        <p>
          GlobTrek is being built around a simpler idea: understand how someone wants to travel, then bring the relevant pieces of the trip together in one coherent recommendation.
        </p>
      </EditorialSection>
      <EditorialSection number="02" title="Discovery before inventory">
        <p>
          Preferences such as pace, setting, stay style, interests, timing, and budget help organize destination, accommodation, and experience options around fit rather than volume.
        </p>
      </EditorialSection>
      <EditorialSection number="03" title="Clear handoff to booking services">
        <p>
          GlobTrek is a discovery and curation layer. When an option can be booked through an external travel provider, final pricing, availability, terms, payment, and the reservation are handled on that provider’s service.
        </p>
      </EditorialSection>
    </EditorialPage>
  );
}

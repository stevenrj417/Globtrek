import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "About",
  description: "Why GlobTrek gives you one affordable trip instead of a pile of tabs.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <EditorialPage
      eyebrow="About GlobTrek"
      title="Start with the traveler."
      intro="Planning a trip has turned into a pile of tabs. Flights in one, hotels in another, restaurants saved somewhere else."
      image="/quiz/v2/five-nights.jpg"
      imageAlt="Lisbon rooftops and the Tagus"
    >
      <EditorialSection number="01" title="A simpler starting point">
        <p>GlobTrek starts with how you want to travel, then brings the trip together in one recommendation.</p>
      </EditorialSection>
      <EditorialSection number="02" title="Fit before volume">
        <p>Your pace, setting, stay style, interests, timing and budget decide what you see. You get the trip that fits, not the longest list.</p>
      </EditorialSection>
      <EditorialSection number="03" title="A clear handoff to booking">
        <p>GlobTrek picks the trip. Partners like Booking.com handle the booking: final price, availability, payment and the reservation itself.</p>
      </EditorialSection>
    </EditorialPage>
  );
}

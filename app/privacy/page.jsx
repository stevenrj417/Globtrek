import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "Privacy | GlobTrek",
  description: "How the current GlobTrek product handles quiz preferences and third-party services.",
};

export default function PrivacyPage() {
  return (
    <EditorialPage
      eyebrow="Privacy"
      title="What the current product handles."
      intro="This notice describes the code and services used by the current early-access version of GlobTrek. It avoids promises the product is not yet equipped to make."
    >
      <EditorialSection number="01" title="Information you provide">
        <p>
          The discovery quiz asks about travel setting, pace, companions, accommodation style, interests, budget preference, trip length, and optional travel dates or flexibility.
        </p>
      </EditorialSection>
      <EditorialSection number="02" title="Quiz storage and recommendation processing">
        <p>
          Quiz answers and dates are stored in your browser using localStorage so the results page can read them. They remain there until browser storage is cleared or overwritten by a later quiz.
        </p>
        <p>
          The answers are sent to GlobTrek’s server-side matching endpoint. When server-side OpenAI functionality is configured, those preferences may be sent to OpenAI to rank the limited destination set and prepare recommendation text. The current code does not include an account database or booking database.
        </p>
      </EditorialSection>
      <EditorialSection number="03" title="Technical information and external content">
        <p>
          Hosting providers and services requested by your browser may receive standard technical information such as IP address, browser details, request time, and requested URL. Editorial photography is loaded from Unsplash.
        </p>
      </EditorialSection>
      <EditorialSection number="04" title="External booking providers">
        <p>
          If you follow a booking link, the external provider controls its own site, data collection, pricing, availability, payment, reservation, and privacy practices. Review that provider’s notices before completing a transaction.
        </p>
      </EditorialSection>
      <EditorialSection number="05" title="Details still to be confirmed">
        <p>
          Product owner TODO: add the responsible legal entity, public privacy contact, jurisdiction-specific rights process, and any business retention practices introduced beyond the browser storage described above.
        </p>
      </EditorialSection>
    </EditorialPage>
  );
}

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
          When you create a share link, the trip preferences needed to reproduce that result are encoded in the link itself. Anyone with that link can view those preferences. GlobTrek also uses privacy-friendly first-party analytics to understand page visits and actions such as quiz completion and provider-link clicks; payment details are never collected by GlobTrek.
        </p>
        <p>
          The answers are sent to GlobTrek’s server-side matching endpoint. When server-side OpenAI functionality is configured, those preferences may be sent to OpenAI to rank the limited destination set and prepare recommendation text.
        </p>
      </EditorialSection>
      <EditorialSection number="03" title="Optional accounts and saved trips">
        <p>
          You can use GlobTrek without an account. If you choose to create one, Supabase processes authentication and GlobTrek stores the trips you deliberately save, including the destination, dates, travelers, preferences, itinerary, and selected trip components. Private saved trips are protected so an authenticated user can access only their own records. Account creation does not enroll you in marketing email, and emailing a trip does not create an account.
        </p>
      </EditorialSection>
      <EditorialSection number="04" title="Technical information and external content">
        <p>
          Hosting providers and services requested by your browser may receive standard technical information such as IP address, browser details, request time, and requested URL. Editorial photography is loaded from Unsplash. Where a hotel is confidently matched, GlobTrek may request property information and photography from Google Maps Platform through GlobTrek’s server. Google processes those requests under the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="underline">Google Privacy Policy</a>.
        </p>
      </EditorialSection>
      <EditorialSection number="05" title="External booking providers">
        <p>
          If you follow a booking link, the external provider controls its own site, data collection, pricing, availability, payment, reservation, and privacy practices. Review that provider’s notices before completing a transaction.
        </p>
      </EditorialSection>
      <EditorialSection number="06" title="Details still to be confirmed">
        <p>
          Product owner TODO: add the responsible legal entity, public privacy contact, jurisdiction-specific rights process, and any business retention practices introduced beyond the browser storage described above.
        </p>
      </EditorialSection>
    </EditorialPage>
  );
}

import Link from "next/link";
import { EditorialPage, EditorialSection } from "../../components/EditorialPage";
import { CONTACT_EMAIL, LEGAL_NAME } from "../../lib/site";

export const metadata = {
  title: "Booking Assistant privacy policy",
  description: "How the GlobTrek Booking Assistant Chrome extension handles traveler details: stored on your device, never sent to GlobTrek, never sold.",
  alternates: { canonical: "/booking-assistant/privacy" },
};

const link = "text-ink underline decoration-black/25 underline-offset-4";

export default function AssistantPrivacyPage() {
  return <EditorialPage updated="2026-11-18"
    eyebrow="Booking Assistant · Privacy"
    title="Your details stay on your device."
    intro="This policy covers the GlobTrek One Tab Booking Assistant, a Chrome extension. The website's own practices are in the main privacy notice."
  >
    <EditorialSection number="01" title="What the extension stores">
      <p>Only what you enter: each traveler&apos;s first and last name, an email address, a phone number and an optional note for partners. It also keeps trip checklists you start from GlobTrek (destination, dates, party size, partner links and booking statuses) for up to 14 days.</p>
      <p>Version 0.1.0 also offered optional fields such as birth dates, home address, loyalty and Known Traveler numbers and flight preferences. Anything you saved there stays on your computer until you delete it, and it is erased by <strong>Forget all my information</strong>.</p>
      <p>With <strong>Save on this device</strong>, this is kept in the extension&apos;s Chrome storage on your computer. With <strong>Use once and forget</strong>, it is held in memory and erased when Chrome closes. It is not synced to other devices or uploaded anywhere.</p>
    </EditorialSection>
    <EditorialSection number="02" title="Passports">
      <p>The assistant does not ask for passport details. Version 0.1.0 offered optional passport storage, off by default; anything saved with it is encrypted on your device (AES-256-GCM with a key from a passphrase only you know) and can be deleted in Privacy &amp; data.</p>
    </EditorialSection>
    <EditorialSection number="03" title="What it never stores or reads">
      <p>Card numbers, CVV or security codes, online-banking credentials, partner-site passwords and one-time codes. The extension refuses to save anything that looks like a card number, never reads payment fields on partner pages, and never clicks a book, reserve, confirm, agree or pay button. Payment is made on the partner&apos;s site, where Chrome&apos;s own payment autofill can help if you use it.</p>
    </EditorialSection>
    <EditorialSection number="04" title="Who receives your details">
      <p>Only the partner sites you open from your trip, and only when you ask the assistant to fill a page (or turn on automatic filling for partners you have allowed). Before anything opens, the assistant lists the details it will use and the sites that will receive them. Each partner then handles what you submit under its own privacy policy.</p>
      <p>GlobTrek&apos;s website learns only whether the extension is installed and each booking&apos;s status (for example &ldquo;Opened&rdquo; or &ldquo;Ready to pay&rdquo;). It never receives your traveler details. The extension contains no analytics or crash reporting and makes no network requests of its own.</p>
    </EditorialSection>
    <EditorialSection number="05" title="Limited Use">
      <p>The use of information received from the extension adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Your data is used only to fill booking forms you ask it to fill. It is not sold, not used for advertising, not used to determine creditworthiness, and not read by people at GlobTrek.</p>
    </EditorialSection>
    <EditorialSection number="06" title="Your controls">
      <p>In the assistant&apos;s Privacy &amp; data screen you can see a list of every kind of detail stored, export it, delete passports, switch between saving and use-once, remove partner site access, and <strong>Forget all my information</strong>, which erases everything the extension stored. Removing the extension from Chrome also deletes its storage.</p>
    </EditorialSection>
    <EditorialSection number="07" title="Affiliate links">
      <p>GlobTrek is a Booking.com affiliate partner. The assistant opens the same links shown on your trip page, only when you click, and may earn GlobTrek a commission on qualifying bookings at no cost to you. It never adds or replaces affiliate codes on pages you visit yourself. <Link href="/affiliate-disclosure" className={link}>Affiliate disclosure</Link>.</p>
    </EditorialSection>
    <EditorialSection number="08" title="Changes and contact">
      <p>If these practices change, the extension will tell you before the change applies. This extension is published by {LEGAL_NAME}, Oregon, United States.{CONTACT_EMAIL ? <> Questions: <a className={link} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</> : <> Questions: see <Link className={link} href="/contact">Contact</Link>.</>}</p>
    </EditorialSection>
  </EditorialPage>;
}

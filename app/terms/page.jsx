import Link from "next/link";
import { EditorialPage, EditorialSection } from "../components/EditorialPage";
import { AFFILIATE_DISCLOSURE, CONTACT_EMAIL, LEGAL_NAME } from "../lib/site";

export const metadata = {
  title: "Terms",
  description: "The terms for using GlobTrek's free trip planner.",
};

export default function TermsPage() {
  return (
    <EditorialPage updated="2026-11-11"
      eyebrow="Terms"
      title="Using GlobTrek."
      intro="GlobTrek is a free trip planner. It suggests a trip and links you to travel providers; it doesn't sell travel or take bookings."
    >
      <EditorialSection number="01" title="What GlobTrek does">
        <p>
          GlobTrek suggests a destination, an estimated budget, places to stay, things to do and links to travel providers, based on your answers. Suggestions are information to help you plan, not advice or a guarantee that a trip will suit you.
        </p>
      </EditorialSection>
      <EditorialSection number="02" title="Estimates are not live prices">
        <p>
          Trip totals are GlobTrek&apos;s estimates from published fare data, typical local costs and prices previously seen on partner sites. They are not quotes. Prices, availability, schedules and opening hours change; confirm them with each provider before you rely on them.
        </p>
      </EditorialSection>
      <EditorialSection number="03" title="Bookings happen with providers">
        <p>
          GlobTrek doesn&apos;t make reservations, isn&apos;t the merchant of record and doesn&apos;t process payments. When you book, you pay the travel provider directly, and that provider&apos;s price, fees, cancellation rules and terms apply. {AFFILIATE_DISCLOSURE} <Link href="/affiliate-disclosure" className="underline">How this works</Link>.
        </p>
        <p>Some place details and photos come from Google Maps and are subject to the <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener" className="underline">Google Maps/Google Earth Additional Terms of Service</a>.</p>
      </EditorialSection>
      <EditorialSection number="04" title="Entry rules, safety and health">
        <p>
          Passport, visa, health and safety requirements depend on your nationality and change often. GlobTrek links to official government pages, but you&apos;re responsible for checking the current requirements before you travel. Don&apos;t use GlobTrek as your only source for these decisions.
        </p>
      </EditorialSection>
      <EditorialSection number="05" title="Your account and share links">
        <p>
          Accounts are optional. Keep your sign-in secure. Share links let anyone who has them see that trip; only share them with people you trust. You can delete saved trips and your account at any time. See the <Link href="/privacy" className="underline">Privacy policy</Link> for what&apos;s stored.
        </p>
      </EditorialSection>
      <EditorialSection number="06" title="Fair use">
        <p>
          Don&apos;t misuse the site: no automated scraping, attempts to get around rate limits or security, or use that interferes with other travelers. We may limit access to stop abuse.
        </p>
      </EditorialSection>
      <EditorialSection number="07" title="Changes">
        <p>
          GlobTrek may change features and how recommendations work. When these terms change, the date at the top changes too.
        </p>
      </EditorialSection>
      <EditorialSection number="08" title="Who runs GlobTrek">
        <p>
          This site is operated by {LEGAL_NAME}, based in Oregon, United States.{CONTACT_EMAIL ? <> Questions about these terms: <a className="text-ink underline decoration-black/25 underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</> : <> Questions about these terms: see <Link className="text-ink underline decoration-black/25 underline-offset-4" href="/contact">Contact</Link>.</>}
        </p>
      </EditorialSection>
    </EditorialPage>
  );
}

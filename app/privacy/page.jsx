import Link from "next/link";
import { EditorialPage, EditorialSection } from "../components/EditorialPage";
import { CONTACT_EMAIL, LEGAL_NAME } from "../lib/site";

export const metadata = {
  title: "Privacy",
  description: "What GlobTrek collects, where it goes, how long it's kept, and how to see or delete it.",
};

const link = "text-ink underline decoration-black/25 underline-offset-4";

function Contact() {
  return CONTACT_EMAIL
    ? <a className={link} href={`mailto:${CONTACT_EMAIL}?subject=Privacy%20request`}>{CONTACT_EMAIL}</a>
    : <Link className={link} href="/contact">our contact page</Link>;
}

export default function PrivacyPage() {
  return (
    <EditorialPage updated="2026-11-11"
      eyebrow="Privacy"
      title="What we collect, and what we don't."
      intro="GlobTrek works without an account. This page lists everything the site stores or sends, who processes it, how long it's kept, and how to see or delete it."
    >
      <EditorialSection number="01" title="What you tell us">
        <p>
          The quiz asks for your travel setting, interests, pace, accommodation preference, budget, trip length, dates or season, number of travelers, departure airport and whether to stay in your own country. It never asks for your name, email or payment details.
        </p>
        <p>
          If you choose to, you can also give us an email address (to email yourself a trip or subscribe to updates), create an account, save trips, or send feedback about a result. GlobTrek never takes payments: you book and pay each travel provider directly on their site.
        </p>
      </EditorialSection>
      <EditorialSection number="02" title="What stays in your browser">
        <p>
          Your quiz answers, your current result and its estimate (so the same answers show the same trip), recent trip changes (for &ldquo;Undo&rdquo;), your booking checklist ticks and your chosen stay are kept in this browser&apos;s storage. If you use the booking page&apos;s traveler details form, those details also stay in this browser only; they&apos;re never sent to GlobTrek or put in partner links. Clearing your browser&apos;s site data removes all of it.
        </p>
      </EditorialSection>
      <EditorialSection number="03" title="How a trip is picked">
        <p>
          Your answers are sent to GlobTrek&apos;s server, which picks the destination with fixed rules: the destination must match your setting, budget, trip length and travel month. To write the day-by-day plan, the server sends your quiz answers and the chosen destination (no name, email or account details) to OpenAI. OpenAI processes this under its <a className={link} href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener">privacy policy</a> and API terms. The AI can&apos;t change which destination you get.
        </p>
      </EditorialSection>
      <EditorialSection number="04" title="Share links">
        <p>
          A share link contains your trip&apos;s answers in encrypted form, so it can&apos;t be read or edited, and it expires 90 days after it&apos;s created. Anyone you give it to can see the destination, dates, budget, number of travelers and departure airport. It never includes your name or email. Links to a saved trip can be turned off at any time from your account, and the old link then stops working. Links created before November 11, 2026 hold the answers in readable form and don&apos;t expire; to retire one, make a new link and stop using the old one.
        </p>
      </EditorialSection>
      <EditorialSection number="05" title="Accounts and saved trips">
        <p>
          Accounts are optional and run on Supabase, which handles sign-in. GlobTrek stores your email, name and photo from your sign-in provider, your home airport and currency if you set them, and the trips, places and recent searches you save. Each account can read and change only its own records; this is enforced on GlobTrek&apos;s server and in the database. Creating an account doesn&apos;t sign you up for marketing email.
        </p>
        <p>
          From your <Link className={link} href="/account">account page</Link> you can rename, copy or delete any saved trip, download everything stored for your account as a file, and delete your account. Deleting your account removes your sign-in record, profile, saved trips, saved places, recent views, recent searches and share links immediately.
        </p>
      </EditorialSection>
      <EditorialSection number="06" title="Email">
        <p>
          If you email yourself a trip or subscribe, your email address and subscription choices are stored so we can send what you asked for. Emails are delivered by Resend. Every marketing email has an unsubscribe link, and you can change your choice from your account.
        </p>
      </EditorialSection>
      <EditorialSection number="07" title="Analytics, logs and feedback">
        <p>
          GlobTrek uses Vercel Web Analytics, which doesn&apos;t use cookies, to count page views and actions such as finishing the quiz, opening a booking link or adjusting a trip. These events never include names, emails or phone numbers; the site strips anything that looks like one before sending.
        </p>
        <p>
          Our hosting provider, Vercel, keeps server logs (request details such as IP address, browser and time, plus error reports) for a limited period set by our hosting plan. Feedback you send about a result is written to these logs with the result&apos;s id; emails and phone numbers in feedback text are removed first. Logs aren&apos;t used for advertising.
        </p>
      </EditorialSection>
      <EditorialSection number="08" title="Other services involved">
        <p>
          Vercel hosts the site. Supabase stores accounts and saved trips. OpenAI writes day plans. Google Maps Platform supplies place details and photos, requested by GlobTrek&apos;s server (<a className={link} href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>). Flight fare data comes from Travelpayouts using airport codes only. Resend sends email. Photos also load from Unsplash, Wikimedia Commons and Booking.com&apos;s image servers, which see standard request details from your browser.
        </p>
        <p>
          When you open a booking link, you leave GlobTrek. Booking.com (through our affiliate network, CJ) and other providers control their own sites, cookies, prices, payments and privacy practices.
        </p>
      </EditorialSection>
      <EditorialSection number="09" title="Cookies">
        <p>
          GlobTrek sets cookies only to keep you signed in to an optional account. We don&apos;t use advertising or cross-site tracking cookies.
        </p>
      </EditorialSection>
      <EditorialSection number="10" title="How long we keep things">
        <p>
          Browser storage: until you clear it. Share links: 90 days. Saved trips and account data: until you delete them or your account. Email subscriptions: until you unsubscribe. Server logs and feedback: the hosting plan&apos;s log retention period. Aggregate analytics: kept as counts that don&apos;t identify anyone.
        </p>
      </EditorialSection>
      <EditorialSection number="11" title="Your choices and requests">
        <p>
          You can see, download, correct or delete your account data yourself from your account page. For anything else, such as a question about data in our logs or email list, or a request under the privacy law where you live, contact <Contact />. We&apos;ll verify the request comes from you before acting on it.
        </p>
        <p>
          GlobTrek isn&apos;t directed at children under 13 and doesn&apos;t knowingly collect their information.
        </p>
      </EditorialSection>
      <EditorialSection number="12" title="Booking Assistant extension">
        <p>
          The optional GlobTrek Booking Assistant for Chrome keeps traveler details on your own device and never sends them to GlobTrek. See the <Link className={link} href="/booking-assistant/privacy">Booking Assistant privacy policy</Link>.
        </p>
      </EditorialSection>
      <EditorialSection number="13" title="Who runs GlobTrek">
        <p>
          This site is operated by {LEGAL_NAME}, based in Oregon, United States. Questions about this page: <Contact />. If this policy changes, the date at the top changes too.
        </p>
      </EditorialSection>
    </EditorialPage>
  );
}

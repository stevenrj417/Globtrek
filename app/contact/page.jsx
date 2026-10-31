import Link from "next/link";
import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "Contact",
  description: "How to reach GlobTrek, and who to contact about a booking.",
  alternates: { canonical: "/contact" },
};

// Set CONTACT_EMAIL (and optionally CONTACT_REPLY_TIME, e.g. "within 2 business days")
// in Vercel once the inbox is monitored. Nothing is shown until then.
const email = process.env.CONTACT_EMAIL || "";
const replyTime = process.env.CONTACT_REPLY_TIME || "";

export default function ContactPage() {
  return (
    <EditorialPage eyebrow="Contact" title="Get in touch." intro="The fastest answer depends on what you need.">
      <EditorialSection number="01" title="A question about a booking">
        <p>
          Your reservation is held by the company you booked with, so they can change, cancel or fix it. For stays booked on Booking.com, use <a className="text-ink underline decoration-black/25 underline-offset-4" href="https://www.booking.com/customer-service.html" rel="noopener">Booking.com customer service</a>.
        </p>
      </EditorialSection>
      <EditorialSection number="02" title="A question about GlobTrek">
        <p>
          Most answers are in <Link className="text-ink underline decoration-black/25 underline-offset-4" href="/help">Help</Link>: how GlobTrek makes money, how prices are estimated and how trips are chosen.
        </p>
        {email ? <p>
          Anything else: <a className="text-ink underline decoration-black/25 underline-offset-4" href={`mailto:${email}`}>{email}</a>.{replyTime ? ` We reply ${replyTime}.` : ""}
        </p> : null}
      </EditorialSection>
      <div className="pt-12">
        <Link className="btn btn-primary" href="/discover">Find my trip</Link>
      </div>
    </EditorialPage>
  );
}

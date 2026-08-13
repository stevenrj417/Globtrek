import Link from "next/link";
import { EditorialPage, EditorialSection } from "../components/EditorialPage";

export const metadata = {
  title: "Contact | GlobTrek",
  description: "Contact information for GlobTrek.",
};

export default function ContactPage() {
  return (
    <EditorialPage
      eyebrow="Contact"
      title="A direct line, thoughtfully opened."
      intro="GlobTrek is in early access. A public support address has not yet been configured, so we will not send you to an unmonitored inbox."
    >
      <EditorialSection number="01" title="For now">
        <p>
          You can explore the current product and refine a trip match. A verified public contact channel will be published here before support or booking assistance is offered.
        </p>
        <p className="text-[#707070]">
          Product owner TODO: provide the public support email and responsible business identity.
        </p>
      </EditorialSection>
      <div className="pt-12">
        <Link className="text-xs font-semibold uppercase tracking-[0.08em] text-[#171717] underline decoration-black/25 transition hover:decoration-black" href="/discover">
          Continue to discovery
        </Link>
      </div>
    </EditorialPage>
  );
}

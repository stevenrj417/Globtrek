import { EditorialPage, EditorialSection } from "../components/EditorialPage";
import { SiteFeedbackForm } from "../components/SiteFeedbackForm";

export const metadata = {
  title: "Send feedback",
  description: "Tell GlobTrek what broke, what looked wrong or what would make trip planning easier.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackPage() {
  return (
    <EditorialPage eyebrow="Feedback" title="Tell us what to fix." intro="GlobTrek is new. A broken link, a wrong price or an idea for something better all help.">
      <EditorialSection number="01" title="Send a note">
        <SiteFeedbackForm />
      </EditorialSection>
    </EditorialPage>
  );
}

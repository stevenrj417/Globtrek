import { EditorialPage, EditorialSection } from "../components/EditorialPage";
import { PHOTO_CREDITS } from "../lib/photoCredits";

export const metadata = {
  title: "Photo credits",
  description: "Photographers and licenses for the images used on GlobTrek.",
};

const link = "underline decoration-black/25 underline-offset-4 hover:decoration-black";

export default function PhotoCreditsPage() {
  return (
    <EditorialPage updated="2026-11-11"
      eyebrow="Photo credits"
      title="The people behind the pictures."
      intro="Quiz and homepage photos come from Wikimedia Commons and Unsplash. Each is used under the license shown; we resized them and cropped the Prague view."
    >
      <EditorialSection number="01" title="Quiz and homepage photos">
        <ul className="divide-y divide-black/10 text-base">
          {PHOTO_CREDITS.map((credit) => (
            <li key={credit.image} className="py-3">
              <a href={credit.source} target="_blank" rel="noopener" className={link}>{credit.subject}<span className="sr-only"> (opens in a new tab)</span></a>
              <span className="block text-sm text-subtle">
                {credit.artist} · {credit.licenseUrl ? <a href={credit.licenseUrl} target="_blank" rel="noopener" className={link}>{credit.license}<span className="sr-only"> (opens in a new tab)</span></a> : credit.license}
              </span>
            </li>
          ))}
        </ul>
      </EditorialSection>
    </EditorialPage>
  );
}

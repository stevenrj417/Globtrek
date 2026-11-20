import { guideBySlug } from "../../data/guides";
import { buildGuide, guideCard, publishedGuides } from "../../lib/guides/buildGuide";
import { OG_SIZE, ogPhoto, renderOgImage } from "../../lib/ogImage";

export const alt = "A GlobTrek travel guide";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return publishedGuides().map((guide) => ({ slug: guide.slug }));
}

// Share card: the guide's photo, its title and the one line of numbers its card shows.
export default async function Image({ params }) {
  const { slug } = await params;
  const card = guideCard(buildGuide(guideBySlug(slug)));
  return renderOgImage({
    title: card?.title || "GlobTrek guides",
    subtitle: card?.meta ? (card.meta.startsWith("$") ? `About ${card.meta}` : card.meta) : "Budget-first weekend guides",
    image: ogPhoto(card?.image),
  });
}

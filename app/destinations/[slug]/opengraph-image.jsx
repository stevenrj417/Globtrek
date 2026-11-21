import { destinationBySlug } from "../../data/destinationCatalog";
import { OG_SIZE, ogPhoto, renderOgImage } from "../../lib/ogImage";
import { formatRange } from "../../lib/recommendation/tripEstimate";

export const alt = "A GlobTrek destination";
export const size = OG_SIZE;
export const contentType = "image/png";

// Rendered when a link is first shared, then cached, not all at build time:
// building ~1,000 cards at once got the photos rate-limited by Wikimedia.
export const revalidate = 604800;

export default async function Image({ params }) {
  const { slug } = await params;
  const item = destinationBySlug(slug);
  return renderOgImage({
    title: item ? `${item.name}, ${item.country}` : "GlobTrek",
    subtitle: item ? `5 nights · Est. ${formatRange(item.estimate.low, item.estimate.high)} before flights` : "A few quick questions. One affordable trip.",
    image: ogPhoto(item?.image),
  });
}

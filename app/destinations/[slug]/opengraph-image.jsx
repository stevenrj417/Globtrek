import { destinationBySlug, publishedDestinations } from "../../data/destinationCatalog";
import { OG_SIZE, ogPhoto, renderOgImage } from "../../lib/ogImage";
import { formatRange } from "../../lib/recommendation/tripEstimate";

export const alt = "A GlobTrek destination";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return publishedDestinations.map((item) => ({ slug: item.slug }));
}

export default async function Image({ params }) {
  const { slug } = await params;
  const item = destinationBySlug(slug);
  return renderOgImage({
    title: item ? `${item.name}, ${item.country}` : "GlobTrek",
    subtitle: item ? `5 nights · Est. ${formatRange(item.estimate.low, item.estimate.high)} before flights` : "A few quick questions. One affordable trip.",
    image: ogPhoto(item?.image),
  });
}

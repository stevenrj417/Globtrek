import { OG_SIZE, ogPhoto, renderOgImage } from "./lib/ogImage";

export const alt = "GlobTrek: a few quick questions, one affordable trip";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    title: "One Tab Travel",
    subtitle: "A few quick questions. One affordable trip.",
    image: ogPhoto("https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"),
  });
}

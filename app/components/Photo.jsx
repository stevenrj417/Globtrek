"use client";

import Image from "next/image";

// Wikimedia rate-limits our image optimizer (HTTP 429), so Commons photos load
// straight from Wikimedia's own thumbnail cache. Commons serves only standard
// thumbnail widths, so requests snap up to the nearest one. Other photos use
// Next's optimizer as usual.
const COMMONS_THUMB = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+))\/\d+px-[^/]+$/;
const COMMONS_WIDTHS = [330, 500, 960, 1280, 1920];

function commonsLoader({ src, width }) {
  const [, base, file] = src.match(COMMONS_THUMB);
  const step = COMMONS_WIDTHS.find((size) => size >= width) || 1920;
  return `${base}/${step}px-${file}${/\.svg$/i.test(file) ? ".png" : ""}`;
}

export default function Photo({ alt, ...props }) {
  const commons = typeof props.src === "string" && COMMONS_THUMB.test(props.src);
  return <Image alt={alt} {...props} loader={commons ? commonsLoader : props.loader} />;
}

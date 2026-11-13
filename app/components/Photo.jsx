"use client";

import Image from "next/image";
import { useState } from "react";
import narrowOriginals from "../data/commonsImageWidths.json";

// Wikimedia rate-limits our image optimizer (HTTP 429), so Commons photos load
// straight from Wikimedia's own thumbnail cache. Commons serves only standard
// thumbnail widths, so requests snap up to the nearest one. Other photos use
// Next's optimizer as usual.
const COMMONS_THUMB = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+))\/\d+px-[^/]+$/;
// A link to the full-size original (often several megabytes), with or without a query string.
const COMMONS_ORIGINAL = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f]\/[0-9a-f]{2})\/([^/?#]+\.(?:jpe?g|png|webp))(?:[?#].*)?$/i;
const COMMONS_WIDTHS = [330, 500, 960, 1280, 1920];

// The thumbnail base for a Commons photo, or null for anything else.
function commonsBase(src) {
  if (typeof src !== "string") return null;
  const thumb = src.match(COMMONS_THUMB);
  if (thumb) return { base: thumb[1], file: thumb[2] };
  const original = src.match(COMMONS_ORIGINAL);
  if (original) return { base: `https://upload.wikimedia.org/wikipedia/commons/thumb/${original[1]}/${original[2]}`, file: original[2] };
  return null;
}

function commonsLoader({ src, width }) {
  const { base, file } = commonsBase(src);
  // Commons can't scale a photo up: stay within the original's own width, and
  // use the original itself when it is smaller than every thumbnail size.
  const original = narrowOriginals[file];
  const sizes = original ? COMMONS_WIDTHS.filter((size) => size <= original) : COMMONS_WIDTHS;
  if (!sizes.length) return src;
  const step = sizes.find((size) => size >= width) || sizes[sizes.length - 1];
  return `${base}/${step}px-${file}${/\.svg$/i.test(file) ? ".png" : ""}`;
}

export default function Photo({ alt, onError, ...props }) {
  // Commons can't make a thumbnail wider than the original; if one fails, show
  // the original file itself.
  const [fallback, setFallback] = useState(false);
  if (fallback) return <Image alt={alt} {...props} unoptimized onError={onError} />;
  const commons = Boolean(commonsBase(props.src));
  return <Image alt={alt} {...props} loader={commons ? commonsLoader : props.loader} onError={(event) => { if (commons) setFallback(true); onError?.(event); }} />;
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function ExactPlacePhoto({ placeId, alt, className = "", priority = false }) {
  const [photo, setPhoto] = useState(null);
  useEffect(() => { if (!placeId) return undefined; const controller = new AbortController(); fetch(`/api/places/exact-photo/${encodeURIComponent(placeId)}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((value) => setPhoto(value?.imageUrl ? value : null)).catch((error) => { if (error.name !== "AbortError") setPhoto(null); }); return () => controller.abort(); }, [placeId]);
  if (!photo) return <div className={`bg-placeholder ${className}`} role="img" aria-label={`${alt} photography is loading`} />;
  return <><Image src={photo.imageUrl} alt={alt} fill unoptimized priority={priority} className={className} /><a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 z-10 bg-black/65 px-2 py-1 text-micro uppercase tracking-caps text-white/80">Google{photo.authorAttributions?.[0]?.displayName ? ` · ${photo.authorAttributions[0].displayName}` : ""}</a></>;
}

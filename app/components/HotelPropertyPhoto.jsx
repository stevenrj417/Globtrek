"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function HotelPropertyPhoto({ hotel, destination, index }) {
  const [photo, setPhoto] = useState(hotel.image ? { photoUri: hotel.image, authorAttributions: [], googleMapsUri: null } : null);

  useEffect(() => {
    if (!hotel.googlePhotoManifestUrl) return undefined;
    const controller = new AbortController();
    fetch(hotel.googlePhotoManifestUrl, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((manifest) => { if (manifest?.photos?.[0]?.photoUri) setPhoto(manifest.photos[0]); })
      .catch((error) => { if (error.name !== "AbortError") console.warn("Verified hotel photography is temporarily unavailable."); });
    return () => controller.abort();
  }, [hotel.googlePhotoManifestUrl]);

  if (!photo?.photoUri) {
    return <div className="absolute inset-0 grid place-items-center bg-[#d8d5cf] px-8 text-center text-[10px] uppercase tracking-[0.2em] text-black/45">Property photography being verified</div>;
  }

  const authors = photo.authorAttributions || [];
  const licensedSourceUrl = hotel.imageLicense?.sourcePageUrl || null;
  const licensedAuthor = hotel.imageLicense?.author || null;
  const licensedName = hotel.imageLicense?.licenseName || null;
  const licensedUrl = hotel.imageLicense?.licenseUrl || licensedSourceUrl;
  return <>
    <Image src={photo.photoUri} alt={`${hotel.name} in ${destination.city}`} fill unoptimized={Boolean(hotel.googlePhotoManifestUrl)} className={`object-cover transition duration-700 group-hover:scale-[1.025] ${index === 1 ? "object-[65%_center]" : index === 2 ? "object-[35%_center]" : "object-center"}`} sizes="(min-width:1280px) 33vw,(min-width:768px) 50vw,100vw" quality={88} />
    {hotel.googlePhotoManifestUrl && <div className="absolute right-3 top-3 max-w-[65%] bg-black/55 px-2 py-1 text-right text-[8px] leading-3 text-white/90 backdrop-blur-sm">
      <a href={photo.googleMapsUri || "https://maps.google.com"} target="_blank" rel="noopener" translate="no">Google Maps</a>
      {authors.length > 0 && <span> · {authors.map((author, authorIndex) => <span key={`${author.displayName}-${authorIndex}`}>{authorIndex > 0 ? ", " : "Photo: "}<a href={author.uri || photo.googleMapsUri} target="_blank" rel="noopener">{author.displayName || "Contributor"}</a></span>)}</span>}
    </div>}
    {!hotel.googlePhotoManifestUrl && licensedSourceUrl && <div className="absolute right-3 top-3 max-w-[65%] bg-black/55 px-2 py-1 text-right text-[8px] leading-3 text-white/90 backdrop-blur-sm">
      <a href={licensedSourceUrl} target="_blank" rel="noopener">Photo: {licensedAuthor || hotel.imageSource || "Source"}</a>
      {licensedName && <span> · <a href={licensedUrl} target="_blank" rel="noopener">{licensedName}</a></span>}
    </div>}
  </>;
}

"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { bookingPropertyUrl } from "../data/destinations";
import { normalizeTravelerProfile } from "../lib/recommendation/travelerProfile";
import { BrandMark } from "./BrandMark";
import { SaveItemButton } from "./SaveItemButton";

function money(value, currency = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Math.round(value || 0)); }
  catch { return `$${Math.round(value || 0).toLocaleString("en-US")}`; }
}
function dateLabel(value) { return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : null; }
function locationLabel(hotel, destination) { return hotel.neighborhood || hotel.address?.split(",")?.[0] || destination.city; }
function priceLabel(hotel) {
  if (!hotel?.priceKnown) return "Current price shown by provider";
  return `${money(hotel.estimatedStayLow, hotel.currency)}–${money(hotel.estimatedStayHigh, hotel.currency)} estimated${hotel.priceStale ? " · recheck rate" : ""}`;
}
function ratingLabel(hotel) {
  if (hotel.rating == null) return null;
  return `${hotel.rating} rating${hotel.reviewCount != null ? ` · ${Number(hotel.reviewCount).toLocaleString("en-US")} reviews` : ""}`;
}

function PhotoCredit({ photo, hotel }) {
  const authors = photo?.authorAttributions || [];
  const sourceUrl = authors[0]?.uri || photo?.googleMapsUri || hotel.imageLicense?.sourcePageUrl;
  if (!sourceUrl) return null;
  const label = authors.length ? `Photo: ${authors.map((author) => author.displayName || "Contributor").join(", ")}` : `Photo: ${hotel.imageLicense?.author || hotel.imageSource || "source"}`;
  return <a href={sourceUrl} target="_blank" rel="noopener" className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 text-[8px] text-white/90 backdrop-blur-sm">{label}</a>;
}

function PropertyImage({ photo, hotel, destination, className = "", sizes = "100vw", priority = false, loading = false, fillContainer = false }) {
  const candidates = [...(Array.isArray(photo) ? photo : photo ? [photo] : []), ...(hotel.image ? [{ photoUri: hotel.image, authorAttributions: [], googleMapsUri: null }] : [])];
  const [failedSources, setFailedSources] = useState([]);
  const selected = candidates.find((candidate) => candidate?.photoUri && !failedSources.includes(candidate.photoUri));
  const src = selected?.photoUri;
  const position = fillContainer ? "absolute inset-0" : "relative";
  if (!src) return <div className={`${position} grid place-items-center overflow-hidden bg-[#d8d2c8] px-6 text-center text-[10px] tracking-[.12em] text-black/45 ${loading ? "animate-pulse" : ""} ${className}`}>{loading ? "LOADING VERIFIED PROPERTY PHOTOGRAPHY" : "PROPERTY PHOTOGRAPHY UNAVAILABLE"}</div>;
  return <div className={`${position} overflow-hidden bg-[#d8d2c8] ${className}`}><Image src={src} alt={`${hotel.name}, ${destination.city}`} fill priority={priority} unoptimized={Boolean(hotel.googlePhotoManifestUrl && src !== hotel.image)} sizes={sizes} className="object-cover" onError={() => setFailedSources((current) => [...current, src])} /><PhotoCredit photo={selected} hotel={hotel} /></div>;
}

function useHotelMedia(hotel, limit = 2) {
  const fallback = useMemo(() => hotel.image ? [{ photoUri: hotel.image, authorAttributions: [], googleMapsUri: null }] : [], [hotel.image]);
  const [verifiedPhotos, setVerifiedPhotos] = useState([]);
  const [place, setPlace] = useState(null);
  const [status, setStatus] = useState(hotel.googlePhotoManifestUrl ? "loading" : "settled");
  useEffect(() => {
    if (!hotel.googlePhotoManifestUrl) return undefined;
    const controller = new AbortController();
    const separator = hotel.googlePhotoManifestUrl.includes("?") ? "&" : "?";
    fetch(`${hotel.googlePhotoManifestUrl}${separator}limit=${limit}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((manifest) => {
      if (manifest?.photos?.length) setVerifiedPhotos(manifest.photos.slice(0, limit));
      if (manifest?.place) setPlace(manifest.place);
      setStatus("settled");
    }).catch((error) => { if (error.name !== "AbortError") { setStatus("settled"); console.warn("Verified hotel photography is temporarily unavailable."); } });
    return () => controller.abort();
  }, [hotel.googlePhotoManifestUrl, limit]);
  return { photos: verifiedPhotos.length ? verifiedPhotos : fallback, place, loading: status === "loading" };
}

function HotelDrawer({ hotel, destination, trip, photos, onClose, onChoose, proposalMode = false }) {
  const fullMedia = useHotelMedia(hotel, 5);
  const gallery = fullMedia.photos.length > photos.length ? fullMedia.photos : photos;
  const closeRef = useRef(null);
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown); document.body.style.overflow = "hidden"; closeRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [onClose]);
  const bookingUrl = bookingPropertyUrl(hotel, trip);
  const amenities = (hotel.amenities || []).slice(0, 8);
  return <div className="fixed inset-0 z-[70] flex items-end bg-black/55 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="hotel-detail-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="max-h-[94svh] w-full overflow-y-auto bg-[#f4f0e8] sm:max-w-[1120px]">
      <div className="sticky top-0 z-10 flex justify-end p-3"><button ref={closeRef} type="button" onClick={onClose} aria-label="Close hotel details" className="grid h-11 w-11 place-items-center rounded-full bg-[#171714] text-xl text-white">×</button></div>
      <div className={`-mt-14 grid h-[52svh] gap-1 ${gallery.length === 1 ? "grid-cols-1" : gallery.length === 2 ? "grid-cols-2" : gallery.length === 3 ? "grid-cols-2 grid-rows-2" : "grid-cols-2 grid-rows-2 sm:grid-cols-3"}`}>
        <PropertyImage photo={gallery} hotel={hotel} destination={destination} loading={fullMedia.loading} className={gallery.length > 2 ? "row-span-2" : ""} sizes="(min-width:640px) 50vw,100vw" />
        {gallery.slice(1, 5).map((photo, index) => <PropertyImage key={photo.photoUri || index} photo={photo} hotel={hotel} destination={destination} className={`${gallery.length > 3 && index > 1 ? "hidden sm:block" : ""} min-h-0`} sizes="(min-width:640px) 33vw,50vw" />)}
      </div>
      <div className="grid gap-10 p-7 sm:p-12 lg:grid-cols-[1.25fr_.75fr]">
        <div><p className="text-xs text-black/48">{locationLabel(hotel, destination)}{hotel.starRating ? ` · ${hotel.starRating}-star` : ""}</p><h2 id="hotel-detail-title" className="mt-3 font-serif text-[clamp(2.7rem,5vw,5.2rem)] leading-[.9] tracking-[-.045em]">{hotel.name}</h2>{ratingLabel(hotel) ? <p className="mt-5 text-sm">{ratingLabel(hotel)}</p> : null}{amenities.length ? <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-black/12 pt-6 text-sm text-black/62">{amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul> : null}</div>
        <div className="border-t border-black/15 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"><p className="text-xs text-black/45">Stay</p><p className="mt-2 text-sm">{dateLabel(trip.tripStart) && dateLabel(trip.tripEnd) ? `${dateLabel(trip.tripStart)} — ${dateLabel(trip.tripEnd)}` : `${normalizeTravelerProfile(trip).tripLength} nights`}</p><p className="mt-6 text-xs text-black/45">Price</p><p className="mt-2 font-serif text-2xl">{priceLabel(hotel)}</p>{proposalMode ? <button type="button" onClick={() => { onChoose(hotel); onClose(); }} className="mt-8 flex min-h-14 w-full items-center justify-between bg-[#171714] px-6 text-xs text-white">Add this stay <span aria-hidden="true">→</span></button> : bookingUrl ? <a href={bookingUrl} target="_blank" rel="noopener sponsored" onClick={() => onChoose(hotel)} className="mt-8 flex min-h-14 items-center justify-between bg-[#171714] px-6 text-xs text-white">Check rooms <span aria-hidden="true">↗</span></a> : <p className="mt-8 text-sm text-black/50">Booking link being verified</p>}</div>
      </div>
    </div>
  </div>;
}

function HotelCard({ hotel, destination, trip, index, count, onChoose, onDetails, onPrevious, onNext, priority = false, proposalMode = false, selected = false, compact = false, dense = false }) {
  const { photos, place, loading } = useHotelMedia(hotel);
  const verifiedHotel = { ...hotel, address: place?.formattedAddress || hotel.address, rating: place?.rating ?? hotel.rating, reviewCount: place?.reviewCount ?? hotel.reviewCount };
  const bookingUrl = bookingPropertyUrl(verifiedHotel, trip);
  const profile = normalizeTravelerProfile(trip);
  return <article className={`grid min-w-full snap-center bg-[#e7e0d5] transition-shadow duration-300 ${compact ? "lg:grid-cols-[.9fr_1.1fr]" : "lg:grid-cols-[.72fr_1.28fr]"} ${selected ? "shadow-[0_22px_70px_rgba(23,23,20,.12)]" : ""}`} aria-label={`${hotel.name}, hotel ${index + 1} of ${count}`}>
    <div className={`flex flex-col justify-between p-7 lg:order-1 ${compact ? "sm:p-9 lg:min-h-[480px] lg:p-10" : dense ? "sm:p-8 lg:min-h-[560px] lg:p-10" : "sm:p-10 lg:min-h-[650px] lg:p-12"}`}><div><div className="flex justify-between gap-4 text-[10px] text-black/45"><span>{index === 0 ? "OUR RECOMMENDATION" : "ALTERNATIVE STAY"}</span><span className="font-serif text-base text-black">{String(index + 1).padStart(2, "0")} <i className="mx-1 not-italic text-black/25">/</i> {String(count).padStart(2, "0")}</span></div><button type="button" onClick={() => onDetails({ hotel: verifiedHotel, photos })} className="mt-6 block text-left"><h3 className={`font-serif leading-[.9] tracking-[-.045em] ${compact ? "text-[clamp(2.5rem,4vw,4.2rem)]" : dense ? "text-[clamp(2.35rem,4vw,4.3rem)]" : "text-[clamp(2.7rem,5vw,5.4rem)]"}`}>{verifiedHotel.name}</h3></button><p className="mt-5 text-sm text-black/58">{locationLabel(verifiedHotel, destination)}{verifiedHotel.starRating ? ` · ${verifiedHotel.starRating}-star` : ""} · {profile.tripLength} nights</p>{ratingLabel(verifiedHotel) ? <p className="mt-2 text-sm">{ratingLabel(verifiedHotel)}</p> : null}<p className="mt-3 text-sm font-medium">{priceLabel(verifiedHotel)}</p>{verifiedHotel.amenities?.length ? <p className="mt-6 text-sm leading-6 text-black/55">{verifiedHotel.amenities.slice(0, compact || dense ? 3 : 5).join(" · ")}</p> : null}</div>
      <div className="mt-10"><div className="flex gap-5 text-xs"><button type="button" onClick={() => onDetails({ hotel: verifiedHotel, photos })} className="border-b border-black/35 pb-1">View details</button><SaveItemButton item={{ type: "hotel", key: verifiedHotel.id, title: verifiedHotel.name, subtitle: `${destination.city}, ${destination.country}`, imageUrl: verifiedHotel.image || null, data: { destinationAirport: destination.airport, bookingUrl: verifiedHotel.bookingUrl || null } }} className="text-xs text-black/55" /></div>{proposalMode ? <button type="button" onClick={() => onChoose(verifiedHotel)} className={`mt-7 flex min-h-14 w-full items-center justify-between px-6 text-xs ${selected ? "border border-black/20 bg-transparent text-black" : "bg-[#171714] text-white"}`}>{selected ? "Selected for your trip" : "Select this stay"}<span aria-hidden="true">{selected ? "✓" : "→"}</span></button> : bookingUrl ? <a href={bookingUrl} target="_blank" rel="noopener sponsored" onClick={() => onChoose(verifiedHotel)} className="mt-7 flex min-h-14 items-center justify-between bg-[#171714] px-6 text-xs text-white">Check rooms <span aria-hidden="true">↗</span></a> : <p className="mt-7 text-sm text-black/45">Booking link being verified</p>}</div></div>
    <div onClick={(event) => { if (!event.target.closest("a,button")) { proposalMode ? onChoose(verifiedHotel) : onDetails({ hotel: verifiedHotel, photos }); } }} className={`group relative aspect-[4/5] cursor-pointer lg:order-2 lg:aspect-auto ${compact ? "lg:min-h-[480px]" : dense ? "lg:min-h-[560px]" : "lg:min-h-[650px]"}`}><PropertyImage photo={photos} hotel={verifiedHotel} destination={destination} priority={priority} loading={loading} fillContainer sizes="(min-width:1024px) 64vw,100vw" />{selected && proposalMode ? <span className="absolute right-5 top-5 z-10 grid h-14 w-20 place-items-center rounded-full bg-[#f4f0e8]/95 shadow-sm"><BrandMark className="!h-7 !w-12" /></span> : null}<button type="button" onClick={(event) => { event.stopPropagation(); onPrevious(); }} aria-label="Previous hotel" className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#f4f0e8]/90 text-lg text-black backdrop-blur-sm transition hover:bg-white sm:left-5">←</button><button type="button" onClick={(event) => { event.stopPropagation(); onNext(); }} aria-label="Next hotel" className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#f4f0e8]/90 text-lg text-black backdrop-blur-sm transition hover:bg-white sm:right-5">→</button></div>
  </article>;
}

export function HotelExperience({ destination, quiz, tripContext = quiz, budgetPlan, onSelected, proposalMode = false, selectedHotelId = null, compact = false, dense = false }) {
  const [catalogHotels, setCatalogHotels] = useState(null);
  const [catalogError, setCatalogError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drawer, setDrawer] = useState(null);
  const railRef = useRef(null);
  const hotels = catalogHotels || [];
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hotels/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationId: destination.id || destination.airport, quiz }), signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("catalog_unavailable"); return response.json(); })
      .then((payload) => setCatalogHotels(Array.isArray(payload?.hotels) ? payload.hotels : []))
      .catch((error) => { if (error.name !== "AbortError") { setCatalogHotels([]); setCatalogError(true); } });
    return () => controller.abort();
  }, [destination.id, destination.airport, quiz]);
  useEffect(() => { const raw = window.localStorage.getItem(`globtrekStay:${destination.city}`); if (!raw) return; try { onSelected?.(JSON.parse(raw)); } catch {} }, [destination.city, onSelected]);
  useEffect(() => { if (!proposalMode || !hotels.length || selectedHotelId) return; choose(hotels[0]); }, [proposalMode, hotels, selectedHotelId]); // eslint-disable-line react-hooks/exhaustive-deps
  function choose(hotel) { const choice = { ...hotel, type: hotel.type || "curated" }; window.localStorage.setItem(`globtrekStay:${destination.city}`, JSON.stringify(choice)); onSelected?.(choice); track("hotel_selected", { destination: destination.city, hotel: choice.name }); }
  function goTo(index) { if (!hotels.length) return; const next = (index + hotels.length) % hotels.length; setActiveIndex(next); setDrawer(null); railRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); }
  function syncMobileIndex(event) { const width = event.currentTarget.clientWidth; if (width) setActiveIndex(Math.round(event.currentTarget.scrollLeft / width)); }
  return <section id="hotel-selection" className={`scroll-mt-20 px-4 ${compact ? "py-14 sm:px-8 sm:py-20" : dense ? "py-14 sm:px-8 sm:py-20" : "py-20 sm:px-8 sm:py-28"}`} aria-labelledby="stay-heading"><div className={`mx-auto ${compact ? "max-w-[1120px]" : "max-w-[1400px]"}`}><header className={`flex items-end justify-between gap-8 ${dense ? "mb-8 sm:mb-10" : "mb-10 sm:mb-14"}`}><div><p className="text-xs text-black/42">Your stay</p><h2 id="stay-heading" className={`mt-3 font-serif leading-[.88] tracking-[-.05em] ${compact ? "text-[clamp(2.8rem,5vw,5rem)]" : dense ? "text-[clamp(2.7rem,5vw,5rem)]" : "text-[clamp(3.2rem,7vw,7rem)]"}`}>{compact ? "Before departure." : "Where the trip settles in."}</h2></div><p className="hidden max-w-xs text-right text-sm leading-6 text-black/48 sm:block">Matched to your budget, pace, and location. Use the arrows to compare the shortlist.</p></header>
    {catalogHotels === null ? <div className="grid min-h-[360px] place-items-center bg-[#e7e0d5] text-sm text-black/48">Matching verified stays…</div> : hotels.length ? <div ref={railRef} onScroll={syncMobileIndex} className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-hidden">{hotels.map((hotel, index) => <div key={hotel.id || hotel.name} className={`min-w-full ${index === activeIndex ? "lg:block" : "lg:hidden"}`}><HotelCard hotel={hotel} destination={destination} trip={tripContext} index={index} count={hotels.length} onChoose={choose} onDetails={setDrawer} onPrevious={() => goTo(activeIndex - 1)} onNext={() => goTo(activeIndex + 1)} priority={index === 0} proposalMode={proposalMode} selected={(selectedHotelId || "") === (hotel.id || hotel.name)} compact={compact} dense={dense} /></div>)}</div> : <div className="grid min-h-[360px] place-items-center bg-[#e7e0d5] px-8 text-center"><div><p className="font-serif text-3xl">Verified stays are still being prepared.</p><p className="mt-3 text-sm text-black/50">{catalogError ? "Recommendations are temporarily unavailable. Please try again shortly." : "This destination does not yet have a complete verified shortlist."}</p></div></div>}
    <div className="mt-6 flex items-center justify-between"><p className="text-xs text-black/45 sm:hidden">{hotels.length ? "Swipe to compare stays" : "Verified inventory only"}</p><p className="hidden text-xs text-black/45 sm:block">{hotels.length ? `${activeIndex + 1} of ${hotels.length}` : "No unverified substitutes"}</p><button type="button" onClick={() => choose({ type: "none", name: "No hotel needed" })} className="text-xs text-black/48">I already have a stay</button></div>
  </div>{drawer ? <HotelDrawer {...drawer} destination={destination} trip={tripContext} onClose={() => setDrawer(null)} onChoose={choose} proposalMode={proposalMode} /> : null}</section>;
}

// A map you can drag and zoom (OpenStreetMap), with buttons that open the same
// spot in Google Maps. Coordinates come from GlobTrek's own catalog.
export function ExploreMap({ latitude, longitude, label, query, zoomKm = 3, className = "", height = "h-[340px] sm:h-[420px]" }) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const dLat = zoomKm / 111;
  const dLon = zoomKm / (111 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180)));
  const bbox = [longitude - dLon, latitude - dLat, longitude + dLon, latitude + dLat].map((value) => value.toFixed(5)).join(",");
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const place = encodeURIComponent(query || `${latitude},${longitude}`);
  const google = `https://www.google.com/maps/search/?api=1&query=${place}`;
  const nearby = `https://www.google.com/maps/search/things+to+do/@${latitude.toFixed(5)},${longitude.toFixed(5)},14z`;
  return <div className={className}>
    <div className={`relative overflow-hidden border border-black/10 bg-placeholder ${height}`}>
      <iframe title={`Map of ${label}`} src={embed} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full border-0" />
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs">Map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" className="underline">OpenStreetMap</a> contributors</p>
      <div className="flex flex-wrap gap-2">
        <a href={nearby} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center border border-black/20 px-4 text-micro font-medium uppercase tracking-label transition-colors hover:border-black">Things to do nearby ↗</a>
        <a href={google} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center bg-black px-4 text-micro font-medium uppercase tracking-label text-white">Open in Google Maps ↗</a>
      </div>
    </div>
  </div>;
}

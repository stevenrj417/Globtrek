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

// A plain OpenStreetMap view framing a set of points (a road trip's stops or a
// cruise's ports). Free, no key; used where the paid Google map is switched off.
export function OsmAreaFrame({ points, title }) {
  const valid = (points || []).filter((point) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude));
  if (!valid.length) return null;
  const lats = valid.map((point) => point.latitude);
  const lons = valid.map((point) => point.longitude);
  const padLat = Math.max(0.2, (Math.max(...lats) - Math.min(...lats)) * 0.15);
  const padLon = Math.max(0.2, (Math.max(...lons) - Math.min(...lons)) * 0.15);
  const bbox = [Math.min(...lons) - padLon, Math.min(...lats) - padLat, Math.max(...lons) + padLon, Math.max(...lats) + padLat].map((value) => value.toFixed(4)).join(",");
  return <iframe title={title} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full border-0" />;
}

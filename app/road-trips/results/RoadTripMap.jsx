"use client";

import { useEffect, useRef } from "react";

export function RoadTripMap({ route, onReveal }) {
  const containerRef = useRef(null);
  const revealRef = useRef(onReveal);
  useEffect(() => { revealRef.current = onReveal; }, [onReveal]);

  useEffect(() => {
    let map;
    let frame;
    let cancelled = false;
    const markers = [];

    async function mount() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      const fallback = route.stops.map((stop) => [stop.longitude, stop.latitude]);
      const response = await fetch(`/api/road-trips/route?id=${encodeURIComponent(route.id)}`).catch(() => null);
      const payload = response?.ok ? await response.json().catch(() => null) : null;
      const coordinates = Array.isArray(payload?.coordinates) && payload.coordinates.length > 1 ? payload.coordinates : fallback;
      if (cancelled) return;

      map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", { subdomains: "abc", maxZoom: 19, attribution: "© OpenStreetMap contributors © CARTO" }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      const latLngs = coordinates.map(([longitude, latitude]) => [latitude, longitude]);
      const leftPadding = window.innerWidth >= 768 ? Math.min(window.innerWidth * 0.43, 620) : 45;
      map.fitBounds(L.latLngBounds(latLngs), { paddingTopLeft: [leftPadding, 75], paddingBottomRight: [55, 90], maxZoom: 8, animate: false });
      const shadow = L.polyline([latLngs[0], latLngs[0]], { color: "#f7f2e8", weight: 8, opacity: 0.88, lineCap: "round" }).addTo(map);
      const line = L.polyline([latLngs[0], latLngs[0]], { color: "#9b7b43", weight: 3.5, opacity: 1, lineCap: "round" }).addTo(map);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const startedAt = performance.now();
      const duration = reduced ? 1 : 4_200;
      let shownStops = 0;

      function addStop(stop, index) {
        const icon = L.divIcon({ className: "road-map-icon", iconAnchor: [60, 42], iconSize: [120, 42], html: `<div class="road-map-marker" aria-label="${index + 1}. ${stop.city}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${stop.city}</strong></div>` });
        markers.push(L.marker([stop.latitude, stop.longitude], { icon, interactive: false, zIndexOffset: 500 }).addTo(map));
      }

      function animate(now) {
        if (cancelled) return;
        const progress = Math.min(1, (now - startedAt) / duration);
        const count = Math.max(2, Math.ceil(progress * latLngs.length));
        const partial = latLngs.slice(0, count);
        shadow.setLatLngs(partial);
        line.setLatLngs(partial);
        const desiredStops = Math.min(route.stops.length, Math.floor(progress * route.stops.length + 0.15));
        while (shownStops < desiredStops) { addStop(route.stops[shownStops], shownStops); shownStops += 1; }
        if (progress < 1) frame = requestAnimationFrame(animate);
        else { while (shownStops < route.stops.length) { addStop(route.stops[shownStops], shownStops); shownStops += 1; } revealRef.current?.(); }
      }
      frame = requestAnimationFrame(animate);
    }
    mount();
    return () => { cancelled = true; cancelAnimationFrame(frame); markers.forEach((marker) => marker.remove()); map?.remove(); };
  }, [route]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-[#c9c3b9]" role="region" aria-label={`Animated map for ${route.title}`} />;
}

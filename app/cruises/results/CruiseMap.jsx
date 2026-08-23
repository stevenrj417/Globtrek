"use client";

import { useEffect, useRef } from "react";

export function CruiseMap({ route, onReveal }) {
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
      map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", { subdomains: "abc", maxZoom: 19, attribution: "© OpenStreetMap contributors © CARTO" }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      const journey = [...route.ports, route.ports[0]];
      const latLngs = journey.map((port) => [port.latitude, port.longitude]);
      const leftPadding = window.innerWidth >= 768 ? Math.min(window.innerWidth * 0.42, 600) : 45;
      map.fitBounds(L.latLngBounds(latLngs), { paddingTopLeft: [leftPadding, 75], paddingBottomRight: [55, 90], maxZoom: 6, animate: false });
      const glow = L.polyline([latLngs[0], latLngs[0]], { color: "#f5ead0", weight: 9, opacity: 0.9, lineCap: "round", dashArray: "1 12" }).addTo(map);
      const line = L.polyline([latLngs[0], latLngs[0]], { color: "#356e7c", weight: 3.5, opacity: 1, lineCap: "round" }).addTo(map);
      function marker(port, index) { const icon = L.divIcon({ className: "road-map-icon", iconAnchor: [60, 42], iconSize: [120, 42], html: `<div class="road-map-marker"><span>${String(index + 1).padStart(2, "0")}</span><strong>${port.city}</strong></div>` }); markers.push(L.marker([port.latitude, port.longitude], { icon, interactive: false, zIndexOffset: 500 }).addTo(map)); }
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const started = performance.now();
      const duration = reduced ? 1 : 4600;
      let shown = 0;
      function animate(now) { if (cancelled) return; const progress = Math.max(0, Math.min(1, (now - started) / duration)); const segment = progress * (latLngs.length - 1); const whole = Math.floor(segment); const partial = latLngs.slice(0, whole + 1); if (whole < latLngs.length - 1) { const local = segment - whole; const [aLat, aLng] = latLngs[whole]; const [bLat, bLng] = latLngs[whole + 1]; partial.push([aLat + (bLat - aLat) * local, aLng + (bLng - aLng) * local]); } glow.setLatLngs(partial); line.setLatLngs(partial); const wanted = Math.min(route.ports.length, Math.floor(progress * route.ports.length + 0.25)); while (shown < wanted) { marker(route.ports[shown], shown); shown += 1; } if (progress < 1) frame = requestAnimationFrame(animate); else { while (shown < route.ports.length) { marker(route.ports[shown], shown); shown += 1; } markers.forEach((item) => item.remove()); markers.length = 0; route.ports.forEach((port) => markers.push(L.circleMarker([port.latitude, port.longitude], { radius: 4, color: "#f5ead0", fillColor: "#356e7c", fillOpacity: 1, weight: 2, interactive: false }).addTo(map))); revealRef.current?.(); } }
      frame = requestAnimationFrame(animate);
    }
    mount();
    return () => { cancelled = true; cancelAnimationFrame(frame); markers.forEach((item) => item.remove()); map?.remove(); };
  }, [route]);
  return <div ref={containerRef} className="absolute inset-0 z-0 bg-[#bfcdd1]" role="region" aria-label={`Animated ocean map for ${route.title}`} />;
}

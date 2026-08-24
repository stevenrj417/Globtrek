"use client";

import { useEffect, useRef, useState } from "react";
import { fitMapToPositions, globTrekMapStyles, loadGoogleMaps } from "../../lib/google-maps/client";

function markerLabel(index) { return { text: String(index + 1).padStart(2, "0"), color: "#f7f2e8", fontSize: "10px", fontWeight: "600" }; }

export function RoadTripMap({ route, onReveal }) {
  const containerRef = useRef(null);
  const revealRef = useRef(onReveal);
  const [error, setError] = useState("");
  useEffect(() => { revealRef.current = onReveal; }, [onReveal]);
  useEffect(() => {
    let line;
    let frame;
    let cancelled = false;
    const markers = [];
    async function mount() {
      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;
        const fallback = route.stops.map((stop) => [stop.longitude, stop.latitude]);
        const response = await fetch(`/api/road-trips/route?id=${encodeURIComponent(route.id)}`).catch(() => null);
        const payload = response?.ok ? await response.json().catch(() => null) : null;
        const coordinates = Array.isArray(payload?.coordinates) && payload.coordinates.length > 1 ? payload.coordinates : fallback;
        if (cancelled) return;
        const positions = coordinates.map(([longitude, latitude]) => ({ lat: latitude, lng: longitude }));
        const map = new maps.Map(containerRef.current, { center: positions[0], zoom: 6, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative", styles: globTrekMapStyles, backgroundColor: "#c9c3b9" });
        fitMapToPositions(map, maps, positions);
        const shadow = new maps.Polyline({ map, path: [positions[0]], strokeColor: "#f7f2e8", strokeWeight: 8, strokeOpacity: 0.88, clickable: false });
        line = new maps.Polyline({ map, path: [positions[0]], strokeColor: "#9b7b43", strokeWeight: 4, strokeOpacity: 1, clickable: false });
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const startedAt = performance.now();
        const duration = reduced ? 1 : 4_200;
        let shownStops = 0;
        function addStop(stop, index) { markers.push(new maps.Marker({ map, position: { lat: stop.latitude, lng: stop.longitude }, label: markerLabel(index), title: `${index + 1}. ${stop.city}`, clickable: false, zIndex: 500 + index })); }
        function animate(now) {
          if (cancelled) return;
          const progress = Math.max(0, Math.min(1, (now - startedAt) / duration));
          const segment = progress * (positions.length - 1);
          const whole = Math.floor(segment);
          const path = positions.slice(0, whole + 1);
          if (whole < positions.length - 1) { const local = segment - whole; const a = positions[whole]; const b = positions[whole + 1]; path.push({ lat: a.lat + (b.lat - a.lat) * local, lng: a.lng + (b.lng - a.lng) * local }); }
          shadow.setPath(path); line.setPath(path);
          const wanted = Math.min(route.stops.length, Math.floor(progress * route.stops.length + 0.15));
          while (shownStops < wanted) { addStop(route.stops[shownStops], shownStops); shownStops += 1; }
          if (progress < 1) frame = requestAnimationFrame(animate);
          else { while (shownStops < route.stops.length) { addStop(route.stops[shownStops], shownStops); shownStops += 1; } revealRef.current?.(); }
        }
        frame = requestAnimationFrame(animate);
      } catch { if (!cancelled) { setError("The route map is temporarily unavailable."); revealRef.current?.(); } }
    }
    mount();
    return () => { cancelled = true; cancelAnimationFrame(frame); markers.forEach((marker) => marker.setMap(null)); line?.setMap(null); };
  }, [route]);
  return <div ref={containerRef} className="absolute inset-0 z-0 bg-[#c9c3b9]" role="region" aria-label={`Animated Google map for ${route.title}`}>{error ? <p className="absolute inset-0 grid place-items-center text-xs uppercase tracking-[0.12em] text-black/45">{error}</p> : null}</div>;
}

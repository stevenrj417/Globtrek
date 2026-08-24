"use client";

import { useEffect, useRef, useState } from "react";
import { fitMapToPositions, globTrekMapStyles, loadGoogleMaps } from "../../lib/google-maps/client";

export function CruiseMap({ route, onReveal }) {
  const containerRef = useRef(null);
  const revealRef = useRef(onReveal);
  const [error, setError] = useState("");
  useEffect(() => { revealRef.current = onReveal; }, [onReveal]);
  useEffect(() => {
    let frame;
    let line;
    let cancelled = false;
    const markers = [];
    async function mount() {
      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;
        const journey = route.closedLoop === false ? route.ports : [...route.ports, route.ports[0]];
        const positions = journey.map((port) => ({ lat: port.latitude, lng: port.longitude }));
        const map = new maps.Map(containerRef.current, { center: positions[0], zoom: 4, disableDefaultUI: true, zoomControl: true, gestureHandling: "cooperative", styles: globTrekMapStyles, backgroundColor: "#bfcdd1" });
        fitMapToPositions(map, maps, positions);
        const glow = new maps.Polyline({ map, path: [positions[0]], strokeColor: "#f5ead0", strokeWeight: 9, strokeOpacity: 0.9, clickable: false });
        line = new maps.Polyline({ map, path: [positions[0]], strokeColor: "#356e7c", strokeWeight: 4, strokeOpacity: 1, clickable: false });
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const started = performance.now();
        const duration = reduced ? 1 : 4_600;
        let shown = 0;
        function addMarker(port, index) { markers.push(new maps.Marker({ map, position: { lat: port.latitude, lng: port.longitude }, label: { text: String(index + 1).padStart(2, "0"), color: "#f7f2e8", fontSize: "10px", fontWeight: "600" }, title: `${index + 1}. ${port.city}`, clickable: false, zIndex: 500 + index })); }
        function animate(now) {
          if (cancelled) return;
          const progress = Math.max(0, Math.min(1, (now - started) / duration));
          const segment = progress * (positions.length - 1);
          const whole = Math.floor(segment);
          const path = positions.slice(0, whole + 1);
          if (whole < positions.length - 1) { const local = segment - whole; const a = positions[whole]; const b = positions[whole + 1]; path.push({ lat: a.lat + (b.lat - a.lat) * local, lng: a.lng + (b.lng - a.lng) * local }); }
          glow.setPath(path); line.setPath(path);
          const wanted = Math.min(route.ports.length, Math.floor(progress * route.ports.length + 0.25));
          while (shown < wanted) { addMarker(route.ports[shown], shown); shown += 1; }
          if (progress < 1) frame = requestAnimationFrame(animate);
          else { while (shown < route.ports.length) { addMarker(route.ports[shown], shown); shown += 1; } revealRef.current?.(); }
        }
        frame = requestAnimationFrame(animate);
      } catch { if (!cancelled) { setError("The ocean map is temporarily unavailable."); revealRef.current?.(); } }
    }
    mount();
    return () => { cancelled = true; cancelAnimationFrame(frame); markers.forEach((marker) => marker.setMap(null)); line?.setMap(null); };
  }, [route]);
  return <div ref={containerRef} className="absolute inset-0 z-0 bg-[#bfcdd1]" role="region" aria-label={`Animated Google map for ${route.title}`}>{error ? <p className="absolute inset-0 grid place-items-center text-xs uppercase tracking-[0.12em] text-black/45">{error}</p> : null}</div>;
}

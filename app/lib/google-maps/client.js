"use client";

let loaderPromise;

export const globTrekMapStyles = Object.freeze([
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#a8a39a" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#e6e2d9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#f7f4ed" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#aabfc5" }] },
]);

export function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("google_maps_browser_required"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("google_maps_api_key_missing"));
  loaderPromise = new Promise((resolve, reject) => {
    const callback = `__globtrekGoogleMapsReady${Date.now()}`;
    const script = document.createElement("script");
    window[callback] = () => { delete window[callback]; resolve(window.google.maps); };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=places,geometry,marker&callback=${callback}`;
    script.async = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.dataset.globtrekGoogleMaps = "true";
    script.onerror = () => { delete window[callback]; loaderPromise = undefined; reject(new Error("google_maps_load_failed")); };
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export function fitMapToPositions(map, maps, positions) {
  const bounds = new maps.LatLngBounds();
  positions.forEach((position) => bounds.extend(position));
  const desktop = window.innerWidth >= 768;
  map.fitBounds(bounds, { top: 75, right: 55, bottom: 90, left: desktop ? Math.min(window.innerWidth * 0.43, 620) : 45 });
}

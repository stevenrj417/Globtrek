const isDev = process.env.NODE_ENV !== "production";

// Next.js inlines its bootstrap scripts, so scripts allow 'unsafe-inline';
// every other directive is restricted to the origins the app actually uses.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://maps.googleapis.com https://*.gstatic.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://places.googleapis.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src https://www.openstreetmap.org",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

// Pages and APIs that show one person's data are never cached.
const privatePaths = ["/account/:path*", "/my-trips/:path*", "/api/account/:path*", "/api/trips/:path*", "/api/saved/:path*", "/api/recent/:path*", "/api/recent-searches/:path*", "/auth/:path*"];

const nextConfig = {
  poweredByHeader: false,
  // The share-story image route reads its fonts from disk.
  outputFileTracingIncludes: {
    "/api/story": ["./app/lib/share/fonts/*.woff"],
    // These read the Booking.com catalog from disk, one destination file at a time.
    "/hotels/*": ["./app/data/feedStays/**"],
    "/plan": ["./app/data/feedStays/**"],
    "/places/**": ["./app/data/feedStays/**"],
    "/api/hotels/**": ["./app/data/feedStays/**"],
    "/api/cron/catalog": ["./app/data/feedStays/**"],
    "/destinations/**": ["./app/data/feedStays/**"],
    "/guides/**": ["./app/data/feedStays/**"],
    "/sitemap.xml": ["./app/data/feedStays/**"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...privatePaths.map((source) => ({ source, headers: [{ key: "Cache-Control", value: "private, no-store" }] })),
      { source: "/results", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
  async redirects() {
    // Remove these temporary redirects when Cruises and Road Trips are visible again.
    return [
      // The Booking Assistant extension was retired 2026-11-21; its privacy page stays for installed copies.
      { source: "/booking-assistant", destination: "/help", permanent: false },
      { source: "/cruises", destination: "/", permanent: false },
      { source: "/cruises/:path*", destination: "/", permanent: false },
      { source: "/road-trips", destination: "/", permanent: false },
      { source: "/road-trips/:path*", destination: "/", permanent: false },
      // Guide unpublished until the Booking.com feed lists stays in Stepantsminda.
      { source: "/destinations/kazbegi", destination: "/destinations", permanent: false },
      { source: "/destinations/maldives", destination: "/destinations", permanent: false },
      // Themed trips and expeditions now share one Trip ideas page (2026-11-22).
      { source: "/themed-trips", destination: "/trip-ideas", permanent: true },
      { source: "/expeditions", destination: "/trip-ideas#the-big-ones", permanent: true },
      // Accents now drop out of guide URLs instead of splitting them.
      { source: "/destinations/bra-ov", destination: "/destinations/brasov", permanent: true },
    ];
  },
  images: {
    qualities: [70, 75, 80, 82, 88, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        // Booking.com listing photos from the CJ product feed.
        protocol: "https",
        hostname: "*.bstatic.com",
        pathname: "/xdata/images/hotel/**",
      },
      {
        // WeGoTrip product photos (tour and ticket listings).
        protocol: "https",
        hostname: "wgt-prod-storage.s3.amazonaws.com",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;

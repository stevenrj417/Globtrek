const nextConfig = {
  async redirects() {
    // Remove these temporary redirects when Cruises and Road Trips are visible again.
    return [
      { source: "/cruises", destination: "/", permanent: false },
      { source: "/cruises/:path*", destination: "/", permanent: false },
      { source: "/road-trips", destination: "/", permanent: false },
      { source: "/road-trips/:path*", destination: "/", permanent: false },
    ];
  },
  images: {
    qualities: [75, 80, 82, 88, 90],
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
    ],
  },
};

export default nextConfig;

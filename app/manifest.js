export default function manifest() {
  return {
    name: "GlobTrek",
    short_name: "GlobTrek",
    description: "A few quick questions. One affordable trip.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#f7f7f4",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}

import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

// Shared share-card layout: photo, place name, one estimate line, wordmark.
export function renderOgImage({ title, subtitle, image }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#171717", fontFamily: "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> only */}
        {image ? <img src={image} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.72) 100%)" }} />
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 56, display: "flex", flexDirection: "column", color: "white" }}>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.05 }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 18, fontSize: 30, opacity: 0.92 }}>{subtitle}</div> : null}
        </div>
        <div style={{ position: "absolute", top: 48, left: 64, color: "white", fontSize: 40, fontWeight: 700, letterSpacing: "-0.065em" }}>globtrek</div>
      </div>
    ),
    OG_SIZE,
  );
}

// next/og cannot decode every remote format; ask Unsplash for a sized JPEG.
export function ogPhoto(url) {
  if (!url) return null;
  if (url.startsWith("/")) return null;
  if (url.includes("images.unsplash.com")) return `${url.split("?")[0]}?w=1200&h=630&fit=crop&fm=jpg&q=70`;
  return url;
}

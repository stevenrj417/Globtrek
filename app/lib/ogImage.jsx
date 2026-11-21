import { ImageResponse } from "next/og";
import { sizedPhoto } from "./format";

export const OG_SIZE = { width: 1200, height: 630 };

// next/og fetches <img> sources without a User-Agent, and Wikimedia refuses
// those (HTTP 403), which left share cards without their photo. Fetch the photo
// here instead and hand it over as a data URL; no photo if that fails.
const PHOTO_HEADERS = { "User-Agent": "GlobTrekShareCards/1.0 (https://www.glob-trek.com/contact)" };
async function fetchPhoto(url) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(url, { headers: PHOTO_HEADERS, signal: AbortSignal.timeout(8000) });
    if (response.status === 429 && attempt === 1) { await new Promise((resolve) => setTimeout(resolve, 1500)); continue; }
    return response;
  }
  return null;
}

export async function photoData(url) {
  if (!url) return null;
  // A Wikimedia thumbnail width the file doesn't offer returns HTTP 400; fall back to 960px.
  const candidates = [url, url.replace(/\/\d+px-([^/]+)$/, "/960px-$1")].filter((item, index, list) => list.indexOf(item) === index);
  for (const candidate of candidates) {
    try {
      const response = await fetchPhoto(candidate);
      const type = response?.headers.get("content-type") || "";
      if (response?.ok && /^image\/(jpeg|png)/.test(type)) return `data:${type.split(";")[0]};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
      console.log(JSON.stringify({ level: "warn", msg: "og_photo_failed", status: response?.status ?? null, host: new URL(candidate).hostname }));
    } catch (error) {
      console.log(JSON.stringify({ level: "warn", msg: "og_photo_failed", error: error instanceof Error ? error.name : "unknown" }));
    }
  }
  return null;
}

// Shared share-card layout: photo, place name, one estimate line, wordmark.
export async function renderOgImage({ title, subtitle, image: url }) {
  const image = await photoData(url);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#171717", fontFamily: "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> only */}
        {image ? <img src={image} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.78) 100%)" }} />
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
  return sizedPhoto(url, 1280);
}

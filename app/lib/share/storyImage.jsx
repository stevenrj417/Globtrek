/* eslint-disable @next/next/no-img-element -- next/og renders plain <img> only */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// A 9:16 share story (1080 x 1920) in one of four looks. Text comes from
// storyText(); the photo arrives as a data URL. GlobTrek appears only as a small
// wordmark-free URL at the bottom, so it reads as a travel post, not an ad.
export const STORY_SIZE = { width: 1080, height: 1920 };
export const STORY_STYLES = Object.freeze({
  minimal: { label: "Minimal luxury" },
  postcard: { label: "Vintage postcard" },
  tropical: { label: "Tropical" },
  editorial: { label: "Modern editorial" },
});

const FONT_FILES = [
  ["Cormorant", "cormorant-500.woff", 500, "normal"],
  ["Cormorant", "cormorant-600.woff", 600, "normal"],
  ["Cormorant", "cormorant-500-italic.woff", 500, "italic"],
  ["Playfair", "playfair-700-italic.woff", 700, "italic"],
  ["Jost", "jost-400.woff", 400, "normal"],
  ["Jost", "jost-500.woff", 500, "normal"],
];
let fontsPromise;
function fonts() {
  fontsPromise ||= Promise.all(FONT_FILES.map(async ([name, file, weight, style]) => ({ name, weight, style, data: await readFile(join(process.cwd(), "app/lib/share/fonts", file)) })));
  return fontsPromise;
}

const caps = { fontFamily: "Jost", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.32em" };

function Photo({ src, style }) {
  return src ? <img src={src} alt="" width={1080} height={1920} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", ...style }} /> : null;
}

function Footer({ credit, color = "white", opacity = 0.85 }) {
  return <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", flexDirection: "column", alignItems: "center", color, opacity }}>
    <div style={{ display: "flex", ...caps, fontSize: 22, letterSpacing: "0.42em" }}>glob-trek.com</div>
    {credit ? <div style={{ display: "flex", marginTop: 14, fontFamily: "Jost", fontSize: 15, opacity: 0.75 }}>{`Photo: ${credit}`}</div> : null}
  </div>;
}

// Minimal luxury: the photo, a whisper of type, lots of air.
function Minimal({ photo, text }) {
  return <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#1a1814" }}>
    <Photo src={photo} />
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.72) 100%)" }} />
    <div style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", justifyContent: "center", color: "white", ...caps, fontSize: 24 }}>{text.eyebrow}</div>
    <div style={{ position: "absolute", left: 90, right: 90, bottom: 250, display: "flex", flexDirection: "column", alignItems: "center", color: "white", textAlign: "center" }}>
      <div style={{ display: "flex", fontFamily: "Cormorant", fontWeight: 500, fontSize: text.title.length > 14 ? 120 : 160, lineHeight: 0.92, letterSpacing: "-0.02em" }}>{text.title}</div>
      {text.subtitle ? <div style={{ display: "flex", marginTop: 28, fontFamily: "Cormorant", fontStyle: "italic", fontSize: 50 }}>{text.subtitle}</div> : null}
      <div style={{ marginTop: 44, width: 90, height: 2, background: "rgba(255,255,255,0.8)", display: "flex" }} />
      {text.countdown ? <div style={{ display: "flex", marginTop: 40, ...caps, fontSize: 28 }}>{text.countdown}</div> : null}
      {text.date ? <div style={{ display: "flex", marginTop: 16, fontFamily: "Jost", fontSize: 26, opacity: 0.85 }}>{text.date}</div> : null}
    </div>
    <Footer credit={text.credit} />
  </div>;
}

// Vintage postcard: cream card, framed photo, script greeting, a stamp with the count.
function Postcard({ photo, text }) {
  const ink = "#3b2a1a";
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background: "#efe4cf", position: "relative" }}>
    <div style={{ position: "absolute", top: 36, left: 36, right: 36, bottom: 36, display: "flex", border: `3px solid ${ink}`, opacity: 0.35 }} />
    <div style={{ marginTop: 120, display: "flex", color: ink, ...caps, fontSize: 24 }}>{text.eyebrow}</div>
    <div style={{ marginTop: 50, width: 900, height: 1060, display: "flex", position: "relative", background: "white", padding: 26, boxShadow: "0 18px 40px rgba(59,42,26,0.25)", transform: "rotate(-1.5deg)" }}>
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#d9cdb4" }}>
        <Photo src={photo} style={{ filter: "sepia(0.25) saturate(0.9)" }} />
      </div>
      {text.countdown ? <div style={{ position: "absolute", top: -60, right: -40, width: 230, height: 230, borderRadius: 999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#b8432f", color: "#fff6e6", border: "6px dashed #fff6e6", transform: "rotate(9deg)" }}>
        <div style={{ display: "flex", fontFamily: "Cormorant", fontWeight: 600, fontSize: text.countNumber && String(text.countNumber).length > 2 ? 70 : 92, lineHeight: 1 }}>{String(text.countNumber ?? "✈")}</div>
        <div style={{ display: "flex", ...caps, fontSize: 17, letterSpacing: "0.2em", marginTop: 6 }}>{text.countUnit}</div>
      </div> : null}
    </div>
    <div style={{ marginTop: 70, display: "flex", flexDirection: "column", alignItems: "center", color: ink, textAlign: "center", paddingLeft: 80, paddingRight: 80 }}>
      <div style={{ display: "flex", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: 46 }}>Greetings from</div>
      <div style={{ display: "flex", marginTop: 6, fontFamily: "Cormorant", fontWeight: 600, fontSize: text.title.length > 14 ? 104 : 136, lineHeight: 0.95, letterSpacing: "0.01em", textTransform: "uppercase" }}>{text.title}</div>
      {text.subtitle ? <div style={{ display: "flex", marginTop: 16, fontFamily: "Cormorant", fontStyle: "italic", fontSize: 42 }}>{text.subtitle}</div> : null}
      {text.date ? <div style={{ display: "flex", marginTop: 14, fontFamily: "Jost", fontSize: 24, opacity: 0.8 }}>{text.date}</div> : null}
    </div>
    <Footer credit={text.credit} color={ink} opacity={0.7} />
  </div>;
}

// Tropical: warm, sun-washed, bold italic.
function Tropical({ photo, text }) {
  return <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0e5c63" }}>
    <Photo src={photo} style={{ filter: "saturate(1.15)" }} />
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", backgroundImage: "linear-gradient(180deg, rgba(255,170,90,0.35) 0%, rgba(255,120,90,0) 30%, rgba(8,70,80,0) 50%, rgba(8,60,70,0.85) 100%)" }} />
    <div style={{ position: "absolute", top: 160, left: 90, display: "flex", color: "white", ...caps, fontSize: 24 }}>{text.eyebrow}</div>
    <div style={{ position: "absolute", left: 90, right: 90, bottom: 250, display: "flex", flexDirection: "column", color: "white" }}>
      <div style={{ display: "flex", fontFamily: "Playfair", fontStyle: "italic", fontWeight: 700, fontSize: text.title.length > 12 ? 118 : 150, lineHeight: 0.95 }}>{text.title}</div>
      {text.subtitle ? <div style={{ display: "flex", marginTop: 26, fontFamily: "Cormorant", fontStyle: "italic", fontSize: 52 }}>{text.subtitle}</div> : null}
      <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 20 }}>
        {text.countdown ? <div style={{ display: "flex", padding: "18px 34px", borderRadius: 999, background: "rgba(255,255,255,0.92)", color: "#0e4f56", ...caps, fontSize: 24, letterSpacing: "0.2em" }}>{text.countdown}</div> : null}
        {text.date ? <div style={{ display: "flex", fontFamily: "Jost", fontSize: 26 }}>{text.date}</div> : null}
      </div>
    </div>
    <Footer credit={text.credit} />
  </div>;
}

// Modern editorial: a magazine cover, the countdown as the cover number.
function Editorial({ photo, text }) {
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f7f5f0", position: "relative" }}>
    <div style={{ height: 1340, display: "flex", position: "relative", overflow: "hidden" }}><Photo src={photo} /></div>
    <div style={{ position: "absolute", top: 70, left: 80, right: 80, display: "flex", justifyContent: "space-between", color: "white", ...caps, fontSize: 20 }}>
      <div style={{ display: "flex" }}>{text.issue}</div>
      <div style={{ display: "flex" }}>{text.eyebrow}</div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", paddingLeft: 80, paddingRight: 80, paddingTop: 56, color: "#141414" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "2px solid #141414", paddingBottom: 30 }}>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontWeight: 600, fontSize: text.title.length > 12 ? 92 : 120, lineHeight: 0.92, letterSpacing: "-0.02em" }}>{text.title}</div>
          {text.subtitle ? <div style={{ display: "flex", marginTop: 14, fontFamily: "Cormorant", fontStyle: "italic", fontSize: 44 }}>{text.subtitle}</div> : null}
        </div>
        {text.countNumber != null ? <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontWeight: 600, fontSize: 190, lineHeight: 0.8 }}>{String(text.countNumber)}</div>
          <div style={{ display: "flex", ...caps, fontSize: 20, marginTop: 14 }}>{text.countUnit}</div>
        </div> : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontFamily: "Jost", fontSize: 24 }}>
        <div style={{ display: "flex" }}>{text.countNumber != null ? "" : text.countdown || ""}</div>
        <div style={{ display: "flex" }}>{text.date || ""}</div>
      </div>
    </div>
    <Footer credit={text.credit} color="#141414" opacity={0.65} />
  </div>;
}

const LAYOUTS = { minimal: Minimal, postcard: Postcard, tropical: Tropical, editorial: Editorial };

export async function renderStory({ style, photo, text }) {
  const Layout = LAYOUTS[style] || Minimal;
  return new ImageResponse(<Layout photo={photo} text={text} />, { ...STORY_SIZE, fonts: await fonts() });
}

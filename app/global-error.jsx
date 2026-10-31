"use client";

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", background: "#f7f7f4", color: "#171717", fontFamily: "\"Avenir Next\", \"Helvetica Neue\", Arial, sans-serif", textAlign: "center", padding: "0 20px" }}>
        <main>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b6b6b" }}>GlobTrek</p>
          <h1 style={{ fontSize: 40, letterSpacing: "-0.035em", margin: "16px 0" }}>This page didn&apos;t load.</h1>
          <p style={{ color: "#565656" }}>It&apos;s on our side. Try again, or head back to the start.</p>
          <p style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
            <button type="button" onClick={reset} style={{ minHeight: 48, padding: "0 24px", background: "#171717", color: "#fff", border: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>Try again</button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the root layout is unavailable here */}
            <a href="/" style={{ minHeight: 48, padding: "0 24px", display: "inline-flex", alignItems: "center", border: "1px solid rgb(0 0 0 / 0.2)", color: "#171717", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}>Go home</a>
          </p>
        </main>
      </body>
    </html>
  );
}

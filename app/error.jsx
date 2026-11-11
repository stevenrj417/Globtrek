"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportClientError } from "./lib/reportError";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
    else reportClientError(error, "page");
  }, [error]);

  return (
    <main className="grid min-h-svh place-items-center bg-bg px-5 text-center text-ink">
      <div className="max-w-[var(--width-reading)]">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-4 text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-tight-3">This page didn&apos;t load.</h1>
        <p className="mt-4 text-base leading-7 text-muted">It&apos;s on our side, not yours. Your quiz answers are saved on this device.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
          <Link href="/" className="btn btn-secondary">Go home</Link>
        </div>
      </div>
    </main>
  );
}

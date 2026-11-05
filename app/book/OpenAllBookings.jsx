"use client";

import { useState } from "react";
import { launchBookingManifest } from "../lib/booking/manifest";
import { track } from "../lib/analytics";

// One click opens every booking in its own tab. Browsers only let a site open
// several tabs from one click once pop-ups are allowed, so blocked tabs get a
// clear next step instead of failing silently.
export function OpenAllBookings({ items }) {
  const [result, setResult] = useState(null);

  function openAll() {
    const manifest = { hotelBookings: items.filter((item) => item.type === "hotel"), restaurantBookings: items.filter((item) => item.type === "restaurant"), experienceBookings: items.filter((item) => item.type === "experience"), flightBooking: items.find((item) => item.type === "flight") || null };
    const launched = launchBookingManifest(manifest);
    setResult(launched);
    track("book_all_clicked", { requested: launched.requested, opened: launched.opened.length, blocked: launched.blocked.length, source: "book_page" });
  }

  const blocked = result?.blocked || [];
  return <div>
    <button type="button" onClick={openAll} className="btn btn-primary w-full sm:w-auto">Open all {items.length} booking{items.length === 1 ? "" : "s"}</button>
    <div aria-live="polite" className="mt-4 text-sm">
      {result && !blocked.length ? <p className="text-success">All {result.opened.length} opened in new tabs. Finish each one on the partner&apos;s site.</p> : null}
      {blocked.length ? <div className="border border-black/15 bg-surface p-4">
        <p className="font-medium">{result.opened.length ? `${result.opened.length} opened. Your browser blocked ${blocked.length}.` : `Your browser blocked the tabs.`}</p>
        <p className="mt-1 text-muted">Allow pop-ups for glob-trek.com (the icon at the right of the address bar), then press the button again. Or open the rest here:</p>
        <ul className="mt-3 space-y-2">{blocked.map((item) => <li key={item.id}><a href={item.exactUrl} target="_blank" rel="noopener sponsored" className="underline decoration-black/25 underline-offset-4 hover:decoration-ink">Open {item.name} ↗</a></li>)}</ul>
      </div> : null}
    </div>
  </div>;
}

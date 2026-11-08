"use client";

import { useEffect, useState } from "react";

// The lead traveler's details, kept on this device only (never sent to GlobTrek or
// put in partner links), with a copy button for each so partner checkout forms
// take seconds. Browsers don't let one site fill another site's forms.
const FIELDS = [
  { key: "firstName", label: "First name", autoComplete: "given-name" },
  { key: "lastName", label: "Last name", autoComplete: "family-name" },
  { key: "email", label: "Email", autoComplete: "email", type: "email" },
  { key: "phone", label: "Phone", autoComplete: "tel", type: "tel" },
  { key: "country", label: "Country of residence", autoComplete: "country-name" },
  { key: "arrival", label: "Arrival time (for the stay)", placeholder: "e.g. 3–4 PM" },
];
const STORAGE_KEY = "globtrek:traveler-details";

export function TravelerDetails() {
  const [details, setDetails] = useState({});
  const [copied, setCopied] = useState(null);

  // Read saved details after hydration so server and client render the same form.
  useEffect(() => {
    const id = setTimeout(() => {
      try { setDetails(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}")); } catch {}
    });
    return () => clearTimeout(id);
  }, []);

  function update(key, value) {
    const next = { ...details, [key]: value };
    setDetails(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  async function copy(key, text) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500); } catch {}
  }

  function forget() {
    setDetails({});
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const filled = FIELDS.filter((field) => details[field.key]);
  const all = filled.map((field) => `${field.label}: ${details[field.key]}`).join("\n");
  return <details className="mt-6 border border-black/15 p-5" open>
    <summary className="cursor-pointer font-semibold">Your details, ready to paste</summary>
    <p className="mt-2 text-sm text-muted">Saved on this device only. GlobTrek never sends them anywhere. Copy each one into the partner&apos;s checkout; Booking.com fills them for you when you&apos;re signed in.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {FIELDS.map((field) => <label key={field.key} className="block text-sm">
        <span className="text-subtle">{field.label}</span>
        <span className="mt-1 flex gap-2">
          <input type={field.type || "text"} autoComplete={field.autoComplete} placeholder={field.placeholder} value={details[field.key] || ""} onChange={(event) => update(field.key, event.target.value)} className="min-h-11 w-full border border-black/20 bg-bg px-3" />
          <button type="button" disabled={!details[field.key]} onClick={() => copy(field.key, details[field.key])} className="btn btn-secondary shrink-0 px-3 text-xs disabled:opacity-40">{copied === field.key ? "Copied" : "Copy"}</button>
        </span>
      </label>)}
    </div>
    <div className="mt-4 flex flex-wrap gap-3 text-sm">
      <button type="button" disabled={!filled.length} onClick={() => copy("all", all)} className="btn btn-secondary disabled:opacity-40">{copied === "all" ? "Copied" : "Copy all"}</button>
      {filled.length ? <button type="button" onClick={forget} className="underline decoration-black/25 underline-offset-4 hover:decoration-ink">Forget my details</button> : null}
    </div>
  </details>;
}

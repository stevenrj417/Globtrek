"use client";

import { useState } from "react";
import { track } from "../../lib/analytics";

const REASONS = ["Too expensive", "Wrong kind of place", "Too far away", "Already been there", "Wrong time of year", "Something else"];

// "Was this a good match?" Answers go to GlobTrek's logs with the result id; no
// account or contact details are attached.
export function FeedbackPanel({ resultId, destinationId, algorithmVersion }) {
  const [mode, setMode] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  async function send(kind, extra = {}) {
    setStatus("sending");
    track("result_feedback", { kind, destination: destinationId });
    const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, resultId, destinationId, algorithmVersion, ...extra }) }).catch(() => null);
    setStatus(response?.ok ? "sent" : "failed");
  }

  if (status === "sent") return <p role="status" className="text-sm">Thanks. That helps us improve matches.</p>;
  return <div>
    <h2 className="text-micro uppercase tracking-label text-black/60">Was this a good match?</h2>
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" onClick={() => send("great_match")} className="inline-flex min-h-11 items-center border border-black/25 px-4 text-sm hover:border-black">Great match</button>
      <button type="button" aria-expanded={mode === "not_for_me"} onClick={() => setMode(mode === "not_for_me" ? null : "not_for_me")} className="inline-flex min-h-11 items-center border border-black/25 px-4 text-sm hover:border-black">Not for me</button>
      <button type="button" aria-expanded={mode === "wrong"} onClick={() => setMode(mode === "wrong" ? null : "wrong")} className="inline-flex min-h-11 items-center border border-black/25 px-4 text-sm hover:border-black">Something is wrong</button>
    </div>
    {mode === "not_for_me" ? <fieldset className="mt-3">
      <legend className="text-sm font-medium">What didn&apos;t fit?</legend>
      <div className="mt-2 flex flex-wrap gap-2">{REASONS.map((reason) => <label key={reason} className="inline-flex min-h-11 items-center gap-2 border border-black/15 bg-white px-3 text-sm"><input type="checkbox" checked={reasons.includes(reason)} onChange={() => setReasons((current) => current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason])} className="h-5 w-5 accent-black" />{reason}</label>)}</div>
      <button type="button" disabled={!reasons.length || status === "sending"} onClick={() => send("not_for_me", { reasons })} className="mt-3 inline-flex min-h-11 items-center bg-black px-5 text-sm text-white disabled:opacity-40">Send</button>
    </fieldset> : null}
    {mode === "wrong" ? <div className="mt-3">
      <label htmlFor="feedback-message" className="text-sm font-medium">What looks wrong?</label>
      <p id="feedback-hint" className="text-xs text-black/60">For example a closed place, a wrong price or a broken link. Please don&apos;t include your name, email or other personal details.</p>
      <textarea id="feedback-message" aria-describedby="feedback-hint" value={message} maxLength={500} onChange={(event) => setMessage(event.target.value)} rows={3} className="mt-2 block w-full max-w-xl border border-black/20 bg-white p-3 text-base" />
      <button type="button" disabled={!message.trim() || status === "sending"} onClick={() => send("something_wrong", { message })} className="mt-3 inline-flex min-h-11 items-center bg-black px-5 text-sm text-white disabled:opacity-40">Send</button>
    </div> : null}
    {status === "failed" ? <p role="alert" className="mt-2 text-sm">That didn&apos;t send. Please try again.</p> : null}
  </div>;
}

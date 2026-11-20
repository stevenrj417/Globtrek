"use client";

import { useState } from "react";
import { track } from "../lib/analytics";

export const FEEDBACK_TOPICS = ["Something broke", "A wrong price or place", "An idea", "Something else"];

// Feedback about the whole site. No account, name or email is asked for; the
// page someone came from is sent so a broken page can be found.
export function SiteFeedbackForm() {
  const [topic, setTopic] = useState(FEEDBACK_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  async function send(event) {
    event.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    const from = new URLSearchParams(window.location.search).get("from") || "";
    const page = /^\/[A-Za-z0-9/_.-]{0,120}$/.test(from) ? from : null;
    track("result_feedback", { kind: "site", topic });
    const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "site", topic, message, page }) }).catch(() => null);
    setStatus(response?.ok ? "sent" : "failed");
  }

  if (status === "sent") return <p role="status" className="text-lg text-ink">Thank you. Every message gets read.</p>;
  return <form onSubmit={send} className="max-w-xl">
    <fieldset>
      <legend className="text-sm font-medium text-ink">What&apos;s it about?</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEEDBACK_TOPICS.map((item) => <label key={item} className={`inline-flex min-h-11 cursor-pointer items-center border px-4 text-sm ${topic === item ? "border-black bg-black text-white" : "border-black/25 bg-white text-ink hover:border-black"}`}>
          <input type="radio" name="topic" value={item} checked={topic === item} onChange={() => setTopic(item)} className="sr-only" />{item}
        </label>)}
      </div>
    </fieldset>
    <label htmlFor="site-feedback" className="mt-6 block text-sm font-medium text-ink">Tell us more</label>
    <p id="site-feedback-hint" className="text-xs text-muted">What were you trying to do, and what happened? Please don&apos;t include your name, email or other personal details.</p>
    <textarea id="site-feedback" aria-describedby="site-feedback-hint" required value={message} maxLength={500} onChange={(event) => setMessage(event.target.value)} rows={5} className="mt-2 block w-full border border-black/20 bg-white p-3 text-base" />
    <p className="mt-1 text-right text-xs text-subtle tabular">{message.length}/500</p>
    <button type="submit" disabled={!message.trim() || status === "sending"} className="btn btn-primary mt-3 disabled:opacity-40">{status === "sending" ? "Sending…" : "Send feedback"}</button>
    {status === "failed" ? <p role="alert" className="mt-3 text-sm">That didn&apos;t send. Please try again.</p> : null}
  </form>;
}

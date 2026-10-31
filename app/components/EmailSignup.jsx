"use client";

import { useState } from "react";
import { track } from "../lib/analytics";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function EmailSignup() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "").trim();
    if (!EMAIL_PATTERN.test(email)) {
      setStatus("invalid");
      setMessage("That email doesn't look right. Check it and try again.");
      return;
    }
    setStatus("loading");
    setMessage("");
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/email/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, marketingConsent: true }) });
      if (!response.ok) throw new Error("subscribe_failed");
      form.reset();
      setStatus("success");
      setMessage("You're in. A welcome email is on its way, and the monthly edit arrives on the 1st.");
      track("email_signup");
    } catch {
      setStatus("error");
      setMessage(navigator.onLine === false ? "You're offline. Try again once you're connected." : "We couldn't sign you up just now. Try again in a minute.");
    }
  }

  const invalid = status === "invalid";
  const tone = status === "success" ? "text-success" : status === "error" || invalid ? "text-danger" : "text-subtle";

  return (
    <section aria-labelledby="signup-heading" className="border-t border-black/10 bg-bg px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-[1700px] flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 id="signup-heading" className="text-lg font-medium tracking-tight-1">One email a month.</h2>
          <p className="mt-1 text-sm text-muted">A few good-value trips, chosen by GlobTrek.</p>
        </div>
        <div className="w-full max-w-xl">
          <form noValidate className={`flex border-b ${invalid ? "border-danger" : "border-black"}`} onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="signup-email">Email address</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" required aria-invalid={invalid} aria-describedby="signup-status signup-consent" onChange={() => { if (invalid) { setStatus("idle"); setMessage(""); } }} placeholder="Email address" className="min-h-14 min-w-0 flex-1 border-0 bg-transparent px-1 text-base outline-none placeholder:text-subtle" />
            <button type="submit" disabled={status === "loading"} className="btn min-w-28 px-5">
              {status === "loading" ? <><span className="h-3 w-3 animate-spin rounded-full border border-black/25 border-t-black" aria-hidden="true" /><span>Joining</span></> : "Join"}
            </button>
          </form>
          <p id="signup-status" aria-live="polite" className={`mt-3 min-h-5 text-xs ${tone}`}>{message}</p>
          <p id="signup-consent" className="text-micro leading-4 text-subtle">By joining, you agree to receive GlobTrek&apos;s monthly travel email. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}

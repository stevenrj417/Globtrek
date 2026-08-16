"use client";

import { useState } from "react";

export function EmailSignup() {
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    setMessage("Joining…");
    const response = await fetch("/api/email/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, marketingConsent: true }) });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "You’re in. Check your inbox." : data.error || "Signup is temporarily unavailable.");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <section className="border-t border-black/10 bg-[#f7f7f4] px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1700px]">
        <form className="ml-auto flex max-w-xl border-b border-black" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="signup-email">Email address</label>
          <input id="signup-email" name="email" type="email" required placeholder="Email address" className="min-h-14 min-w-0 flex-1 border-0 bg-transparent px-1 text-base outline-none placeholder:text-[#777]" />
          <button type="submit" className="min-h-14 px-5 text-xs font-semibold uppercase tracking-[0.08em]">Join</button>
        </form>
        <p aria-live="polite" className="ml-auto mt-3 min-h-5 max-w-xl text-xs text-[#707070]">{message}</p>
        <p className="ml-auto max-w-xl text-[10px] leading-4 text-[#888]">By joining, you explicitly agree to receive Globtrek’s monthly travel email. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}

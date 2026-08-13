"use client";

import { useState } from "react";

export function EmailSignup() {
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("Email signup is being connected. No address was submitted.");
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
      </div>
    </section>
  );
}

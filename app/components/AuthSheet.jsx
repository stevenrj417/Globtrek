"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";

export function AuthSheet({ open, onClose, returnTo = "/" }) {
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  if (!open) return null;

  function close() {
    setEmailMode(false);
    setStatus("");
    onClose();
  }

  async function continueWith(provider) {
    setStatus("Opening sign-in…");
    const supabase = createClient();
    const next = returnTo.startsWith("/") ? returnTo : "/";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) setStatus(error.message);
  }

  async function continueWithEmail(event) {
    event.preventDefault();
    setStatus("Sending your sign-in link…");
    const supabase = createClient();
    const next = returnTo.startsWith("/") ? returnTo : "/";
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo } });
    setStatus(error ? "We couldn't send the link. Check the address and try again." : "Check your email. Your sign-in link is on its way.");
  }

  return <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-[3px] sm:px-6" role="presentation" onMouseDown={close}>
    <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative my-auto w-full max-w-[460px] overflow-hidden rounded-[2px] border border-black/10 bg-bg px-6 pb-8 pt-6 shadow-overlay sm:px-11 sm:pb-10 sm:pt-9" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-8"><div><p className="text-micro uppercase tracking-editorial text-black/40">Optional account</p><h2 id="auth-title" className="mt-4 font-serif text-4xl tracking-tight-2">Keep your trip.</h2></div><button type="button" onClick={close} aria-label="Close" className="grid h-10 w-10 place-items-center text-xl font-light">×</button></div>
      <p className="mt-4 max-w-sm text-sm font-light leading-6 text-black/55">Save your edit and return to it anytime. Planning and booking links always work without an account.</p>
      {!emailMode ? <div className="mt-8 grid gap-3">
        <button type="button" onClick={() => continueWith("google")} className="min-h-14 border border-black bg-black px-5 text-micro uppercase tracking-editorial text-white transition hover:bg-ink">Continue with Google</button>
        <button type="button" onClick={() => setEmailMode(true)} className="min-h-14 border border-black/20 px-5 text-micro uppercase tracking-editorial">Continue with email</button>
      </div> : <form onSubmit={continueWithEmail} className="mt-8">
        <label htmlFor="account-email" className="text-micro uppercase tracking-editorial text-black/45">Email address</label>
        <input id="account-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-3 min-h-14 w-full border border-black/20 bg-white px-4 outline-none focus:border-black" placeholder="you@example.com" />
        <button className="mt-3 min-h-14 w-full bg-black px-5 text-micro uppercase tracking-editorial text-white">Email me a sign-in link</button>
        <button type="button" onClick={() => setEmailMode(false)} className="mt-4 text-micro uppercase tracking-editorial text-black/50">Back</button>
      </form>}
      {status && <p role="status" className="mt-5 text-xs leading-5 text-black/55">{status}</p>}
      <p className="mt-7 border-t border-black/10 pt-5 text-xs leading-5 text-black/65">We use your email only to sign you in and keep your saved trips. Creating an account does not subscribe you to marketing email. You can download or delete your data anytime. <Link href="/privacy" className="underline underline-offset-2">Privacy policy</Link></p>
    </section>
  </div>;
}

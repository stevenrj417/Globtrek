"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { AuthSheet } from "./AuthSheet";

export function AccountEntry({ compact = false, light = false }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  if (loading) return <span className="w-12" aria-hidden="true" />;
  if (user) return <Link href="/my-trips" className={`${compact ? "text-[9px]" : "text-xs"} uppercase tracking-[0.16em] ${light ? "text-white" : "text-[#565656]"}`}>My trips</Link>;
  return <>
    <button type="button" onClick={() => setOpen(true)} className={`${compact ? "text-[9px]" : "text-xs"} uppercase tracking-[0.16em] ${light ? "text-white" : "text-[#565656]"}`}>Sign in</button>
    <AuthSheet open={open} onClose={() => setOpen(false)} returnTo={typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`} />
  </>;
}

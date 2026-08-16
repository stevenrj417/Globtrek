"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { AuthSheet } from "./AuthSheet";

export function AccountEntry({ compact = false, light = false }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  if (loading) return <span className="w-12" aria-hidden="true" />;
  if (user) {
    const metadata = user.user_metadata || {};
    const avatar = metadata.avatar_url || metadata.picture;
    const firstName = String(metadata.full_name || metadata.name || user.email || "Account").split(/[\s@]/)[0];
    return <Link href="/account" aria-label="Open your Globtrek account" className={`group flex items-center gap-2.5 ${light ? "text-white" : "text-[#353535]"}`}>
      {avatar ? <Image src={avatar} alt="" width={32} height={32} unoptimized className={`rounded-full object-cover ring-1 ${light ? "ring-white/50" : "ring-black/15"}`} /> : <span aria-hidden="true" className={`grid h-8 w-8 place-items-center rounded-full border text-[10px] uppercase ${light ? "border-white/55" : "border-black/20"}`}>{firstName.slice(0, 1)}</span>}
      <span className={`${compact ? "text-[9px]" : "text-[10px]"} hidden uppercase tracking-[0.16em] sm:inline`}>{firstName}</span>
    </Link>;
  }
  return <>
    <button type="button" onClick={() => setOpen(true)} className={`${compact ? "text-[9px]" : "text-xs"} uppercase tracking-[0.16em] ${light ? "text-white" : "text-[#565656]"}`}>Sign in</button>
    <AuthSheet open={open} onClose={() => setOpen(false)} returnTo={typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`} />
  </>;
}

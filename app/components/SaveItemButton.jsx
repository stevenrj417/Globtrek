"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { AuthSheet } from "./AuthSheet";

const PENDING_KEY = "globtrekPendingSavedItem";

export function SaveItemButton({ item, className = "", savedLabel = "Saved" }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  async function save(payload = item) {
    setStatus("Saving…");
    const response = await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setStatus(data.error || "Could not save");
    window.localStorage.removeItem(PENDING_KEY);
    setStatus(savedLabel);
  }

  useEffect(() => {
    if (!user) return;
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try { const pending = JSON.parse(raw); const timer = window.setTimeout(() => save(pending), 0); return () => window.clearTimeout(timer); } catch { window.localStorage.removeItem(PENDING_KEY); }
    // Authentication transition intentionally triggers pending recovery once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleSave() {
    if (loading) return;
    if (user) return save();
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(item));
    setOpen(true);
  }

  return <><button type="button" onClick={handleSave} className={className} aria-label={`Save ${item.type} ${item.title}`}>{status || "♡ Save"}</button><AuthSheet open={open} onClose={() => setOpen(false)} returnTo={typeof window === "undefined" ? "/results" : `${window.location.pathname}${window.location.search}`} /></>;
}

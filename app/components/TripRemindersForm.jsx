"use client";

import { useState } from "react";

export function TripRemindersForm({ token, action }) {
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  async function submit() {
    setStatus("Updating…");
    const response = await fetch("/api/email/followups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, action }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setStatus(data.error || "We couldn't update this right now."); return; }
    setDone(true);
    const place = data.destination ? ` about ${data.destination}` : "";
    setStatus(data.status === "stopped" ? `Done. No more emails${place}.` : data.status === "active" ? `You're set. The first check-in${place} arrives tomorrow.` : "This trip's check-ins have already finished.");
  }
  return (
    <div>
      <button type="button" onClick={submit} disabled={!token || done} className="min-h-14 bg-black px-7 text-micro uppercase tracking-editorial text-white disabled:opacity-35">
        {action === "stop" ? "Stop emails about this trip" : "Yes, send me reminders"}
      </button>
      <p role="status" className="mt-5 max-w-md text-sm font-light leading-6 text-black/55">{status}</p>
    </div>
  );
}

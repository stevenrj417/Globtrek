"use client";

import { useState } from "react";

// Rename, copy or delete a saved trip from the account page.
export function TripActions({ trip, onChanged }) {
  const [mode, setMode] = useState(null);
  const [title, setTitle] = useState(trip.trip_data?.title || trip.destination_name);
  const [status, setStatus] = useState("");

  async function call(path, init, done) {
    setStatus("Working…");
    const response = await fetch(path, init).catch(() => null);
    const data = response && response.status !== 204 ? await response.json().catch(() => ({})) : {};
    if (!response?.ok) return setStatus(data.error || "Something went wrong. Try again.");
    setStatus("");
    setMode(null);
    done(data);
  }
  const rename = (event) => { event.preventDefault(); call(`/api/trips/${trip.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) }, (data) => onChanged({ type: "update", trip: data.trip })); };
  const duplicate = () => call(`/api/trips/${trip.id}/duplicate`, { method: "POST" }, (data) => onChanged({ type: "add", trip: data.trip }));
  const remove = () => call(`/api/trips/${trip.id}`, { method: "DELETE" }, () => onChanged({ type: "remove", id: trip.id }));
  const link = "min-h-11 text-micro uppercase tracking-editorial text-black/60 hover:text-black";

  return <div className="mt-4 border-t border-black/10 pt-3">
    <div className="flex flex-wrap gap-x-5">
      <button type="button" aria-expanded={mode === "rename"} onClick={() => setMode(mode === "rename" ? null : "rename")} className={link}>Rename</button>
      <button type="button" onClick={duplicate} className={link}>Duplicate</button>
      <button type="button" aria-expanded={mode === "delete"} onClick={() => setMode(mode === "delete" ? null : "delete")} className={link}>Delete</button>
    </div>
    {mode === "rename" ? <form onSubmit={rename} className="mt-2 flex flex-wrap items-end gap-3"><label className="text-xs">Trip name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required className="mt-1 block min-h-11 w-56 border border-black/20 px-3 text-base" /></label><button className="min-h-11 bg-black px-4 text-sm text-white">Save</button></form> : null}
    {mode === "delete" ? <div className="mt-2 text-sm"><p>Delete this trip? This can&apos;t be undone, and any share link stops working.</p><div className="mt-2 flex gap-3"><button type="button" onClick={remove} className="min-h-11 bg-black px-4 text-white">Delete trip</button><button type="button" onClick={() => setMode(null)} className="min-h-11 px-4 underline">Cancel</button></div></div> : null}
    {status ? <p role="status" className="mt-2 text-xs">{status}</p> : null}
  </div>;
}

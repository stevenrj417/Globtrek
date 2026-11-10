"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { addNights, nightsBetween, nightsLabel } from "../lib/trip/schedule";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const BOOKABLE_DAYS = 330;

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
const noSubscribe = () => () => {};

function utc(iso) { return new Date(`${iso}T00:00:00Z`); }
function monthKey(iso) { return iso.slice(0, 7); }
function shiftMonth(key, amount) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}
function format(iso, options) { return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(utc(iso)); }
function monthDays(key) {
  const first = utc(`${key}-01`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: count }, (_, index) => `${key}-${String(index + 1).padStart(2, "0")}`)];
}

// Range calendar for a trip of minNights–maxNights. Choosing a departure fills in
// the return at the shortest allowed length; only allowed returns can be picked.
export function TripDatePicker({ start, end, onChange, minNights = 1, maxNights = 28, months = 2, label = "Trip dates" }) {
  const today = useSyncExternalStore(noSubscribe, localToday, () => null);
  const earliest = today ? addNights(today, 1) : null;
  const latest = today ? addNights(today, BOOKABLE_DAYS) : null;
  const fixed = minNights === maxNights;
  const [choosingReturn, setChoosingReturn] = useState(false);
  const [hover, setHover] = useState(null);
  const [view, setView] = useState(null);
  const [focus, setFocus] = useState(null);
  const grid = useRef(null);
  const nights = nightsBetween(start, end);

  // Keep saved dates inside the allowed length (for example after the traveler
  // goes back and picks a different trip length).
  useEffect(() => {
    if (start && end && (!nights || nights < minNights || nights > maxNights)) onChange(start, addNights(start, minNights));
  }, [start, end, nights, minNights, maxNights]); // eslint-disable-line react-hooks/exhaustive-deps

  const anchor = view || (start ? monthKey(start) : today ? monthKey(today) : null);
  if (!anchor) return <div className="h-80" aria-hidden="true" />;
  const visible = Array.from({ length: months }, (_, index) => shiftMonth(anchor, index));
  const active = focus || start || earliest;

  function blocked(day) { return Boolean((earliest && day < earliest) || (latest && day > latest)); }
  function returnAllowed(day) {
    if (!choosingReturn || !start) return false;
    const gap = nightsBetween(start, day);
    return Boolean(gap && gap >= minNights && gap <= maxNights && !blocked(day));
  }
  function choose(day) {
    if (blocked(day)) return;
    if (choosingReturn && returnAllowed(day)) { onChange(start, day); setChoosingReturn(false); setHover(null); return; }
    onChange(day, addNights(day, minNights));
    setChoosingReturn(!fixed);
  }
  function moveFocus(day) {
    if (!day) return;
    setFocus(day);
    if (!visible.includes(monthKey(day))) setView(monthKey(day) < anchor ? monthKey(day) : shiftMonth(monthKey(day), 1 - months));
    requestAnimationFrame(() => grid.current?.querySelector(`[data-day="${day}"]`)?.focus());
  }
  function onKeyDown(event, day) {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (steps[event.key]) { event.preventDefault(); moveFocus(addNights(day, steps[event.key])); }
    else if (event.key === "PageUp" || event.key === "PageDown") { event.preventDefault(); const target = utc(day); target.setUTCMonth(target.getUTCMonth() + (event.key === "PageUp" ? -1 : 1)); moveFocus(target.toISOString().slice(0, 10)); }
    else if (event.key === "Escape" && choosingReturn) { event.preventDefault(); setChoosingReturn(false); setHover(null); }
  }

  const previewEnd = choosingReturn && hover && returnAllowed(hover) ? hover : end;
  const canGoBack = !earliest || anchor > monthKey(earliest);
  const canGoForward = !latest || shiftMonth(anchor, months - 1) < monthKey(latest);
  const lengthText = fixed ? nightsLabel(minNights) : `${minNights}–${maxNights} nights`;
  const hint = !start ? `Pick your departure. Your trip is ${lengthText}${fixed ? ", so we'll set the return for you" : ""}.`
    : choosingReturn ? `Now pick your return, ${lengthText} after departure.`
      : fixed ? `Return is set ${nightsLabel(minNights)} after departure. Pick another day to move the trip.` : "Pick another departure to move the trip.";

  return <div className="select-none" role="group" aria-label={label}>
    <div className="grid grid-cols-2 border border-black/15 bg-white">
      <button type="button" onClick={() => { setChoosingReturn(false); if (start) moveFocus(start); }} className={`px-4 py-3 text-left transition-colors ${!choosingReturn ? "bg-ink text-white" : "hover:bg-black/[.03]"}`} aria-pressed={!choosingReturn}>
        <span className={`block text-micro uppercase tracking-editorial ${!choosingReturn ? "text-white/60" : "text-muted"}`}>Depart</span>
        <span className="mt-1 block font-serif text-xl leading-tight">{start ? format(start, { weekday: "short", month: "short", day: "numeric" }) : "Choose a day"}</span>
      </button>
      <button type="button" disabled={!start || fixed} onClick={() => { setChoosingReturn(true); if (end) moveFocus(end); }} className={`border-l border-black/15 px-4 py-3 text-left transition-colors disabled:cursor-default ${choosingReturn ? "bg-ink text-white" : "enabled:hover:bg-black/[.03]"}`} aria-pressed={choosingReturn}>
        <span className={`block text-micro uppercase tracking-editorial ${choosingReturn ? "text-white/60" : "text-muted"}`}>Return{fixed ? " · set for you" : ""}</span>
        <span className="mt-1 block font-serif text-xl leading-tight">{end ? format(end, { weekday: "short", month: "short", day: "numeric" }) : "—"}</span>
      </button>
    </div>

    <div className="mt-5 flex items-center justify-between">
      <button type="button" onClick={() => setView(shiftMonth(anchor, -1))} disabled={!canGoBack} aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-full border border-black/15 text-base transition-colors enabled:hover:border-black disabled:opacity-25">‹</button>
      <p className="text-micro uppercase tracking-label text-muted" aria-live="polite">{start && end ? <span className="tabular text-black">{format(start, { month: "short", day: "numeric" })} → {format(end, { month: "short", day: "numeric" })} · {nightsLabel(nightsBetween(start, end) || minNights)}</span> : lengthText}</p>
      <button type="button" onClick={() => setView(shiftMonth(anchor, 1))} disabled={!canGoForward} aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-full border border-black/15 text-base transition-colors enabled:hover:border-black disabled:opacity-25">›</button>
    </div>

    <div ref={grid} className={`mt-3 grid gap-6 ${months > 1 ? "sm:grid-cols-2" : ""}`} onMouseLeave={() => setHover(null)}>
      {visible.map((key, monthIndex) => <table key={key} role="grid" aria-label={format(`${key}-01`, { month: "long", year: "numeric" })} className={`w-full table-fixed border-collapse ${monthIndex > 0 ? "hidden sm:table" : ""}`}>
        <caption className="pb-3 text-left font-serif text-lg">{format(`${key}-01`, { month: "long" })} <span className="text-muted">{format(`${key}-01`, { year: "numeric" })}</span></caption>
        <thead><tr>{WEEKDAYS.map((day, index) => <th key={index} scope="col" className="pb-2 text-center text-micro font-normal uppercase tracking-label text-subtle">{day}</th>)}</tr></thead>
        <tbody>{Array.from({ length: Math.ceil(monthDays(key).length / 7) }, (_, row) => <tr key={row}>{monthDays(key).slice(row * 7, row * 7 + 7).concat(Array(7).fill(null)).slice(0, 7).map((day, column) => {
          if (!day) return <td key={column} />;
          const isStart = day === start;
          const isEnd = day === previewEnd && Boolean(start);
          const inRange = start && previewEnd && day > start && day < previewEnd;
          const off = blocked(day) || (choosingReturn && start && day > start && !returnAllowed(day));
          const option = returnAllowed(day) && !isEnd;
          const band = inRange || ((isStart || isEnd) && start && previewEnd && start !== previewEnd);
          const bandShape = isStart ? "left-1/2 right-0" : isEnd ? "left-0 right-1/2" : "inset-x-0";
          const name = `${format(day, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${isStart ? ", departure" : isEnd ? ", return" : ""}${off ? ", not available" : option ? `, return option, ${nightsLabel(nightsBetween(start, day))}` : ""}`;
          return <td key={column} className="relative px-0 py-0.5 text-center">
            {band ? <span aria-hidden="true" className={`absolute inset-y-1 bg-black/[.06] ${bandShape}`} /> : null}
            <button type="button" data-day={day} tabIndex={day === active ? 0 : -1} aria-label={name} aria-pressed={isStart || isEnd} aria-disabled={off || undefined}
              onClick={() => { if (!off) choose(day); }} onKeyDown={(event) => onKeyDown(event, day)} onMouseEnter={() => setHover(day)} onFocus={() => setFocus(day)}
              className={`tabular relative mx-auto grid aspect-square w-full max-w-11 place-items-center rounded-full text-sm transition-[background-color,color,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${isStart || isEnd ? "bg-ink font-medium text-white" : inRange && off ? "cursor-default text-black/65" : off ? "cursor-not-allowed text-black/20" : option ? "font-medium text-black ring-1 ring-inset ring-black/40 hover:bg-ink hover:text-white" : "text-black hover:bg-black/[.07]"}`}>
              {Number(day.slice(8))}
              {day === today ? <span aria-hidden="true" className={`absolute bottom-1.5 h-1 w-1 rounded-full ${isStart || isEnd ? "bg-white" : "bg-black/40"}`} /> : null}
            </button>
          </td>;
        })}</tr>)}</tbody>
      </table>)}
    </div>

    {!fixed && start && maxNights - minNights <= 5 ? <div className="mt-4 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Trip length">
      {Array.from({ length: maxNights - minNights + 1 }, (_, index) => minNights + index).slice(0, 8).map((count) => <button key={count} type="button" role="radio" aria-checked={nights === count} onClick={() => { onChange(start, addNights(start, count)); setChoosingReturn(false); }} className={`min-h-9 rounded-full border px-4 text-micro uppercase tracking-label transition-colors ${nights === count ? "border-black bg-ink text-white" : "border-black/15 text-muted hover:border-black hover:text-black"}`}>{nightsLabel(count)}</button>)}
    </div> : null}
    <p className="mt-4 text-xs leading-5 text-muted">{hint}</p>
  </div>;
}

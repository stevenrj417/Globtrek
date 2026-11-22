"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { STORY_MILESTONES, daysUntil, localToday, suggestedHeadline } from "../lib/share/storyText";

const STYLES = [
  ["minimal", "Minimal luxury"],
  ["postcard", "Vintage postcard"],
  ["tropical", "Tropical"],
  ["editorial", "Modern editorial"],
];
const APPS = ["Instagram", "TikTok", "Snapchat", "Facebook"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const shiftDays = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
const slug = (value) => String(value || "trip").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";

export function storyUrl({ style, name, country, departure, returnDate, today, headline, countdown, dates, countryOnly, ll }) {
  const params = new URLSearchParams({ s: style, n: name || "" });
  if (country) params.set("c", country);
  if (ISO.test(departure || "")) params.set("dep", departure);
  if (ISO.test(returnDate || "")) params.set("ret", returnDate);
  if (today) params.set("today", today);
  if (headline) params.set("t", headline);
  if (!countdown) params.set("cd", "0");
  if (dates) params.set("dt", "1");
  if (countryOnly) params.set("co", "1");
  if (ll) params.set("ll", ll);
  return `/api/story?${params}`;
}

// A calendar file with three reminders (30, 7 and 1 day out), each linking back
// to the studio so the story is made fresh with the right countdown.
function reminderFile({ name, departure, studioUrl }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const events = STORY_MILESTONES.map((days) => {
    const day = shiftDays(departure, -days).replace(/-/g, "");
    const next = shiftDays(departure, -days + 1).replace(/-/g, "");
    return ["BEGIN:VEVENT", `UID:story-${days}-${departure}-${slug(name)}@glob-trek.com`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${next}`,
      `SUMMARY:${days === 1 ? "Tomorrow" : `${days} days`} until ${name}`, `DESCRIPTION:Make a fresh countdown story: ${studioUrl}`, `URL:${studioUrl}`, "END:VEVENT"].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GlobTrek//Stories//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

function Toggle({ id, checked, onChange, children, hint }) {
  return <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-2">
    <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-black" />
    <span><span className="block text-sm font-medium">{children}</span>{hint ? <span className="block text-xs leading-5">{hint}</span> : null}</span>
  </label>;
}

// Make a 9:16 story of the trip: pick a look, a line of text and what to show,
// then share it straight to an app (phone share sheet) or download it.
// story: { name, country, departure, returnDate, ll }
export function StoryStudio({ story, id = "share-story", headingLevel = 2 }) {
  const [style, setStyle] = useState("minimal");
  const [headline, setHeadline] = useState("");
  const [countdown, setCountdown] = useState(true);
  const [dates, setDates] = useState(false);
  const [countryOnly, setCountryOnly] = useState(false);
  const [departure, setDeparture] = useState(story.departure || "");
  const [today, setToday] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState("");
  const [canShareFiles, setCanShareFiles] = useState(false);

  // The countdown uses the traveler's own date, known only in the browser.
  useEffect(() => {
    const timer = setTimeout(() => {
      setToday(localToday());
      try { setCanShareFiles(Boolean(navigator.canShare?.({ files: [new File([""], "x.png", { type: "image/png" })] }))); } catch {}
    });
    return () => clearTimeout(timer);
  }, []);

  const hasDate = ISO.test(departure);
  const daysNow = today && hasDate ? daysUntil(departure, today) : null;
  const shownToday = milestone != null && hasDate ? shiftDays(departure, -milestone) : today;
  const days = shownToday && hasDate ? daysUntil(departure, shownToday) : null;
  const suggestion = suggestedHeadline({ days, name: story.name, country: story.country, placeOnly: countryOnly });
  const src = today ? storyUrl({ style, name: story.name, country: story.country, departure, returnDate: story.returnDate, today: shownToday, headline: headline.trim(), countdown, dates, countryOnly, ll: story.ll }) : null;
  const ready = src && loaded === src;
  const fileName = `globtrek-${slug(countryOnly ? story.country : story.name)}${days != null && countdown ? `-${days}-days` : ""}.png`;
  const presets = [
    `Next stop: ${countryOnly ? story.country || story.name : story.name}`,
    days != null && days > 1 ? `${days} days until paradise` : null,
    "Out of office",
    "Wish you were here",
  ].filter(Boolean);
  const upcomingMilestones = hasDate && daysNow != null ? STORY_MILESTONES.filter((value) => value < daysNow) : [];

  async function imageFile() {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`story_${response.status}`);
    return new File([await response.blob()], fileName, { type: "image/png" });
  }

  async function download() {
    setBusy("download");
    try {
      const file = await imageFile();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      track("story_downloaded", { style });
      return true;
    } catch {
      setNote("The story didn't download. Try again in a moment.");
      return false;
    } finally { setBusy(null); }
  }

  // On phones the share sheet opens with the image attached; pick the app there
  // (Instagram and Facebook offer "Story", Snapchat and TikTok open their editor).
  // Desktop browsers can't hand a picture to those apps, so we download it.
  async function share(app) {
    setNote("");
    if (!canShareFiles) {
      if (await download()) setNote(`Saved. Send it to your phone, then post it from ${app || "your app"}: in Instagram, tap + then Story.`);
      return;
    }
    setBusy(app || "share");
    try {
      const file = await imageFile();
      await navigator.share({ files: [file] });
      track("story_shared", { style, app: app || "any" });
      setNote(app ? `Picked ${app}? It opens with your story ready to post.` : "");
    } catch (error) {
      if (error?.name !== "AbortError") setNote("Sharing didn't work here. Download the story instead and post it from the app.");
    } finally { setBusy(null); }
  }

  function reminders() {
    const studio = new URL("/story", window.location.origin);
    for (const [key, value] of Object.entries({ n: story.name, c: story.country, dep: departure, ret: story.returnDate, ll: story.ll })) if (value) studio.searchParams.set(key, value);
    const blob = new Blob([reminderFile({ name: story.name, departure, studioUrl: studio.toString() })], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `globtrek-${slug(story.name)}-countdown.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    track("story_reminders_added");
  }

  const chip = (active) => `min-h-10 border px-3.5 text-sm transition-colors ${active ? "border-black bg-black text-white" : "border-black/25 bg-white hover:border-black"}`;

  return <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
    <p className="text-micro uppercase tracking-editorial">Share the countdown</p>
    {headingLevel === 1
      ? <h1 id={`${id}-heading`} className="mt-2 font-serif text-[clamp(2rem,3.4vw,2.8rem)] leading-[.95] tracking-tight-2">Your trip, as a story</h1>
      : <h2 id={`${id}-heading`} className="mt-2 font-serif text-[clamp(2rem,3.4vw,2.8rem)] leading-[.95] tracking-tight-2">Your trip, as a story</h2>}
    <p className="mt-3 max-w-2xl text-sm leading-6">A 9:16 picture of {story.name === "Your next trip" ? "your next trip" : story.name} for Instagram, TikTok, Snapchat or Facebook. Pick a look and the words; nothing personal goes on it unless you switch it on.</p>

    <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,340px)_1fr] md:gap-12">
      <div>
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[340px] overflow-hidden bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG from /api/story */}
          {src ? <img key={src} src={src} alt={`Story preview: ${headline || suggestion}, ${countryOnly ? story.country : story.name}`} onLoad={() => setLoaded(src)} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-40"}`} /> : null}
          {!ready ? <span className="absolute inset-x-0 bottom-4 text-center text-micro uppercase tracking-label" aria-live="polite">Making your story…</span> : null}
        </div>
      </div>

      <div className="min-w-0">
        <fieldset>
          <legend className="text-micro uppercase tracking-label">Look</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {STYLES.map(([value, label]) => <button key={value} type="button" aria-pressed={style === value} onClick={() => setStyle(value)} className={chip(style === value)}>{label}</button>)}
          </div>
        </fieldset>

        <div className="mt-7">
          <label htmlFor={`${id}-headline`} className="text-micro uppercase tracking-label">Your words</label>
          <input id={`${id}-headline`} value={headline} maxLength={48} onChange={(event) => setHeadline(event.target.value)} placeholder={suggestion} className="mt-3 min-h-12 w-full border border-black/20 bg-white px-4 outline-none focus:border-black" />
          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((value) => <button key={value} type="button" onClick={() => setHeadline(value)} className="min-h-9 border border-black/15 px-3 text-xs hover:border-black">{value}</button>)}
            {headline ? <button type="button" onClick={() => setHeadline("")} className="min-h-9 px-2 text-xs underline underline-offset-4">Use the suggestion</button> : null}
          </div>
        </div>

        {!story.departure ? <div className="mt-7">
          <label htmlFor={`${id}-departure`} className="text-micro uppercase tracking-label">When do you leave?</label>
          <input id={`${id}-departure`} type="date" value={departure} min={today || undefined} onChange={(event) => setDeparture(event.target.value)} className="mt-3 min-h-12 border border-black/20 bg-white px-4 outline-none focus:border-black" />
        </div> : null}

        <fieldset className="mt-7">
          <legend className="text-micro uppercase tracking-label">On the story</legend>
          <div className="mt-2">
            <Toggle id={`${id}-countdown`} checked={countdown} onChange={setCountdown} hint={hasDate ? null : "Add your departure date to show it."}>Countdown to departure</Toggle>
            <Toggle id={`${id}-dates`} checked={dates} onChange={setDates} hint="Off by default, so followers don't know when your home is empty.">Travel dates</Toggle>
            <Toggle id={`${id}-country`} checked={countryOnly} onChange={setCountryOnly} hint={story.country ? `Shows ${story.country} instead of ${story.name}.` : null}>Country only</Toggle>
          </div>
        </fieldset>

        {upcomingMilestones.length ? <fieldset className="mt-7">
          <legend className="text-micro uppercase tracking-label">Countdown</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={milestone == null} onClick={() => setMilestone(null)} className={chip(milestone == null)}>Today · {daysNow} days</button>
            {upcomingMilestones.map((value) => <button key={value} type="button" aria-pressed={milestone === value} onClick={() => setMilestone(value)} className={chip(milestone === value)}>{value === 1 ? "1 day out" : `${value} days out`}</button>)}
          </div>
          <p className="mt-2 text-xs leading-5">See how it will look closer to the trip. Add reminders and we&apos;ll point you back here to post a fresh one.</p>
        </fieldset> : null}

        <div className="mt-8 border-t border-black pt-6">
          <p className="text-micro uppercase tracking-label">Share</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {APPS.map((app) => <button key={app} type="button" disabled={!ready || Boolean(busy)} onClick={() => share(app)} className="min-h-12 border border-black/25 bg-white px-3 text-sm font-medium transition-colors hover:border-black disabled:opacity-50">{busy === app ? "Opening…" : app}</button>)}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={!ready || Boolean(busy)} onClick={download} className="min-h-12 bg-black px-5 text-micro font-medium uppercase tracking-label text-white hover:bg-black/85 disabled:opacity-50">{busy === "download" ? "Saving…" : "Download story"}</button>
            {hasDate && upcomingMilestones.length ? <button type="button" onClick={reminders} className="min-h-12 border border-black/25 px-5 text-micro font-medium uppercase tracking-label hover:border-black">Remind me at {upcomingMilestones.join(", ")} days</button> : null}
          </div>
          <p className="mt-3 text-xs leading-5" aria-live="polite">{note || (canShareFiles ? "Opens your phone's share sheet with the story attached; pick the app there." : "On a computer the story downloads; post it from your phone.")}</p>
        </div>
      </div>
    </div>
  </section>;
}

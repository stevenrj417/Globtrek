"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

const fieldClass = "mt-2 min-h-12 w-full border-0 border-b border-black/25 bg-transparent py-3 text-sm outline-none transition-colors placeholder:text-black/30 focus:border-black";
const labelClass = "text-[9px] font-medium uppercase tracking-[0.17em] text-black/48";

const productConfig = {
  cruise: {
    submit: "Shape my voyage",
    title: "Your voyage, in outline.",
    fields: [
      ["origin", "Departure port", "text", "Port, city, or region"],
      ["destination", "Destination or region", "text", "Mediterranean, Alaska, Caribbean…"],
      ["startDate", "Earliest departure", "date"],
      ["endDate", "Latest return", "date"],
      ["travelers", "Travelers", "number", "2"],
      ["budget", "Total budget", "number", "6000"],
      ["style", "Cruise style", "select", ["Quiet and restorative", "Balanced discovery", "Social and energetic"]],
      ["cruiseLine", "Preferred cruise line", "text", "No preference"],
      ["ship", "Preferred ship", "text", "No preference"],
      ["cabinType", "Cabin type", "select", ["No preference", "Interior", "Ocean view", "Balcony", "Suite"]],
      ["excursions", "Excursion interests", "text", "Food, history, beaches…"],
      ["onboardPreferences", "Onboard preferences", "text", "Wellness, dining, entertainment…"],
    ],
  },
  road: {
    submit: "Shape my route",
    title: "Your road trip, in outline.",
    fields: [
      ["origin", "Starting location", "text", "City, address, or landmark"],
      ["destination", "Destination", "text", "A final stop or open region"],
      ["startDate", "Departure", "date"],
      ["endDate", "Return", "date"],
      ["travelers", "Travelers", "number", "2"],
      ["budget", "Total budget", "number", "3500"],
      ["style", "Travel style", "select", ["Scenic and unhurried", "Balanced discovery", "Active and energetic"]],
      ["vehicleType", "Vehicle type", "select", ["Gas", "Hybrid", "Electric", "Rental / not sure"]],
      ["fuelEfficiency", "Fuel efficiency", "text", "MPG, L/100 km, or unknown"],
      ["fuelTankSize", "Fuel tank size", "text", "Gallons, litres, or unknown"],
      ["evRange", "EV range", "text", "Miles, kilometres, or not applicable"],
      ["preferredDrivingDistance", "Preferred daily drive", "text", "Miles, kilometres, or hours"],
    ],
  },
};

function Field({ definition }) {
  const [name, label, type, detail] = definition;
  if (type === "select") { const required = ["style", "vehicleType"].includes(name); return <label className={labelClass}>{label}<select name={name} required={required} className={fieldClass} defaultValue=""><option value="" disabled>Select</option>{detail.map((option) => <option key={option}>{option}</option>)}</select></label>; }
  return <label className={labelClass}>{label}<input className={fieldClass} name={name} type={type} placeholder={detail || undefined} min={type === "number" ? "1" : undefined} required={["origin", "destination", "startDate", "endDate", "travelers", "budget"].includes(name)} /></label>;
}

export function ProductPlanner({ product }) {
  const config = productConfig[product];
  const [brief, setBrief] = useState(null);

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBrief(values);
    track(`${product}_planner_completed`, { style: values.style, travelers: values.travelers });
  }

  return <div className="bg-[#f4f1eb] px-5 py-20 sm:px-8 sm:py-28">
    <div className="mx-auto max-w-[1320px]">
      <div className="grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#9b7b43]">Start planning</p><h2 className="mt-6 max-w-md font-serif text-[clamp(3.1rem,5vw,5.8rem)] font-normal leading-[.9] tracking-[-0.055em]">Built around how you want to move.</h2></div>
        <form onSubmit={submit} className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {config.fields.map((field) => <Field key={field[0]} definition={field} />)}
          <div className="pt-3 sm:col-span-2"><button type="submit" className="inline-flex min-h-14 w-full items-center justify-between bg-[#171714] px-6 text-xs font-semibold uppercase tracking-[0.1em] text-white sm:w-auto sm:min-w-64"><span>{config.submit}</span><span aria-hidden="true">→</span></button></div>
        </form>
      </div>
      {brief ? <section aria-live="polite" className="mt-16 border-t border-[#9b7b43]/40 pt-10 sm:mt-24"><p className="text-[10px] uppercase tracking-[0.2em] text-[#9b7b43]">Planning brief ready</p><h3 className="mt-4 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">{config.title}</h3><p className="mt-5 max-w-3xl text-sm leading-7 text-black/58">{brief.origin} → {brief.destination} · {brief.travelers} {Number(brief.travelers) === 1 ? "traveler" : "travelers"} · ${Number(brief.budget).toLocaleString("en-US")} total budget · {brief.style.toLowerCase()}.</p><p className="mt-4 text-xs text-black/45">This planning foundation is saved in this page for review. Live routes, availability, and prices are not yet quoted.</p></section> : null}
    </div>
  </div>;
}

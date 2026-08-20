"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const demoRooms = [
  { id: "studio", name: "Mountain Studio", detail: "1 king bed · 2 guests", price: "Demo estimate · $420/night" },
  { id: "suite", name: "View Suite", detail: "1 king bed · Sitting room · 2 guests", price: "Demo estimate · $610/night" },
  { id: "residence", name: "Two-bedroom Residence", detail: "2 bedrooms · 4 guests", price: "Demo estimate · $890/night" },
];

export function DemoStay() {
  const [room, setRoom] = useState("studio");

  return (
    <div className="mx-auto max-w-[1600px] px-5 pb-24 sm:px-8 sm:pb-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-5">
        <div className="min-w-0"><h1 className="max-w-full text-4xl font-semibold leading-[0.95] tracking-[-0.05em] [overflow-wrap:anywhere] sm:text-6xl">Sample Alpine House</h1></div>
        <p className="border border-black/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em]">Design demo · not bookable</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.6fr_.8fr]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#ddd]"><Image src="/banff-feature.jpg" alt="Sample mountain hotel used for a booking-interface design demonstration" fill className="object-cover" sizes="70vw" priority /></div>
        <div className="grid min-h-64 grid-cols-2 gap-3 md:grid-cols-1">
          <div className="relative overflow-hidden bg-[#ddd]"><Image src="/luxury-snow.jpg" alt="Snowy mountain atmosphere used in the stay design demonstration" fill className="object-cover" sizes="30vw" /></div>
          <div className="relative min-h-48 overflow-hidden bg-[#ddd]"><Image src="/luxury-coast.jpg" alt="Bright architectural atmosphere used in the stay design demonstration" fill className="object-cover" sizes="30vw" /></div>
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#707070]">Design preview</p><p className="mt-4 max-w-md text-base leading-7 text-[#555]">This sample shows how future provider-supplied rooms could be compared. The property, room details, prices, and availability shown here are mock interface content only.</p><button type="button" className="mt-7 text-sm font-medium underline decoration-black/25 hover:decoration-black">Change hotel</button></div>
        <div className="border-t border-black/15">
          {demoRooms.map((item) => (
            <label className="grid cursor-pointer grid-cols-[24px_1fr] gap-4 border-b border-black/15 py-6 sm:grid-cols-[24px_1fr_auto]" key={item.id}>
              <input type="radio" name="demo-room" value={item.id} checked={room === item.id} onChange={() => setRoom(item.id)} className="mt-1 h-4 w-4 accent-black" />
              <span><strong className="block text-lg font-medium">{item.name}</strong><span className="mt-1 block text-sm text-[#707070]">{item.detail}</span></span>
              <span className="col-start-2 text-sm font-medium sm:col-start-auto">{item.price}</span>
            </label>
          ))}
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button type="button" disabled className="min-h-12 cursor-not-allowed bg-[#171717] px-7 text-xs font-semibold uppercase tracking-[0.08em] text-white opacity-45">Continue to provider</button>
            <p className="max-w-md text-xs leading-5 text-[#707070]">Disabled in this demo. No live room, price, availability, provider link, payment, or reservation is created.</p>
          </div>
        </div>
      </div>
      <Link href="/results" className="mt-16 inline-block text-sm underline decoration-black/25 hover:decoration-black">Back to results</Link>
    </div>
  );
}

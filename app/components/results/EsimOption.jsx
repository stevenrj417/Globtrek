"use client";

import { useEffect, useState } from "react";
import { track } from "../../lib/analytics";

// Optional: a data eSIM for the trip, only for international destinations.
export function EsimOption({ country, nights }) {
  const [result, setResult] = useState({ key: null, plans: [] });
  const key = `${country}|${nights}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/extras/esim?${new URLSearchParams({ country, nights: String(nights) })}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { plans: [] }))
      .then((body) => setResult({ key, plans: body.plans || [] }))
      .catch(() => {});
    return () => controller.abort();
  }, [country, nights, key]);
  const plans = result.key === key ? result.plans : [];
  if (!plans.length) return null;
  return <div className="mt-8 border-t border-black/10 pt-6">
    <h3 className="text-micro uppercase tracking-label text-black/60">Optional: mobile data</h3>
    <p className="mt-2 max-w-2xl text-sm leading-6">A travel eSIM avoids roaming charges if your phone supports eSIM. Plans valid for your {nights}-night trip:</p>
    <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-4">
      {plans.map((plan) => <li key={plan.title}><a href={plan.bookingUrl} target="_blank" rel="noopener sponsored" onClick={() => track("esim_opened", { country })} className="inline-flex min-h-11 items-center border border-black/20 px-4 text-sm hover:border-black">{plan.unlimited ? "Unlimited" : `${plan.gb} GB`} · {plan.days} days · ${plan.price.toFixed(2)} on Airalo<span className="sr-only"> (opens in a new tab)</span> <span className="ml-2" aria-hidden="true">↗</span></a></li>)}
    </ul>
    <p className="mt-2 text-micro text-black/55">Airalo&apos;s listed price, checked {plans[0].checkedAt}. Networks: {plans[0].networks || "see Airalo"}.</p>
  </div>;
}

import { Suspense } from "react";
import { SiteHeader } from "../../components/SiteChrome";
import { QuickTripQuiz } from "./QuickTripQuiz";

export const metadata = { title: "Plan this destination | GlobTrek", description: "A short destination-specific GlobTrek planning quiz." };
export default function QuickTripPage() { return <main className="min-h-screen bg-[#f4f1eb] text-[#171714]"><SiteHeader actionHref="/discover" actionLabel="Full quiz" /><Suspense fallback={<div className="min-h-[70svh]" aria-label="Loading destination planner" />}><QuickTripQuiz /></Suspense></main>; }

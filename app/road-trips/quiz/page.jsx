import { Suspense } from "react";
import { SiteHeader } from "../../components/SiteChrome";
import { RoadTripQuiz } from "./RoadTripQuiz";

export const metadata = { title: "Create your route | GlobTrek Road Trips", description: "A road-trip quiz shaped around the feeling of the drive." };

export default function RoadTripQuizPage() {
  return <main className="min-h-screen bg-[#f4f1eb] text-black"><SiteHeader actionHref="/road-trips" actionLabel="Road trips" /><Suspense fallback={<div className="grid min-h-[70svh] place-items-center px-6 text-center" aria-label="Loading road-trip planner"><div><p className="text-[10px] uppercase tracking-[0.2em] text-black/50">Road discovery</p><p className="mt-6 font-serif text-5xl tracking-[-0.05em]">Preparing the road.</p></div></div>}><RoadTripQuiz /></Suspense></main>;
}

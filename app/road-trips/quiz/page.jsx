import { Suspense } from "react";
import { SiteHeader } from "../../components/SiteChrome";
import { RoadTripQuiz } from "./RoadTripQuiz";

export const metadata = { title: "Create your route | GlobTrek Road Trips", description: "A road-trip quiz shaped around the feeling of the drive." };

export default function RoadTripQuizPage() {
  return <main className="min-h-screen bg-canvas text-black"><SiteHeader actionHref="/road-trips" actionLabel="Road trips" /><Suspense fallback={<div className="grid min-h-[70svh] place-items-center px-6 text-center" aria-label="Loading road-trip planner"><div><p className="text-micro uppercase tracking-editorial text-black/50">Road discovery</p><p className="mt-6 font-serif text-5xl tracking-tight-3">Preparing the road.</p></div></div>}><RoadTripQuiz /></Suspense></main>;
}

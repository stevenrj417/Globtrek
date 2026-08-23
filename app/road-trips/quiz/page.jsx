import { SiteHeader } from "../../components/SiteChrome";
import { RoadTripQuiz } from "./RoadTripQuiz";

export const metadata = { title: "Create your route | GlobTrek Road Trips", description: "A road-trip quiz shaped around the feeling of the drive." };

export default function RoadTripQuizPage() {
  return <main className="min-h-screen bg-[#f4f1eb] text-[#171714]"><SiteHeader actionHref="/road-trips" actionLabel="Road trips" /><RoadTripQuiz /></main>;
}

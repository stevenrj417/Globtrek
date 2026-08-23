import { SiteHeader } from "../../components/SiteChrome";
import { RoadTripResults } from "./RoadTripResults";

export const metadata = { title: "Your route | GlobTrek Road Trips", description: "A personalized road-trip journey from GlobTrek." };

export default function RoadTripResultsPage() {
  return <main className="min-h-screen bg-[#f7f7f4] text-[#171714]"><SiteHeader actionHref="/road-trips/quiz" actionLabel="Create another route" /><RoadTripResults /></main>;
}

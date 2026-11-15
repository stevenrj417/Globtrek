import { SiteHeader } from "../../components/SiteChrome";
import { QuickTripQuiz } from "./QuickTripQuiz";
import { destinationFor } from "./destinationFor";

export const metadata = { title: "Plan this destination", description: "A short destination-specific GlobTrek planning quiz." };
export default async function QuickTripPage({ searchParams }) {
  const params = await searchParams;
  const destinationId = typeof params?.destination === "string" ? params.destination : null;
  return <main className="min-h-screen bg-canvas text-ink"><SiteHeader actionHref="/discover" actionLabel="Full quiz" /><QuickTripQuiz destinationId={destinationId} destination={destinationFor(destinationId)} /></main>;
}

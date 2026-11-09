import TravelQuiz from "./TravelQuiz";
import { destinations } from "../data/destinations";
import { durationFloors } from "../lib/quiz/durationFloors";

const floors = durationFloors(destinations);

export const metadata = {
  title: "Find your trip",
  description: "Answer 7 quick questions and get one affordable trip that fits your budget.",
  alternates: { canonical: "/discover" },
};

export default function DiscoverPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <TravelQuiz durationFloors={floors} />
    </main>
  );
}

import TravelQuiz from "./TravelQuiz";

export const metadata = {
  title: "Find your trip",
  description: "Answer 7 quick questions and get one affordable trip that fits your budget.",
  alternates: { canonical: "/discover" },
};

export default function DiscoverPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <TravelQuiz />
    </main>
  );
}

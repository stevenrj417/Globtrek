import { SiteHeader } from "../../components/SiteChrome";
import { CruiseResults } from "./CruiseResults";

export const metadata = { title: "Your ocean journey | GlobTrek Cruises", description: "A personalized ocean route concept and complete-journey budget plan." };
export default function CruiseResultsPage() { return <main className="min-h-screen bg-[#f7f7f4] text-[#171714]"><SiteHeader actionHref="/cruises/quiz" actionLabel="Create another cruise" /><CruiseResults /></main>; }

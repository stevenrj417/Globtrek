import { SiteHeader } from "../../components/SiteChrome";
import { CruiseQuiz } from "./CruiseQuiz";

export const metadata = { title: "Create your cruise | GlobTrek Cruises", description: "An ocean-first cruise quiz shaped around your complete-trip budget." };
export default function CruiseQuizPage() { return <main className="min-h-screen bg-[#f4f1eb] text-[#171714]"><SiteHeader actionHref="/cruises" actionLabel="Cruises" /><CruiseQuiz /></main>; }

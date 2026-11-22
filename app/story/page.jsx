import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import { StoryStudio } from "../components/StoryStudio";
import { cleanLine } from "../lib/share/storyText";

export const metadata = { title: "Your trip countdown story", robots: { index: false, follow: false } };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// The story studio on its own page: where the 30/7/1-day reminders lead, so the
// traveler can make a fresh countdown story. Everything comes from the link.
export default async function StoryPage({ searchParams }) {
  const q = await searchParams;
  const one = (key) => (typeof q[key] === "string" ? q[key] : "");
  const name = cleanLine(one("n"), 40);
  const ll = /^-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?$/.test(one("ll")) ? one("ll") : null;
  const story = { name: name || "Your next trip", country: cleanLine(one("c"), 40) || null, departure: ISO.test(one("dep")) ? one("dep") : null, returnDate: ISO.test(one("ret")) ? one("ret") : null, ll };
  return <main className="min-h-screen bg-canvas text-ink">
    <SiteHeader />
    <div className="mx-auto max-w-[1080px] px-5 pt-12 sm:px-8 sm:pt-16"><StoryStudio story={story} /></div>
    <div className="h-[var(--section-space)]" aria-hidden="true" />
    <SiteFooter />
  </main>;
}

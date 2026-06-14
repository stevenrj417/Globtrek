import Link from "next/link";
import TravelQuiz from "./TravelQuiz";

export default function DiscoverPage() {
  const navItems = [
    ["Discover", "/#discover"],
    ["Quiz", "/discover"],
    ["Collections", "/#collections"],
    ["Journal", "/#journal"],
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#efe6dc]">
      <div className="border-b border-[#efe6dc]/10 bg-[#7f634d] px-6 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-[#fff7ef] sm:tracking-[0.3em]">
        One Tab Travel · Coming Soon
      </div>

      <nav className="border-b border-[#efe6dc]/10">
        <div className="mx-auto flex max-w-[2200px] items-center justify-between gap-8 px-5 py-7 sm:px-8 sm:py-8">
          <Link
            href="/"
            className="text-4xl font-black tracking-tight sm:text-5xl"
          >
            globtrek
          </Link>

          <span className="border border-[#efe6dc]/20 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#b8a796]">
            Coming soon
          </span>

          <div className="hidden items-center gap-8 text-xs uppercase tracking-[0.22em] text-[#d8c7b6] md:flex">
            {navItems.map(([label, href]) => (
              <Link className="transition hover:text-white" href={href} key={label}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <TravelQuiz />
    </main>
  );
}

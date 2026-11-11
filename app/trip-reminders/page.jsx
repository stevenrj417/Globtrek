import Link from "next/link";
import { TripRemindersForm } from "../components/TripRemindersForm";

export const metadata = { title: "Trip reminders", robots: { index: false, follow: false } };

export default async function TripRemindersPage({ searchParams }) {
  const { confirm = "", stop = "" } = await searchParams;
  const action = typeof stop === "string" && stop ? "stop" : "confirm";
  const token = action === "stop" ? stop : typeof confirm === "string" ? confirm : "";
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6 text-ink">
      <section className="w-full max-w-2xl border-y border-black/15 py-14">
        <Link href="/" className="text-eyebrow font-semibold uppercase tracking-editorial">GlobTrek</Link>
        <p className="mt-16 text-micro uppercase tracking-editorial text-black/40">Trip reminders</p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight-3 sm:text-7xl">{action === "stop" ? "Stop the check-ins." : "Keep this trip close."}</h1>
        <p className="mb-10 mt-7 max-w-lg text-base font-light leading-7 text-black/55">
          {action === "stop"
            ? "We'll stop emailing you about this trip. Other GlobTrek email, like the monthly ideas, has its own unsubscribe link."
            : "Six short emails over the next month: things to do, where you'd stay and a nudge to check prices. Stop anytime from any of them."}
        </p>
        <TripRemindersForm token={token} action={action} />
      </section>
    </main>
  );
}

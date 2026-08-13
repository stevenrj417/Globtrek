import { SiteFooter, SiteHeader } from "./SiteChrome";

export function EditorialPage({ eyebrow, title, intro, children }) {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <SiteHeader />
      <article className="mx-auto max-w-[1500px] px-6 py-20 sm:px-8 sm:py-28">
        <header className="max-w-5xl border-b border-black/10 pb-14 sm:pb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#707070]">{eyebrow}</p>
          <h1 className="mt-6 text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
            {title}
          </h1>
          {intro ? (
            <p className="mt-8 max-w-3xl text-lg leading-8 text-[#5f5f5f] sm:text-xl">
              {intro}
            </p>
          ) : null}
        </header>
        <div className="legal-copy py-14 sm:py-20">{children}</div>
      </article>
      <SiteFooter />
    </main>
  );
}

export function EditorialSection({ number, title, children }) {
  return (
    <section className="grid gap-5 border-b border-black/10 py-10 first:pt-0 md:grid-cols-[160px_1fr] md:gap-10">
      <p className="text-xs font-medium text-[#777]">{number}</p>
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{title}</h2>
        <div className="mt-5 space-y-4 text-base leading-7 text-[#5f5f5f] sm:text-lg sm:leading-8">
          {children}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";

const navItems = [
  ["Discover", "#discover"],
  ["Quiz", "/discover"],
  ["Collections", "#collections"],
  ["Journal", "#journal"],
];

const collections = [
  {
    name: "Kyoto, Japan",
    price: "From $4,850",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186",
    alt: "Traditional Japanese architecture in Kyoto",
    note: "Culture, food, slow mornings",
  },
  {
    name: "Amalfi Coast",
    price: "From $5,900",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
    alt: "The Amalfi Coast with colorful cliffside buildings and sea",
    note: "Sea cliffs, villas, long lunches",
  },
  {
    name: "Banff",
    price: "From $3,750",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
    alt: "A turquoise lake and mountains in Banff",
    note: "Lodges, alpine air, big views",
  },
];

function ComingSoonBadge() {
  return (
    <span className="inline-flex border border-[#efe6dc]/20 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#b8a796]">
      Coming soon
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070604] text-[#efe6dc]">
      <div className="border-b border-[#efe6dc]/10 bg-[#7f634d] px-6 py-3 text-center text-[10px] uppercase tracking-[0.22em] text-[#fff7ef] sm:tracking-[0.3em]">
        One Tab Travel · Coming Soon
      </div>

      <nav className="border-b border-[#efe6dc]/10 bg-[#070604]/95">
        <div className="mx-auto flex max-w-[1900px] items-center justify-between gap-6 px-5 py-6 sm:px-8">
          <Link
            href="/"
            className="text-4xl font-black tracking-tight sm:text-5xl"
          >
            globtrek
          </Link>

          <div className="hidden gap-10 text-xs uppercase tracking-[0.22em] text-[#d8c7b6] lg:flex">
            {navItems.map(([label, href]) =>
              href.startsWith("/") ? (
                <Link className="transition hover:text-white" href={href} key={label}>
                  {label}
                </Link>
              ) : (
                <a className="transition hover:text-white" href={href} key={label}>
                  {label}
                </a>
              ),
            )}
          </div>

          <Link
            href="/discover"
            className="shrink-0 border border-[#efe6dc]/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#efe6dc] transition duration-300 hover:bg-[#efe6dc] hover:text-black sm:px-7"
          >
            Begin · Coming Soon
          </Link>
        </div>
      </nav>

      <section
        id="discover"
        className="relative min-h-[760px] overflow-hidden md:h-[91vh]"
      >
        <Image
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
          alt="A warm road running through a desert landscape"
          fill
          preload
          className="object-cover"
          sizes="100vw"
          quality={75}
        />
        <div className="absolute inset-0 bg-black/42" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070604] via-black/20 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 px-6 pb-14 sm:px-10 md:px-16 md:pb-20">
          <div className="max-w-6xl">
            <h1 className="max-w-5xl text-[clamp(3rem,7vw,7rem)] font-light uppercase leading-[0.9] tracking-[0.04em] text-[#f4eadf]">
              One Tab Travel
            </h1>
            <div className="mt-6">
              <ComingSoonBadge />
            </div>
            <div className="mt-11 flex flex-wrap items-center gap-4">
              <Link
                href="/discover"
                className="bg-[#efe6dc] px-8 py-5 text-sm font-semibold uppercase tracking-[0.14em] text-black transition duration-300 hover:bg-white sm:px-11"
              >
                Take the Quiz · Coming Soon
              </Link>
              <a
                href="#collections"
                className="border border-[#efe6dc]/35 px-8 py-5 text-sm font-semibold uppercase tracking-[0.14em] text-[#efe6dc] transition duration-300 hover:border-[#efe6dc] hover:bg-[#efe6dc]/10 sm:px-11"
              >
                View Trips
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="collections" className="bg-[#070604] py-24 sm:py-32">
        <div className="mx-auto max-w-[1700px] px-6 sm:px-8">
          <div className="mb-14 flex flex-col justify-between gap-5 border-b border-[#efe6dc]/10 pb-8 md:flex-row md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#b8a796]">
                  Collections
                </p>
                <ComingSoonBadge />
              </div>
            </div>
            <Link
              href="/discover"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#efe6dc] transition hover:text-white"
            >
              Find yours -&gt;
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {collections.map((trip) => (
              <article className="group" key={trip.name}>
                <div className="relative h-[470px] overflow-hidden border border-[#efe6dc]/10 bg-[#111] transition duration-500 group-hover:border-[#efe6dc]/70">
                  <Image
                    src={trip.image}
                    alt={trip.alt}
                    fill
                    className="object-cover brightness-[0.72] saturate-75 contrast-125 transition duration-700 group-hover:scale-[1.055] group-hover:brightness-[0.86]"
                    sizes="(min-width: 1024px) 31vw, 100vw"
                    quality={75}
                  />
                </div>
                <div className="mt-6 flex items-start justify-between gap-6 border-t border-[#efe6dc]/10 pt-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-3xl font-light">{trip.name}</h3>
                      <ComingSoonBadge />
                    </div>
                    <p className="mt-3 text-sm text-[#b8a796]">{trip.note}</p>
                  </div>
                  <p className="shrink-0 text-right text-xs uppercase tracking-[0.16em] text-[#d8c7b6]">
                    {trip.price}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="journal"
        className="relative min-h-[640px] overflow-hidden border-t border-[#efe6dc]/10"
      >
        <Image
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470"
          alt="A dramatic mountain lake landscape"
          fill
          className="object-cover"
          sizes="100vw"
          quality={75}
        />
        <div className="absolute inset-0 bg-black/68" />
        <div className="relative z-10 mx-auto flex min-h-[640px] max-w-[1500px] items-center px-6 py-20 sm:px-8">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#b8a796]">
                Journal
              </p>
              <ComingSoonBadge />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#efe6dc]/10 bg-[#070604] py-16">
        <div className="mx-auto flex max-w-[1700px] flex-col justify-between gap-10 px-6 sm:px-8 lg:flex-row lg:items-end">
          <Link href="/" className="text-5xl font-black tracking-tight">
            globtrek
          </Link>
          <div className="flex flex-wrap gap-7 text-xs uppercase tracking-[0.18em] text-[#d8c7b6]">
            {navItems.map(([label, href]) =>
              href.startsWith("/") ? (
                <Link className="transition hover:text-white" href={href} key={label}>
                  {label}
                </Link>
              ) : (
                <a className="transition hover:text-white" href={href} key={label}>
                  {label}
                </a>
              ),
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}

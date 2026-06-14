"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const navItems = [
  ["Discover", "/#discover"],
  ["Quiz", "/discover"],
  ["Collections", "/#collections"],
  ["Journal", "/#journal"],
];

const destinations = [
  {
    name: "KYOTO, JAPAN",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186",
    price: "Estimated $4,850-$6,400 per person",
    costs: ["Flights: $1,100-$1,600", "Stay: $2,400-$3,300", "Food: $650-$900", "Experiences: $700-$900"],
    nights: "6 nights",
    style: "Culture / Food / Slow mornings",
    season: "Spring or fall",
    tags: ["Culture", "Slow mornings", "Balanced days", "Solo", "Couple", "Traditional inn", "Boutique hotel", "Food", "Premium", "One Week"],
    why:
      "Kyoto fits a traveler who wants ritual, beauty, food, and quiet depth. Your answers point toward a trip that should unfold slowly, with temples, markets, tea, and evenings that feel considered rather than crowded.",
    itinerary: [
      "Day 1: Arrive, settle in, evening walk",
      "Day 2: Temples, gardens, tea",
      "Day 3: Food markets and old streets",
      "Day 4: Day trip to Nara or Arashiyama",
      "Day 5: Slow morning, shopping, dinner",
      "Day 6: Final full day",
      "Day 7: Depart",
    ],
  },
  {
    name: "AMALFI COAST, ITALY",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
    price: "Estimated $5,900-$8,200 per person",
    costs: ["Flights: $900-$1,400", "Stay: $3,600-$5,200", "Food: $800-$1,100", "Experiences: $600-$900"],
    nights: "5 nights",
    style: "Ocean / Romance / Long lunches",
    season: "May, June, or September",
    tags: ["Ocean", "Mostly relaxing", "Couple", "Honeymoon", "Beach resort", "Private villa", "Food", "Premium", "Blowout", "Five Nights"],
    why:
      "Your choices lean toward water, pleasure, and a trip that feels sun-warmed without being overplanned. Amalfi gives you boat days, cliffside hotels, lingering meals, and a little drama every time the road bends.",
    itinerary: [
      "Day 1: Arrive, terrace dinner",
      "Day 2: Positano, beach club, late lunch",
      "Day 3: Private boat day",
      "Day 4: Ravello gardens and music",
      "Day 5: Slow coast drive, final dinner",
      "Day 6: Depart",
    ],
  },
  {
    name: "BANFF, CANADA",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
    price: "Estimated $3,750-$5,600 per person",
    costs: ["Flights: $450-$850", "Stay: $2,100-$3,200", "Food: $550-$800", "Experiences: $650-$750"],
    nights: "6 nights",
    style: "Mountains / Lodge / Big views",
    season: "Late summer or early fall",
    tags: ["Mountains", "Adventure days", "Family", "Friends", "Mountain lodge", "Nature", "Comfortable", "One Week", "Two Weeks"],
    why:
      "Your answers point to scale, air, and the kind of reset that happens when the landscape does most of the talking. Banff is a strong fit for alpine mornings, blue lakes, lodge evenings, and days that feel clean and expansive.",
    itinerary: [
      "Day 1: Arrive, settle into the lodge",
      "Day 2: Lake Louise and Moraine Lake",
      "Day 3: Scenic drive and lookout picnic",
      "Day 4: Spa morning, mountain dinner",
      "Day 5: Hike or helicopter view",
      "Day 6: Slow final day",
      "Day 7: Depart",
    ],
  },
  {
    name: "PROVENCE, FRANCE",
    image: "https://images.unsplash.com/photo-1499002238440-d264edd596ec",
    price: "Estimated $4,250-$6,100 per person",
    costs: ["Flights: $850-$1,300", "Stay: $2,200-$3,300", "Food: $650-$950", "Car + experiences: $550-$700"],
    nights: "7 nights",
    style: "Road Trips / Markets / Villa days",
    season: "June or September",
    tags: ["Road Trips", "Slow mornings", "Couple", "Family", "Private villa", "Food", "Shopping", "Premium", "Ten Days"],
    why:
      "You chose movement, space, and a slower rhythm. Provence gives you village roads, morning markets, pool afternoons, and enough freedom for the trip to feel discovered instead of scheduled.",
    itinerary: [
      "Day 1: Arrive, villa check-in",
      "Day 2: Market morning and countryside lunch",
      "Day 3: Luberon villages by car",
      "Day 4: Winery and slow afternoon",
      "Day 5: Antiques, galleries, dinner",
      "Day 6: Open road day",
      "Day 7: Final village lunch",
      "Day 8: Depart",
    ],
  },
  {
    name: "MEXICO CITY, MEXICO",
    image: "https://images.unsplash.com/photo-1518659526054-190340b32735",
    price: "Estimated $2,950-$4,800 per person",
    costs: ["Flights: $450-$900", "Stay: $1,300-$2,200", "Food: $500-$850", "Experiences: $450-$850"],
    nights: "5 nights",
    style: "Cities / Food / Design",
    season: "October through April",
    tags: ["Cities", "Packed schedule", "Friends", "Solo", "Design hotel", "Food", "Nightlife", "Shopping", "Smart value", "Long Weekend", "Five Nights"],
    why:
      "Your answers suggest appetite, energy, and a need for texture. Mexico City gives you galleries, design hotels, street food, late dinners, and neighborhoods that reward curiosity block by block.",
    itinerary: [
      "Day 1: Arrive, Roma Norte dinner",
      "Day 2: Museums, parks, cocktail bar",
      "Day 3: Markets and street food",
      "Day 4: Architecture and galleries",
      "Day 5: Slow brunch, shopping",
      "Day 6: Depart",
    ],
  },
  {
    name: "RIO DE JANEIRO, BRAZIL",
    image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325",
    price: "Estimated $4,600-$6,900 per person",
    costs: ["Flights: $1,000-$1,600", "Stay: $2,200-$3,500", "Food: $650-$950", "Experiences: $750-$850"],
    nights: "6 nights",
    style: "Surprise / Beach / Music",
    season: "May through September",
    tags: ["Surprise Me", "Surprise me", "Adventure days", "Friends", "Beach resort", "Nightlife", "Nature", "Mixed", "Open-Ended"],
    why:
      "Your picks leave room for instinct and surprise. Rio matches that energy with beach mornings, mountain views, music, generous meals, and a feeling that the trip is alive from the first day.",
    itinerary: [
      "Day 1: Arrive, Ipanema sunset",
      "Day 2: Beach morning, music at night",
      "Day 3: Christ the Redeemer and gardens",
      "Day 4: Boat or island day",
      "Day 5: Food, design, neighborhood wandering",
      "Day 6: Final beach day",
      "Day 7: Depart",
    ],
  },
];

function scoreDestination(destination, answers) {
  const picked = Object.values(answers || {});
  return picked.reduce(
    (score, answer) => score + (destination.tags.includes(answer) ? 3 : 0),
    0,
  );
}

function getMatches(storedQuiz) {
  const answers = storedQuiz?.answers || {};
  return [...destinations]
    .map((destination) => ({
      ...destination,
      score: scoreDestination(destination, answers) + Math.random() * 4.5,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export default function ResultsPage() {
  const [storedQuiz, setStoredQuiz] = useState(null);
  const [aiMatches, setAiMatches] = useState(null);
  const [matchSource, setMatchSource] = useState("local");
  const [revealReady, setRevealReady] = useState(false);

  useEffect(() => {
    const fade = window.setTimeout(() => setRevealReady(true), 120);
    const raw = window.localStorage.getItem("globtrekQuiz");
    const quiz = raw ? JSON.parse(raw) : { answers: {} };
    setStoredQuiz(quiz);

    fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quiz),
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.matches) && data.matches.length) {
          setAiMatches(data.matches);
          setMatchSource(data.source === "openai" ? "OpenAI" : "local");
        }
      })
      .catch(() => {
        setMatchSource("local");
      });

    return () => window.clearTimeout(fade);
  }, []);

  const localMatches = useMemo(() => getMatches(storedQuiz), [storedQuiz]);
  const matches = aiMatches || localMatches;
  const primaryTrip = matches[0];
  const otherMatches = matches.slice(1, 4);
  const answerList = Object.values(storedQuiz?.answers || {}).slice(0, 5);

  if (!primaryTrip) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#070604] text-[#efe6dc]">
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

      <section
        className={`px-5 py-16 transition duration-700 sm:px-8 sm:py-24 ${
          revealReady ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-[1800px]">
          <div className="relative min-h-[620px] overflow-hidden border border-[#efe6dc]/10">
            <Image
              src={primaryTrip.image}
              alt={primaryTrip.name}
              fill
              preload
              className="object-cover"
              sizes="100vw"
              quality={75}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-10 lg:p-14">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#d8c7b6]">
                {matchSource === "OpenAI" ? "OpenAI Reveal" : "AI Reveal"}
              </p>
              <h1 className="mt-5 text-[clamp(3rem,7.6vw,8rem)] font-light leading-[0.9] text-[#f4eadf]">
                {primaryTrip.name}
              </h1>
            </div>
          </div>

          <div className="grid gap-10 border-x border-b border-[#efe6dc]/10 bg-[#0d0b08] p-6 sm:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:p-14">
            <div>
              <div className="grid gap-4 text-sm uppercase tracking-[0.14em] text-[#b8a796] sm:grid-cols-2">
                <p>
                  Your trip:{" "}
                  <span className="text-[#efe6dc]">{primaryTrip.nights}</span>
                </p>
                <p>
                  Price:{" "}
                  <span className="text-[#efe6dc]">{primaryTrip.price}</span>
                </p>
                <p>
                  Style:{" "}
                  <span className="text-[#efe6dc]">{primaryTrip.style}</span>
                </p>
                <p>
                  Best season:{" "}
                  <span className="text-[#efe6dc]">{primaryTrip.season}</span>
                </p>
              </div>

              {answerList.length ? (
                <p className="mt-8 border-l border-[#7f634d] pl-5 text-sm uppercase tracking-[0.14em] text-[#d8c7b6]">
                  Matched from: {answerList.join(" / ")}
                  <br />
                  Engine: {matchSource}
                </p>
              ) : null}

              <div className="mt-8 grid gap-3 border-t border-[#efe6dc]/10 pt-6 text-sm text-[#b8a796] sm:grid-cols-2">
                {(primaryTrip.costs || []).map((item) => (
                  <p
                    className="border-b border-[#efe6dc]/10 pb-3 text-[#d8c7b6]"
                    key={item}
                  >
                    {item}
                  </p>
                ))}
              </div>

              <div className="mt-10 border-t border-[#efe6dc]/10 pt-8">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8f857b]">
                  Why we chose it
                </p>
                <p className="mt-5 max-w-2xl text-xl font-light leading-relaxed text-[#efe6dc]">
                  {primaryTrip.why}
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <button className="bg-[#efe6dc] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-black transition duration-300 hover:bg-white">
                  Begin Planning · Coming Soon
                </button>
                <Link
                  className="border border-[#efe6dc]/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#efe6dc] transition duration-300 hover:border-[#efe6dc] hover:bg-[#efe6dc]/10"
                  href="/discover"
                >
                  Retake Quiz
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#8f857b]">
                Suggested itinerary
              </p>
              <div className="mt-5 border-t border-[#efe6dc]/10">
                {primaryTrip.itinerary.map((item) => (
                  <p
                    className="border-b border-[#efe6dc]/10 py-4 text-lg font-light text-[#efe6dc]"
                    key={item}
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16">
            <div className="mb-8 flex items-end justify-between gap-5 border-b border-[#efe6dc]/10 pb-6">
              <h2 className="text-[clamp(2rem,4vw,3.4rem)] font-light">
                Other matches
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {otherMatches.map((match) => (
                <article className="group" key={match.name}>
                  <div className="relative h-[360px] overflow-hidden border border-[#efe6dc]/10 bg-[#111] transition duration-500 group-hover:border-[#efe6dc]/70">
                    <Image
                      src={match.image}
                      alt={match.name}
                      fill
                      className="object-cover brightness-[0.72] saturate-75 contrast-125 transition duration-700 group-hover:scale-[1.055] group-hover:brightness-[0.86]"
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      quality={75}
                    />
                  </div>
                  <div className="mt-5 border-t border-[#efe6dc]/10 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-3xl font-light">{match.name}</h3>
                      <p className="shrink-0 text-right text-xs uppercase tracking-[0.14em] text-[#d8c7b6]">
                        {match.price}
                      </p>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-[#b8a796]">
                      {match.why}
                    </p>
                    <button className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#efe6dc] transition hover:text-white">
                      Discover -&gt;
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

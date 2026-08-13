import http from "node:http";
import { readFile } from "node:fs/promises";

const host = "127.0.0.1";
const port = Number(process.env.PORT || 3001);

const photos = {
  road: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  mountain: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  lake: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  italy: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  villa: "https://images.unsplash.com/photo-1494526585095-c41746248156",
  city: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
  boat: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
  rio: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325",
  kyoto: "https://images.unsplash.com/photo-1528360983277-13d401cdc186",
  amalfi: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
  banff: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  provence: "https://images.unsplash.com/photo-1499002238440-d264edd596ec",
};

const destinations = [
  { name: "Kyoto, Japan", image: "/kyoto-feature.jpg", price: "Est. $4,850-$6,400" },
  { name: "Amalfi Coast", image: "/amalfi-feature.jpg", price: "Est. $5,900-$8,200" },
  { name: "Banff", image: "/banff-feature.jpg", price: "Est. $3,750-$5,600" },
];

const aiDestinations = [
  {
    name: "KYOTO, JAPAN",
    image: photos.kyoto,
    price: "Est. $4,850–$6,400 per person",
    costs: ["Flights: $1,100-$1,600", "Stay: $2,400-$3,300", "Food: $650-$900", "Experiences: $700-$900"],
    nights: "6 nights",
    style: "Culture / Food / Slow mornings",
    season: "Spring or fall",
    tags: ["Culture", "Slow mornings", "Balanced days", "Solo", "Couple", "Traditional inn", "Boutique hotel", "Food", "Premium", "One Week"],
    why: "Kyoto fits a traveler who wants ritual, beauty, food, and quiet depth. Your answers point toward a trip that should unfold slowly, with temples, markets, tea, and evenings that feel considered rather than crowded.",
    itinerary: ["Day 1: Arrive, settle in, evening walk", "Day 2: Temples, gardens, tea", "Day 3: Food markets and old streets", "Day 4: Day trip to Nara or Arashiyama", "Day 5: Slow morning, shopping, dinner", "Day 6: Final full day", "Day 7: Depart"],
  },
  {
    name: "AMALFI COAST, ITALY",
    image: photos.amalfi,
    price: "Est. $5,900–$8,200 per person",
    costs: ["Flights: $900-$1,400", "Stay: $3,600-$5,200", "Food: $800-$1,100", "Experiences: $600-$900"],
    nights: "5 nights",
    style: "Ocean / Romance / Long lunches",
    season: "May, June, or September",
    tags: ["Ocean", "Mostly relaxing", "Couple", "Honeymoon", "Beach resort", "Private villa", "Food", "Premium", "Blowout", "Five Nights"],
    why: "Your choices lean toward water, pleasure, and a trip that feels sun-warmed without being overplanned. Amalfi gives you boat days, cliffside hotels, lingering meals, and a little drama every time the road bends.",
    itinerary: ["Day 1: Arrive, terrace dinner", "Day 2: Positano, beach club, late lunch", "Day 3: Private boat day", "Day 4: Ravello gardens and music", "Day 5: Slow coast drive, final dinner", "Day 6: Depart"],
  },
  {
    name: "BANFF, CANADA",
    image: photos.banff,
    price: "Est. $3,750–$5,600 per person",
    costs: ["Flights: $450-$850", "Stay: $2,100-$3,200", "Food: $550-$800", "Experiences: $650-$750"],
    nights: "6 nights",
    style: "Mountains / Lodge / Big views",
    season: "Late summer or early fall",
    tags: ["Mountains", "Adventure days", "Family", "Friends", "Mountain lodge", "Nature", "Comfortable", "One Week", "Two Weeks"],
    why: "Your answers point to scale, air, and the kind of reset that happens when the landscape does most of the talking. Banff is a strong fit for alpine mornings, blue lakes, lodge evenings, and days that feel clean and expansive.",
    itinerary: ["Day 1: Arrive, settle into the lodge", "Day 2: Lake Louise and Moraine Lake", "Day 3: Scenic drive and lookout picnic", "Day 4: Spa morning, mountain dinner", "Day 5: Hike or helicopter view", "Day 6: Slow final day", "Day 7: Depart"],
  },
  {
    name: "PROVENCE, FRANCE",
    image: photos.provence,
    price: "Est. $4,250–$6,100 per person",
    costs: ["Flights: $850-$1,300", "Stay: $2,200-$3,300", "Food: $650-$950", "Car + experiences: $550-$700"],
    nights: "7 nights",
    style: "Road Trips / Markets / Villa days",
    season: "June or September",
    tags: ["Road Trips", "Slow mornings", "Couple", "Family", "Private villa", "Food", "Shopping", "Premium", "Ten Days"],
    why: "You chose movement, space, and a slower rhythm. Provence gives you village roads, morning markets, pool afternoons, and enough freedom for the trip to feel discovered instead of scheduled.",
    itinerary: ["Day 1: Arrive, villa check-in", "Day 2: Market morning and countryside lunch", "Day 3: Luberon villages by car", "Day 4: Winery and slow afternoon", "Day 5: Antiques, galleries, dinner", "Day 6: Open road day", "Day 7: Final village lunch", "Day 8: Depart"],
  },
  {
    name: "MEXICO CITY, MEXICO",
    image: photos.city,
    price: "Est. $2,950–$4,800 per person",
    costs: ["Flights: $450-$900", "Stay: $1,300-$2,200", "Food: $500-$850", "Experiences: $450-$850"],
    nights: "5 nights",
    style: "Cities / Food / Design",
    season: "October through April",
    tags: ["Cities", "Packed schedule", "Friends", "Solo", "Design hotel", "Food", "Nightlife", "Shopping", "Smart value", "Long Weekend", "Five Nights"],
    why: "Your answers suggest appetite, energy, and a need for texture. Mexico City gives you galleries, design hotels, street food, late dinners, and neighborhoods that reward curiosity block by block.",
    itinerary: ["Day 1: Arrive, Roma Norte dinner", "Day 2: Museums, parks, cocktail bar", "Day 3: Markets and street food", "Day 4: Architecture and galleries", "Day 5: Slow brunch, shopping", "Day 6: Depart"],
  },
  {
    name: "RIO DE JANEIRO, BRAZIL",
    image: photos.rio,
    price: "Est. $4,600–$6,900 per person",
    costs: ["Flights: $1,000-$1,600", "Stay: $2,200-$3,500", "Food: $650-$950", "Experiences: $750-$850"],
    nights: "6 nights",
    style: "Surprise / Beach / Music",
    season: "May through September",
    tags: ["Surprise Me", "Surprise me", "Adventure days", "Friends", "Beach resort", "Nightlife", "Nature", "Mixed", "Open-Ended"],
    why: "Your picks leave room for instinct and surprise. Rio matches that energy with beach mornings, mountain views, music, generous meals, and a feeling that the trip is alive from the first day.",
    itinerary: ["Day 1: Arrive, Ipanema sunset", "Day 2: Beach morning, music at night", "Day 3: Christ the Redeemer and gardens", "Day 4: Boat or island day", "Day 5: Food, design, neighborhood wandering", "Day 6: Final beach day", "Day 7: Depart"],
  },
];

const questions = [
  [
    "Question 01",
    "Where do you feel most alive?",
    [
      ["Ocean", "/luxury-coast.jpg"],
      ["Mountains", photos.mountain],
      ["Cities", photos.city],
      ["Road Trips", photos.road],
      ["Culture", photos.kyoto],
      ["Surprise Me", photos.rio],
    ],
  ],
  [
    "Question 02",
    "What pace sounds right?",
    [
      ["Slow mornings", photos.lake],
      ["Balanced days", photos.italy],
      ["Packed schedule", photos.mountain],
      ["Mostly relaxing", photos.villa],
      ["Adventure days", photos.kyoto],
      ["Surprise me", photos.city],
    ],
  ],
  [
    "Question 03",
    "Who is coming with you?",
    [
      ["Solo", photos.road],
      ["Couple", photos.italy],
      ["Friends", photos.kyoto],
      ["Family", photos.lake],
      ["Honeymoon", photos.city],
      ["Not sure", photos.boat],
    ],
  ],
  [
    "Question 04",
    "Where would you rather stay?",
    [
      ["Boutique hotel", photos.villa],
      ["Beach resort", photos.city],
      ["Mountain lodge", photos.beach],
      ["Private villa", photos.kyoto],
      ["Design hotel", photos.mountain],
      ["Traditional inn", photos.italy],
    ],
  ],
  [
    "Question 05",
    "What matters most when you travel?",
    [
      ["Food", photos.lake],
      ["Nature", photos.italy],
      ["Culture", photos.city],
      ["Nightlife", photos.banff],
      ["Wellness", photos.villa],
      ["Shopping", photos.road],
    ],
  ],
  [
    "Question 06",
    "What budget feels right?",
    [
      ["Smart value", photos.italy],
      ["Comfortable", photos.mountain],
      ["Premium", photos.kyoto],
      ["Blowout", photos.beach],
      ["Mixed", photos.city],
      ["Not sure", photos.road],
    ],
  ],
  [
    "Question 07",
    "How much time can this trip hold?",
    [
      ["Long Weekend", photos.city],
      ["Five Nights", photos.beach],
      ["One Week", photos.kyoto],
      ["Ten Days", photos.italy],
      ["Two Weeks", photos.mountain],
      ["Open-Ended", photos.boat],
    ],
  ],
];

const img = (src, width = 2400) => `${src}?q=82&w=${width}&auto=format&fit=crop`;

function scoreDestination(destination, answers) {
  return Object.values(answers || {}).reduce((score, answer) => {
    return score + (destination.tags.includes(answer) ? 3 : 0);
  }, 0);
}

function fallbackMatches(answers) {
  return [...aiDestinations]
    .map((destination) => ({
      ...destination,
      score: scoreDestination(destination, answers) + Math.random() * 4.5,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function extractOutputText(data) {
  if (data.output_text) {
    return data.output_text;
  }

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("");
}

function normalizeAiResult(aiResult, fallback) {
  const orderedNames = Array.isArray(aiResult?.rankedNames)
    ? aiResult.rankedNames
    : [];
  const ordered = orderedNames
    .map((name) => fallback.find((destination) => destination.name === name))
    .filter(Boolean);
  const remaining = fallback.filter(
    (destination) => !ordered.some((match) => match.name === destination.name),
  );
  const matches = [...ordered, ...remaining];

  return [
    {
      ...matches[0],
      why: aiResult?.why || matches[0].why,
      itinerary: Array.isArray(aiResult?.itinerary)
        ? aiResult.itinerary
        : matches[0].itinerary,
    },
    ...matches.slice(1),
  ];
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function matchResponse(request, response) {
  let body;
  try {
    body = await readJson(request);
  } catch {
    response.writeHead(400, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  const answers = body.answers || {};
  const fallback = fallbackMatches(answers);
  let payload = { source: "fallback", matches: fallback };

  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
          input: [
            {
              role: "system",
              content:
                "You are GlobTrek's travel matching assistant. Rank only the provided destinations using the traveler's stated preferences. Explain the recommendation using only the supplied preferences and destination attributes. Do not invent prices, ratings, availability, bookings, or provider relationships. Return strict JSON with rankedNames, why, and itinerary. No markdown.",
            },
            {
              role: "user",
              content: JSON.stringify({
                answers,
                variationSeed: Math.random().toString(36).slice(2),
                destinations: aiDestinations.map(
                  ({ name, style, season, tags, price, nights }) => ({
                    name,
                    style,
                    season,
                    tags,
                    price,
                    nights,
                  }),
                ),
              }),
            },
          ],
        }),
      });

      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        const aiResult = JSON.parse(extractOutputText(data));
        payload = {
          source: "openai",
          matches: normalizeAiResult(aiResult, fallback),
        };
      }
    } catch {
      payload = { source: "fallback", matches: fallback };
    }
  }

  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function shell(title, body, extraScript = "") {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    html { scroll-behavior: smooth; }
    body { margin: 0; overflow-x: hidden; background: #080807; color: #efe6dc; font-family: "Avenir Next", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased; }
    a { color: inherit; text-decoration: none; }
    button, input { font: inherit; }
    .bar { background: #7f634d; color: #fff7ef; text-align: center; padding: 12px 20px; font-size: 10px; letter-spacing: .26em; text-transform: uppercase; border-bottom: 1px solid rgba(239,230,220,.1); }
    .nav { border-bottom: 1px solid rgba(239,230,220,.08); background: rgba(8,8,7,.88); }
    .nav-inner { max-width: 2200px; margin: 0 auto; padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .brand { display: inline-flex; align-items: center; gap: 12px; font-size: clamp(32px, 4vw, 44px); line-height: .95; font-weight: 900; letter-spacing: -.035em; }
    .brand-mark { display: block; width: 70px; height: 40px; flex: 0 0 70px; object-fit: contain; transition: transform .5s ease; }
    .brand:hover .brand-mark { transform: translateX(2px); }
    .thinking-mark { display: block; width: 70px; height: 40px; object-fit: contain; margin: 0 auto 28px; }
    .nav-links { display: flex; gap: 54px; color: #d8c7b6; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; }
    .cream-btn { display: inline-flex; align-items: center; justify-content: center; background: #efe6dc; color: #050505; padding: 16px 30px; font-weight: 700; border: 0; cursor: pointer; transition: .28s ease; text-transform: uppercase; letter-spacing: .14em; font-size: 13px; }
    .cream-btn:hover { background: #fff; transform: translateY(-1px); }
    .ghost { display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.28); color: #efe6dc; padding: 16px 30px; background: rgba(0,0,0,.12); backdrop-filter: blur(10px); cursor: pointer; }
    .hero { min-height: 780px; height: 96vh; position: relative; overflow: hidden; }
    .hero img, .world img, .result-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .shade { position: absolute; inset: 0; background: linear-gradient(to top, #050505, rgba(0,0,0,.28), rgba(0,0,0,.42)); }
    .hero-content { position: absolute; inset: auto 0 0 0; padding: clamp(36px, 6vw, 84px); }
    .eyebrow { color: #d8c7b6; font-size: 10px; letter-spacing: .34em; text-transform: uppercase; }
    .hero-brand { margin: 0; color: #f4eadf; font-size: clamp(44px, 6vw, 96px); line-height: .9; font-weight: 300; letter-spacing: .04em; text-transform: uppercase; max-width: 1000px; }
    .micro { color: #8f857b; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; }
    .badge { display: inline-flex; border: 1px solid rgba(239,230,220,.2); padding: 8px 11px; color: #b8a796; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 26px 0 0; max-width: 100%; overflow-wrap: anywhere; font-size: clamp(44px, 7vw, 88px); line-height: .92; font-weight: 300; letter-spacing: 0; }
    h2 { margin: 18px 0 0; font-size: clamp(34px, 5.2vw, 68px); line-height: .98; font-weight: 300; letter-spacing: 0; }
    h3 { margin: 0; font-size: 28px; line-height: 1.05; font-weight: 300; }
    .hero-actions { margin-top: 48px; display: flex; flex-wrap: wrap; gap: 16px; }
    .section { padding: clamp(86px, 10vw, 132px) 32px; background: #050505; }
    .section-inner { max-width: 1800px; margin: 0 auto; }
    .section-kicker { margin-bottom: 58px; }
    .section-title { color: #b8a796; font-size: clamp(15px, 2vw, 19px); font-weight: 300; letter-spacing: .24em; text-transform: uppercase; }
    .dest-grid, .match-grid { max-width: 1500px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(42px, 6vw, 112px); }
    .destination, .match-card { min-width: 0; }
    .photo-box { height: 430px; overflow: hidden; background: #111; border: 1px solid rgba(255,255,255,.08); }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.72) contrast(1.18) saturate(.78); transition: transform .7s ease; }
    .destination:hover .photo-box, .match-card:hover .photo-box { border-color: rgba(239,230,220,.7); }
    .destination:hover img, .match-card:hover img { transform: scale(1.055); filter: brightness(.84) contrast(1.18) saturate(.82); }
    .dest-meta { margin-top: 24px; display: flex; justify-content: space-between; gap: 28px; align-items: start; border-top: 1px solid rgba(255,255,255,.1); padding-top: 20px; }
    .price { max-width: 48%; overflow-wrap: anywhere; color: #d8c7b6; font-size: 12px; line-height: 1.6; letter-spacing: .14em; text-transform: uppercase; text-align: right; }
    .note { color: #b8a796; margin-top: 10px; font-size: 14px; }
    .match-card p { margin: 12px 0 0; color: #8f857b; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
    .discover-link { color: #efe6dc; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; white-space: nowrap; }
    .world { min-height: 760px; height: 92vh; position: relative; overflow: hidden; display: grid; place-items: center; text-align: center; }
    .world .shade { background: rgba(0,0,0,.72); }
    .world-content { position: relative; padding: 32px; z-index: 1; }
    footer { border-top: 1px solid rgba(239,230,220,.08); padding: 80px 32px; background: #080807; }
    .footer-inner { max-width: 1800px; margin: 0 auto; display: flex; justify-content: space-between; gap: 48px; }
    .footer-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 48px; color: #d8c7b6; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; }
    .footer-grid p { margin: 0 0 16px; }
    .quiz-wrap { padding: clamp(32px, 5vw, 56px) 20px clamp(56px, 8vw, 96px); background: radial-gradient(circle at top left, rgba(139,109,87,.18), transparent 28%), linear-gradient(180deg,#000 0%,#090806 48%,#000 100%); }
    .quiz { max-width: 1800px; margin: 0 auto; }
    .quiz-head { display: flex; justify-content: flex-end; gap: 40px; align-items: end; border-bottom: 1px solid rgba(255,255,255,.1); padding-bottom: 28px; margin-bottom: 40px; }
    .quiz-title { margin: 10px 0 0; font-size: clamp(30px, 4vw, 54px); line-height: 1.02; font-weight: 300; max-width: 760px; }
    .progress { width: min(100%, 420px); color: #8f857b; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; }
    .progress-row { display: flex; justify-content: space-between; }
    .track { height: 1px; background: rgba(255,255,255,.12); margin-top: 14px; }
    .fill { height: 1px; width: 0%; background: #efe6dc; transition: width .35s ease; }
    .question-title { margin: 0 0 32px; font-size: clamp(32px, 4.2vw, 58px); line-height: 1.05; font-weight: 300; }
    .choice-grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
    .choice { grid-column: span 2; height: 210px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,.12); background: #111; color: #efe6dc; text-align: center; cursor: pointer; padding: 0; transition: .25s ease; }
    .choice:nth-child(1), .choice:nth-child(2) { grid-column: span 3; }
    .choice:hover, .choice.selected { transform: translateY(-4px); border-color: #efe6dc; outline: 1px solid rgba(239,230,220,.65); }
    .choice.selected:before { content: "✓"; position: absolute; z-index: 2; right: 16px; top: 16px; width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid #efe6dc; background: rgba(0,0,0,.48); color: #efe6dc; }
    .choice img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.54) saturate(.82) contrast(1.2); transition: .55s ease; }
    .choice:hover img { transform: scale(1.05); filter: brightness(.7) saturate(.9) contrast(1.2); }
    .choice:after { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,.34); }
    .choice-copy { position: absolute; z-index: 1; inset: 0; display: grid; place-items: center; padding: 18px; }
    .choice h4 { margin: 0; font-size: clamp(19px, 2vw, 25px); line-height: 1.05; font-weight: 300; }
    .quiz-nav { margin-top: 34px; display: flex; justify-content: space-between; gap: 20px; }
    .date-step { display: grid; grid-template-columns: .86fr 1.14fr; gap: 60px; align-items: start; }
    .date-card, .result-panel { border: 1px solid rgba(255,255,255,.1); background: #0f0d0b; padding: 32px; }
    .date-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    label span { display: block; color: #8f857b; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; }
    input { margin-top: 12px; width: 100%; border: 1px solid rgba(255,255,255,.12); background: #000; color: #efe6dc; padding: 16px; color-scheme: dark; }
    .answers { margin-top: 28px; display: grid; gap: 0; color: #b8a796; }
    .answers div, .detail-row { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid rgba(255,255,255,.1); padding: 15px 0; }
    .answers strong, .detail-row strong { color: #efe6dc; font-weight: 400; text-align: right; max-width: 58%; }
    .flex-row { margin-top: 22px; border-top: 1px solid rgba(255,255,255,.1); border-bottom: 1px solid rgba(255,255,255,.1); padding: 18px 0; color: #d8c7b6; }
    .flex-row input { width: auto; margin: 0 10px 0 0; accent-color: #efe6dc; }
    .results { display: none; margin-top: 88px; border-top: 1px solid rgba(239,230,220,.1); padding-top: 56px; }
    .result-hero { position: relative; min-height: 620px; overflow: hidden; border: 1px solid rgba(255,255,255,.1); }
    .result-hero .shade { background: linear-gradient(to top, rgba(0,0,0,.92), rgba(0,0,0,.48), rgba(0,0,0,.12)); }
    .result-copy { position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; padding: clamp(32px, 6vw, 72px); }
    .result-name { margin-top: 20px; font-size: clamp(48px, 8vw, 128px); line-height: .9; font-weight: 300; }
    .result-panel { border-top: 0; display: grid; grid-template-columns: .95fr 1.05fr; gap: 44px; }
    .trip-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 24px; color: #b8a796; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; }
    .trip-facts strong { color: #efe6dc; font-weight: 400; }
    .why { margin-top: 34px; border-top: 1px solid rgba(239,230,220,.1); padding-top: 28px; max-width: 680px; color: #efe6dc; font-size: 20px; line-height: 1.65; font-weight: 300; }
    .itinerary p { border-bottom: 1px solid rgba(239,230,220,.1); margin: 0; padding: 14px 0; font-size: 18px; font-weight: 300; }
    .thinking { min-height: 100vh; display: grid; place-items: center; padding: 32px; background: radial-gradient(circle at top, rgba(127,99,77,.2), transparent 35%), #070604; text-align: center; }
    .thinking-panel { width: min(760px, 100%); border-top: 1px solid rgba(239,230,220,.12); border-bottom: 1px solid rgba(239,230,220,.12); padding: 64px 0; }
    .thinking-bar { height: 1px; max-width: 420px; margin: 38px auto 0; background: rgba(239,230,220,.12); }
    .thinking-fill { height: 1px; width: 25%; background: #efe6dc; transition: width .55s ease; }
    .how-section, .editorial-page { background: #090806; padding: clamp(82px, 10vw, 132px) 32px; }
    .how-inner, .editorial-inner { max-width: 1500px; margin: 0 auto; }
    .how-row, .editorial-row { display: grid; grid-template-columns: 90px minmax(220px,.8fr) 1.2fr; gap: 30px; padding: 30px 0; border-bottom: 1px solid rgba(239,230,220,.1); align-items: baseline; }
    .editorial-head { max-width: 1050px; padding-bottom: 58px; border-bottom: 1px solid rgba(239,230,220,.1); }
    .editorial-head h1 { max-width: 1000px; }
    .editorial-intro { max-width: 760px; color: #c8b8a8; font-size: 20px; line-height: 1.7; font-weight: 300; }
    .editorial-sections { padding-top: 46px; }
    .editorial-row { grid-template-columns: 160px 1fr; padding: 40px 0; }
    .editorial-row h2 { margin: 0; font-size: clamp(28px, 3vw, 42px); font-weight: 300; }
    .editorial-copy { max-width: 780px; color: #b8a796; font-size: 18px; line-height: 1.75; font-weight: 300; }
    .footer-meta { margin-top: 48px; padding-top: 22px; border-top: 1px solid rgba(239,230,220,.1); display: flex; justify-content: space-between; gap: 24px; color: #746b63; font-size: 12px; line-height: 1.6; }
    @media (max-width: 900px) {
      .nav-links { display: none; }
      .dest-grid, .match-grid, .date-step, .result-panel { grid-template-columns: 1fr; }
      .footer-inner, .quiz-head { flex-direction: column; align-items: stretch; }
      .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .choice, .choice:nth-child(1), .choice:nth-child(2) { grid-column: span 6; }
      .hero, .world { min-height: 680px; }
      .how-row, .editorial-row { grid-template-columns: 1fr; gap: 12px; }
    }
    @media (max-width: 560px) {
      .nav-inner { padding: 24px 20px; }
      .nav-inner > .ghost { display: none; }
      .cream-btn { width: 100%; }
      .date-grid { grid-template-columns: 1fr; }
      .bar { letter-spacing: .16em; }
      .answers div, .detail-row { display: grid; }
      .answers strong, .detail-row strong { text-align: left; max-width: none; }
      .dest-meta { flex-direction: column; }
      .price { max-width: none; text-align: left; }
    }
    /* App Router visual-system mirror for the lightweight local fallback. */
    body { background:#f7f7f4; color:#171717; }
    .bar { display:none; }
    .nav { background:#f7f7f4; border-color:rgba(0,0,0,.1); }
    .nav-inner { padding:20px 32px; min-height:80px; }
    .brand { font-size:30px; font-weight:700; letter-spacing:-.06em; }
    .brand-mark,.thinking-mark { filter:invert(1); mix-blend-mode:multiply; }
    .nav-links { color:#565656; font-size:12px; letter-spacing:0; text-transform:none; gap:36px; }
    .cream-btn { background:#171717; color:white; letter-spacing:.08em; padding:15px 24px; }
    .ghost { border-color:rgba(0,0,0,.2); color:#171717; background:transparent; backdrop-filter:none; }
    .hero { margin:16px 24px 0; min-height:72vh; height:78vh; }
    .hero img { filter:none; }
    .hero .shade { display:none; }
    .hero-content { padding:0 24px 56px; display:flex; flex-direction:column; align-items:center; text-align:center; }
    .hero-brand { margin:0; color:white; font-size:clamp(36px,5vw,84px); font-weight:200; letter-spacing:-.045em; text-transform:uppercase; text-shadow:0 1px 18px rgba(0,0,0,.28); }
    .hero-actions { margin-top:24px; padding:0; width:auto; background:transparent; }
    .section,.how-section,.editorial-page { background:#f7f7f4; }
    .section { border-top:1px solid rgba(0,0,0,.1); }
    .section-title,.micro,.eyebrow { color:#707070; letter-spacing:.1em; font-weight:600; }
    .section-kicker { text-align:center; margin-bottom:48px; }
    .photo-box { position:relative; height:auto; aspect-ratio:4/5; background:#deded8; border:0; }
    .photo-box img { filter:none; transform:none; }
    .destination:hover img,.match-card:hover img { filter:none; transform:scale(1.018); }
    .dest-grid,.match-grid { gap:32px; max-width:1460px; }
    .dest-meta { display:block; border-top:0; border-bottom:1px solid rgba(0,0,0,.1); margin-top:16px; padding:0 0 16px; text-align:center; }
    .destination-name { padding:0 0 8px; text-align:center; color:#171717; }
    .destination-name h3 { font-size:24px; font-weight:500; letter-spacing:-.03em; }
    .dest-meta .price { max-width:none; text-align:center; }
    h1,h2,h3,.quiz-title,.question-title,.result-name,.editorial-row h2 { font-weight:600; letter-spacing:-.05em; }
    .price,.note,.match-card p,.discover-link,.micro { color:#666; letter-spacing:0; text-transform:none; }
    .how-section { background:#efefeb; border-top:1px solid rgba(0,0,0,.1); }
    .how-row,.editorial-row,.editorial-head { border-color:rgba(0,0,0,.1); }
    .world { display:none; }
    footer { background:#f1f1ed; color:#171717; border-color:rgba(0,0,0,.1); }
    .footer-grid,.footer-meta { color:#666; letter-spacing:0; text-transform:none; }
    .footer-meta { border-color:rgba(0,0,0,.1); }
    .quiz-wrap { background:#f7f7f4; }
    .quiz-head,.track,.answers div,.detail-row,.flex-row,.results { border-color:rgba(0,0,0,.1); }
    .progress,label span { color:#707070; letter-spacing:0; text-transform:none; }
    .fill { background:#171717; }
    .choice { color:white; border-color:rgba(0,0,0,.1); background:#ddd; }
    .choice img,.choice:hover img { filter:none; }
    .choice:after { inset:auto 0 0; height:30%; background:rgba(0,0,0,.48); }
    .choice-copy { place-items:end start; text-align:left; }
    .choice:hover,.choice.selected { transform:none; border-color:#171717; outline:1px solid #171717; }
    .date-card,.result-panel { background:#efefeb; border-color:rgba(0,0,0,.1); }
    input { background:white; color:#171717; border-color:rgba(0,0,0,.15); color-scheme:light; }
    .answers,.answers strong,.detail-row strong,.trip-facts,.trip-facts strong,.why,.itinerary p { color:#444; }
    .result-hero { border:0; }
    .result-hero .shade { display:none; }
    .result-copy { left:32px; right:auto; bottom:32px; background:#f7f7f4; padding:28px; color:#171717; }
    .thinking { background:#f7f7f4; }
    .thinking-panel,.thinking-bar { border-color:rgba(0,0,0,.1); }
    .thinking-fill { background:#171717; }
    .editorial-intro,.editorial-copy { color:#5f5f5f; }
    .quiz-head { justify-content:space-between; }
    .quiz-head:before { content:"Your preferences"; color:#707070; font-size:11px; }
    .question-title { max-width:1100px; margin:0 auto 44px; text-align:center; font-size:clamp(44px,6vw,92px); line-height:.92; letter-spacing:-.065em; }
    #eyebrow { display:none; }
    #questionGuidance { margin:0 auto 32px; text-align:center; }
    .quiz-wrap { min-height:100vh; padding:0 32px 32px; }
    .quiz { max-width:none; }
    .quiz-head { min-height:86px; margin:0; padding:0; border-bottom:1px solid rgba(0,0,0,.1); align-items:center; }
    .quiz-head:before { content:"GLOBTREK"; color:#171717; font-size:20px; font-weight:600; letter-spacing:-.04em; }
    .progress { width:auto; }
    .track,.progressText { display:none; }
    #questionStep { padding-top:36px; }
    .question-layout { display:grid; grid-template-columns:30% 70%; align-items:center; min-height:calc(100vh - 230px); }
    .question-copy { position:relative; z-index:2; padding-right:48px; }
    .question-copy .question-title { text-align:left; font-size:clamp(48px,5.2vw,84px); }
    .quiz-hero { position:relative; height:min(68vh,720px); background:#e6e4df; overflow:hidden; }
    .quiz-hero img { width:100%; height:100%; object-fit:cover; transition:opacity .45s ease,transform .45s ease; }
    .choice-grid { position:relative; z-index:3; max-width:1500px; margin:-42px auto 0; display:flex; overflow-x:auto; gap:0; background:#fbfaf7; border-top:1px solid rgba(0,0,0,.1); border-bottom:1px solid rgba(0,0,0,.1); }
    .choice,.choice:nth-child(1),.choice:nth-child(2) { position:relative; flex:1 0 auto; grid-column:auto; min-width:150px; height:88px; border:0; background:transparent; color:#777; }
    .choice img,.choice:after { display:none; }
    .choice-copy { position:static; display:grid; place-items:center; padding:16px; }
    .choice h4 { font-size:11px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; }
    .choice:hover,.choice.selected { outline:0; border:0; color:#171717; }
    .choice.selected:before { content:""; inset:0 24px auto; width:auto; height:1px; background:#171717; border:0; }
    .quiz-nav { max-width:1500px; margin:18px auto 0; }
    .quiz-nav #nextBtn { display:none; }
    .quiz-nav button:disabled { visibility:hidden; }
    .text-mode .question-layout { display:block; max-width:1100px; min-height:auto; margin:0 auto; padding:14vh 0 40px; }
    .text-mode .quiz-hero { display:none; }
    .text-mode .choice-grid { display:block; margin:0 auto; border-top:1px solid rgba(0,0,0,.15); background:transparent; }
    .text-mode .choice { width:100%; height:76px; border-bottom:1px solid rgba(0,0,0,.15); text-align:left; }
    .text-mode .choice-copy { place-items:center start; }
    .text-mode .choice h4 { font-size:25px; letter-spacing:-.02em; text-transform:none; }
    .text-mode .choice.selected:before { display:none; }
    .date-step { min-height:100vh; grid-template-columns:1fr 1fr; gap:0; align-items:stretch; margin-top:-86px; }
    .date-left { min-height:100vh; padding:32px 44px 42px; display:flex; flex-direction:column; background:#f5f3ef; }
    .date-top { display:flex; align-items:center; justify-content:space-between; }
    .date-wordmark { font-size:20px; font-weight:600; letter-spacing:.22em; }
    .date-dashes { display:flex; gap:15px; }
    .date-dashes i { display:block; width:34px; height:2px; background:#d2d0cb; }
    .date-dashes i:last-child { background:#171717; }
    .date-copy { flex:1; display:flex; flex-direction:column; justify-content:center; max-width:590px; padding:56px 0 20px; }
    .date-copy h2 { max-width:520px; margin:22px 0 0; font-size:clamp(56px,5.2vw,86px); line-height:.9; font-weight:500; letter-spacing:-.07em; }
    .date-copy .date-subtitle { margin:18px 0 0; color:#968e86; font-size:18px; font-weight:300; }
    .date-summary { margin:30px 0 0; max-width:560px; border-left:1px solid #aaa097; padding:4px 0 4px 22px; color:#82776d; letter-spacing:.16em; text-transform:uppercase; font-size:10px; line-height:2; }
    .date-card { border:0; padding:0; margin-top:36px; background:transparent; }
    .date-image { position:relative; min-height:100vh; background:url('/results-feature.jpg') center/cover no-repeat; }
    .mode-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:30px; }
    .mode-grid button { min-height:62px; border:1px solid rgba(0,0,0,.2); background:transparent; color:#555; text-transform:uppercase; font-size:11px; letter-spacing:.1em; }
    .mode-grid button.active { background:#171717; color:white; border-color:#171717; }
    .season-options { display:grid; grid-template-columns:1fr 1fr; border-left:1px solid rgba(0,0,0,.15); border-top:1px solid rgba(0,0,0,.15); }
    .season-options button { min-height:76px; border:0; border-right:1px solid rgba(0,0,0,.15); border-bottom:1px solid rgba(0,0,0,.15); background:transparent; text-align:left; padding:14px; color:#555; }
    .season-options span { display:block; margin-top:6px; color:#999; font-size:10px; text-transform:uppercase; }
    .luxury-strip { background:#efefeb; border-top:1px solid rgba(0,0,0,.1); padding:128px 32px; }
    .luxury-grid { max-width:1460px; margin:0 auto; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:36px; }
    .luxury-image { position:relative; overflow:hidden; aspect-ratio:4/5; background:#dddcd7; }
    .luxury-image img { width:100%; height:100%; object-fit:cover; transition:transform .6s ease; }
    .luxury-image:hover img { transform:scale(1.018); }
    .signup { border-top:1px solid rgba(0,0,0,.1); padding:48px 32px; }
    .signup-form { max-width:580px; margin-left:auto; display:flex; border-bottom:1px solid #171717; }
    .signup-form input { min-width:0; flex:1; margin:0; padding:16px 2px; border:0; background:transparent; color:#171717; }
    .signup-form button { border:0; background:transparent; padding:16px 20px; font-weight:700; text-transform:uppercase; cursor:pointer; }
    .demo { max-width:1500px; margin:0 auto; padding:80px 32px 130px; }
    .demo-head { display:flex; justify-content:space-between; gap:24px; align-items:end; border-bottom:1px solid rgba(0,0,0,.1); padding-bottom:24px; }
    .demo-head h1 { overflow-wrap:anywhere; }
    .demo-badge { border:1px solid rgba(0,0,0,.15); padding:9px 12px; font-size:10px; text-transform:uppercase; }
    .demo-gallery { margin-top:28px; display:grid; grid-template-columns:1.6fr .8fr; gap:12px; }
    .demo-gallery img { width:100%; height:100%; object-fit:cover; display:block; }
    .demo-main { aspect-ratio:4/3; overflow:hidden; }
    .demo-side { display:grid; gap:12px; overflow:hidden; }
    .room-list { margin-top:48px; border-top:1px solid rgba(0,0,0,.15); }
    .room { display:grid; grid-template-columns:24px 1fr auto; gap:16px; border-bottom:1px solid rgba(0,0,0,.15); padding:24px 0; align-items:start; }
    .room small { display:block; margin-top:6px; color:#707070; }
    .disabled { opacity:.45; cursor:not-allowed; }
    .results-split { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; background:#f5f3ef; }
    .results-copy { min-height:100vh; padding:40px 54px; display:flex; flex-direction:column; }
    .results-copy-inner { flex:1; display:flex; flex-direction:column; justify-content:center; padding:60px 0; }
    .results-copy h1 { margin-top:24px; font-size:clamp(58px,7vw,112px); font-weight:500; line-height:.84; letter-spacing:-.075em; text-transform:uppercase; }
    .results-meta { margin-top:28px; font-size:19px; color:#877f77; }
    .results-summary { margin-top:36px; border-left:1px solid #aaa097; padding-left:25px; color:#82776d; font-size:10px; line-height:2; letter-spacing:.18em; text-transform:uppercase; }
    .results-facts { margin-top:44px; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .results-facts>div { border-top:1px solid rgba(0,0,0,.15); border-bottom:1px solid rgba(0,0,0,.15); padding:20px 0; }
    .results-photo { min-height:100vh; background:url('/results-feature.jpg') center/cover no-repeat; }
    @media(max-width:800px){.results-split{grid-template-columns:1fr}.results-copy{min-height:auto;padding:30px 24px}.results-copy-inner{padding:70px 0}.results-copy h1{font-size:58px}.results-photo{min-height:62vh}.results-facts{grid-template-columns:1fr}}
    @media(max-width:760px){.luxury-strip{padding:80px 20px}.luxury-grid,.demo-gallery{grid-template-columns:1fr;gap:20px}.demo-side{grid-template-columns:1fr 1fr;min-height:260px}.demo-head{display:block}.demo-head h1{font-size:42px;line-height:.95}.demo-badge{display:inline-block;margin-top:20px}.room{grid-template-columns:24px 1fr}.room>span:last-child{grid-column:2}.signup{padding:40px 20px}}
    @media(max-width:700px){.quiz-wrap{padding:0 20px 28px}.quiz-head{position:relative;display:flex;flex-direction:row;align-items:center;justify-content:space-between}.quiz-head:before{display:block}.quiz-head .progress{position:absolute;right:0;top:38px;display:block;margin:0}.question-layout{display:block;min-height:auto}.question-copy{padding:45px 0 28px}.question-copy .question-title{width:100%;max-width:340px;font-size:32px;line-height:.98;white-space:normal;overflow-wrap:normal}.quiz-hero{height:52vh;min-height:410px}.choice-grid{margin:0 -20px;padding:0 8px}.choice{height:68px;min-width:132px}.quiz-nav{margin-top:20px}.text-mode .question-layout{padding:10vh 0 30px}.date-step{grid-template-columns:1fr;margin:0 -20px -28px}.date-left{min-height:auto;padding:30px 24px 48px}.date-copy{padding:70px 0 10px}.date-copy h2{font-size:52px}.date-card{padding:0}.date-image{min-height:58vh}.date-grid{grid-template-columns:1fr}}
    @media(max-width:560px){.nav-inner{padding:18px 20px}.nav-inner>.cream-btn{display:none}.hero{margin:10px;min-height:70vh}.hero-content{padding:0 16px 40px}.hero-brand{padding:0;font-size:26px;white-space:nowrap}.hero-actions{padding:0}.photo-box{height:440px}}
  </style>
</head>
<body>${body}${extraScript}</body>
</html>`;
}

function nav() {
  return `<nav class="nav">
  <div class="nav-inner">
    <a class="brand" href="/">globtrek<img class="brand-mark" src="/globtrek-mark.png" alt=""></a>
    <div class="nav-links">
      <a href="/#collections">Trips</a>
      <a href="/discover">Quiz</a>
      <a href="/how-it-works">How It Works</a>
      <a href="/about">About</a>
    </div>
    <a class="cream-btn" href="/discover">Find my trip</a>
  </div>
</nav>`;
}

function homePage() {
  const destinationCards = destinations
    .map(
      ({ name, image, price }) => `<article class="destination">
  <div class="photo-box"><img src="${img(image, 1800)}" alt="${name}"></div>
  <div class="dest-meta">
    <div class="destination-name"><h3>${name}</h3></div>
    <div class="price">${price}</div>
  </div>
</article>`,
    )
    .join("");

  return shell(
    "globtrek - One Tab Travel",
    `${nav()}
<main>
  <section class="hero" id="discover">
    <img src="${img(photos.boat, 3000)}" alt="A bright alpine lake and green mountains">
    <div class="shade"></div>
    <div class="hero-content">
      <h1 class="hero-brand" style="font-weight:200;text-transform:uppercase;letter-spacing:-.045em">One Tab Travel</h1>
      <div class="hero-actions">
        <a class="cream-btn" href="/discover">Find your trip →</a>
      </div>
    </div>
  </section>
  <section id="collections" class="section">
    <div class="section-inner">
      <div class="section-kicker">
        <div class="section-title">Trending now</div>
      </div>
      <div class="dest-grid">${destinationCards}</div>
    </div>
  </section>
  <section id="luxury" class="luxury-strip" aria-label="Luxury travel inspiration">
    <div class="luxury-grid">
      <div class="luxury-image"><img src="/luxury-snow.jpg" alt="A fashion portrait in a snowy alpine landscape"></div>
      <div class="luxury-image"><img src="/luxury-coast.jpg" alt="A woman in a flowing white dress overlooking the sea"></div>
      <div class="luxury-image"><img src="/luxury-paris-bw.jpg" alt="A black-and-white fashion portrait in front of the Eiffel Tower"></div>
    </div>
  </section>
  <section class="signup"><form class="signup-form" id="signup"><input type="email" required placeholder="Email address" aria-label="Email address"><button>Join</button></form><p class="note" id="signup-note"></p></section>
  <section id="journal" class="world">
    <img src="${img(photos.mountain, 3000)}" alt="A dramatic mountain lake landscape">
    <div class="shade"></div>
    <div class="world-content">
      <div class="hero-actions" style="justify-content:center"><a class="cream-btn" href="/discover">Begin Discovery</a></div>
    </div>
  </section>
</main>
${footer()}<script>document.getElementById("signup").addEventListener("submit",function(event){event.preventDefault();document.getElementById("signup-note").textContent="Email signup is being connected. No address was submitted.";});</script>`,
  );
}

function demoBookingPage() {
  const rooms = [
    ["Mountain Studio", "1 king bed · 2 guests", "Demo estimate · $420/night"],
    ["View Suite", "1 king bed · Sitting room · 2 guests", "Demo estimate · $610/night"],
    ["Two-bedroom Residence", "2 bedrooms · 4 guests", "Demo estimate · $890/night"],
  ].map(([name, detail, price], index) => `<label class="room"><input type="radio" name="room" ${index === 0 ? "checked" : ""}><span><strong>${name}</strong><small>${detail}</small></span><span>${price}</span></label>`).join("");
  return shell("Stay design demo · GlobTrek", `${nav()}<main class="demo"><div class="demo-head"><div><p class="micro">Your stay</p><h1>Sample Alpine House</h1></div><span class="demo-badge">Design demo · not bookable</span></div><div class="demo-gallery"><div class="demo-main"><img src="/banff-feature.jpg" alt="Sample mountain hotel used for a booking-interface design demonstration"></div><div class="demo-side"><img src="/luxury-snow.jpg" alt="Snowy mountain atmosphere"><img src="/luxury-coast.jpg" alt="Bright architectural atmosphere"></div></div><p class="note" style="margin-top:32px;max-width:700px">This sample shows how future provider-supplied rooms could be compared. The property, room details, prices, and availability are mock interface content only.</p><div class="room-list">${rooms}</div><div class="hero-actions"><button class="cream-btn disabled" disabled>Continue to provider</button><p class="note">Disabled in this demo. No live room, price, availability, provider link, payment, or reservation is created.</p></div></main>${footer()}`);
}

function quizPage() {
  const quizQuestions = questions.map(([eyebrow, question, choices]) => [
    eyebrow,
    question,
    choices.map(([label, image]) => [label, image]),
  ]);

  return shell(
    "globtrek - Discovery Quiz",
    `<main class="quiz-wrap">
  <section class="quiz">
    <div class="quiz-head">
      <div class="progress"><div class="progress-row"><span id="stepLabel">Question 01</span><span id="progressText">0%</span></div><div class="track"><div class="fill" id="fill"></div></div></div>
    </div>
    <form id="quizForm">
      <div id="questionStep">
        <div class="question-layout"><div class="question-copy"><p class="eyebrow" id="eyebrow">The GlobTrek quiz</p><h1 class="question-title" id="questionTitle"></h1><p class="note" id="questionGuidance"></p></div><div class="quiz-hero"><img id="quizHero" alt=""></div></div>
        <div class="choice-grid" id="choices"></div>
        <div class="quiz-nav">
          <button class="ghost" id="backBtn" type="button">Back</button>
          <button class="cream-btn" id="nextBtn" type="button">Next</button>
        </div>
      </div>
      <div class="date-step" id="dateStep" hidden>
        <div class="date-left">
          <div class="date-top"><span class="date-wordmark">GLOBTREK</span><span class="date-dashes" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>
          <div class="date-copy">
            <p class="eyebrow">Final Step</p>
            <h2>When are you leaving?</h2>
            <p class="date-subtitle">Flexible dates are welcome.</p>
            <p class="date-summary" id="summary"></p>
          <div class="date-card">
          <div class="mode-grid"><button class="active" id="datesMode" type="button">I know my dates</button><button id="flexMode" type="button">I'm flexible</button></div>
          <div class="date-grid" id="knownDates">
            <label><span>Depart</span><input id="tripStart" required type="date"></label>
            <label><span>Return</span><input id="tripEnd" required type="date"></label>
          </div>
          <div class="season-options" id="seasonOptions" hidden><button class="season-chip" data-season="Spring (Mar-May)" type="button">Spring<span>Mar – May</span></button><button class="season-chip" data-season="Summer (Jun-Aug)" type="button">Summer<span>Jun – Aug</span></button><button class="season-chip" data-season="Fall (Sep-Nov)" type="button">Fall<span>Sep – Nov</span></button><button class="season-chip" data-season="Winter (Dec-Feb)" type="button">Winter<span>Dec – Feb</span></button></div>
          <input id="flexible" type="checkbox" hidden>
          <div class="quiz-nav">
            <button class="ghost" id="dateBackBtn" type="button">Back</button>
            <button class="cream-btn" type="submit">Reveal My Trip</button>
          </div>
          </div></div>
        </div><div class="date-image" role="img" aria-label="A coastal villa beside clear blue water"></div>
      </div>
    </form>
  </section>
</main>`,
    `<script>
const questions = ${JSON.stringify(quizQuestions)};
const guidance = {
  "What pace sounds right?": "Helps us balance planned experiences with time to explore.",
  "Where would you rather stay?": "Used to match stays to the way you prefer to travel.",
  "What matters most when you travel?": "Used to shape the experiences and character of your trip.",
  "What budget feels right?": "Used to prioritize planning estimates within your preferred range."
};
let step = new URLSearchParams(window.location.search).get("step") === "final" ? questions.length : 0;
const answers = {};
const els = {
  stepLabel: document.getElementById("stepLabel"),
  progressText: document.getElementById("progressText"),
  fill: document.getElementById("fill"),
  eyebrow: document.getElementById("eyebrow"),
  questionTitle: document.getElementById("questionTitle"),
  questionGuidance: document.getElementById("questionGuidance"),
  choices: document.getElementById("choices"),
  backBtn: document.getElementById("backBtn"),
  nextBtn: document.getElementById("nextBtn"),
  questionStep: document.getElementById("questionStep"),
  dateStep: document.getElementById("dateStep"),
  dateBackBtn: document.getElementById("dateBackBtn"),
  summary: document.getElementById("summary"),
  form: document.getElementById("quizForm"),
  tripStart: document.getElementById("tripStart"),
  tripEnd: document.getElementById("tripEnd"),
  flexible: document.getElementById("flexible")
};
els.hero = document.getElementById("quizHero");
function render() {
  const dateStep = step === questions.length;
  const progress = Math.round((Math.min(step, questions.length) / questions.length) * 100);
  els.stepLabel.textContent = String(step + 1).padStart(2,"0") + " / " + String(questions.length + 1).padStart(2,"0");
  els.progressText.textContent = "";
  els.fill.style.width = progress + "%";
  els.questionStep.hidden = dateStep;
  els.dateStep.hidden = !dateStep;
  document.querySelector(".quiz-head").hidden = dateStep;
  if (dateStep) {
    els.summary.textContent = Object.values(answers).filter(Boolean).join(" / ");
    return;
  }
  const [eyebrow, question, choices] = questions[step];
  const visual = [0,3,4].includes(step);
  els.questionStep.classList.toggle("text-mode", !visual);
  els.eyebrow.textContent = eyebrow;
  els.questionTitle.textContent = step === 0 ? "Where do you wanna be?" : question;
  els.questionGuidance.textContent = "";
  els.backBtn.disabled = step === 0;
  els.nextBtn.disabled = !answers[question];
  if (visual) { const selectedChoice = choices.find(([label]) => answers[question] === label) || choices[0]; els.hero.src = selectedChoice[1] + '?q=82&w=2200&auto=format&fit=crop'; els.hero.alt = selectedChoice[0]; }
  els.choices.innerHTML = choices.map(([label, image]) => {
    const selected = answers[question] === label ? " selected" : "";
    return '<button class="choice' + selected + '" type="button" data-label="' + label + '"><img alt="" src="' + image + '?q=82&w=1400&auto=format&fit=crop"><span class="choice-copy"><h4>' + label + '</h4></span></button>';
  }).join("");
  els.choices.querySelectorAll(".choice").forEach((button) => {
    if (visual) { button.addEventListener("mouseenter", () => { const found = choices.find(([label]) => label === button.dataset.label); els.hero.style.opacity="0"; setTimeout(()=>{els.hero.src=found[1]+'?q=82&w=2200&auto=format&fit=crop';els.hero.alt=found[0];els.hero.style.opacity="1";},160); }); }
    button.addEventListener("click", () => {
      answers[question] = button.dataset.label;
      setTimeout(() => {
        step = Math.min(step + 1, questions.length);
        render();
      }, 140);
    });
  });
}
els.backBtn.addEventListener("click", () => { step = Math.max(0, step - 1); render(); });
els.nextBtn.addEventListener("click", () => { step = Math.min(step + 1, questions.length); render(); });
els.dateBackBtn.addEventListener("click", () => { step = questions.length - 1; render(); });
document.querySelectorAll(".season-chip").forEach((button) => {
  button.addEventListener("click", () => {
    answers.season = button.dataset.season;
    els.flexible.checked = true;
    els.tripStart.disabled = true;
    els.tripEnd.disabled = true;
    els.tripStart.value = "";
    els.tripEnd.value = "";
  });
});
els.tripStart.addEventListener("input", () => { els.tripEnd.min = els.tripStart.value; });
els.flexible.addEventListener("change", () => {
  els.tripStart.disabled = els.flexible.checked;
  els.tripEnd.disabled = els.flexible.checked;
  if (els.flexible.checked) {
    els.tripStart.value = "";
    els.tripEnd.value = "";
  }
});
document.getElementById("datesMode").addEventListener("click",()=>{els.flexible.checked=false;els.flexible.dispatchEvent(new Event("change"));document.getElementById("knownDates").hidden=false;document.getElementById("seasonOptions").hidden=true;document.getElementById("datesMode").classList.add("active");document.getElementById("flexMode").classList.remove("active");});
document.getElementById("flexMode").addEventListener("click",()=>{els.flexible.checked=true;els.flexible.dispatchEvent(new Event("change"));document.getElementById("knownDates").hidden=true;document.getElementById("seasonOptions").hidden=false;document.getElementById("flexMode").classList.add("active");document.getElementById("datesMode").classList.remove("active");});
els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!els.flexible.checked && (!els.tripStart.value || !els.tripEnd.value)) return;
  window.localStorage.setItem("globtrekQuiz", JSON.stringify({
    answers,
    tripStart: els.tripStart.value,
    tripEnd: els.tripEnd.value,
    isFlexible: els.flexible.checked,
    createdAt: Date.now()
  }));
  window.location.href = "/thinking";
});
render();
</script>`,
  );
}

function thinkingPage() {
  return shell(
    "globtrek - Thinking",
    `<main class="thinking">
  <section class="thinking-panel">
    <img class="thinking-mark" src="/globtrek-mark.png" alt="">
    <p class="eyebrow">GlobTrek AI</p>
    <h1 style="margin-left:auto;margin-right:auto">Thinking through your trip</h1>
    <div class="thinking-bar"><div class="thinking-fill" id="thinkingFill"></div></div>
    <p class="micro" id="thinkingText" style="margin-top:30px">Reading your travel mood</p>
    <a class="discover-link" href="/results" style="display:inline-block;margin-top:46px">Skip wait</a>
  </section>
</main>`,
    `<script>
const thoughts = ["Reading your travel mood", "Comparing pace, place, and season", "Scoring destinations against your answers", "Building your reveal"];
let index = 0;
const text = document.getElementById("thinkingText");
const fill = document.getElementById("thinkingFill");
const ticker = setInterval(() => {
  index = Math.min(index + 1, thoughts.length - 1);
  text.textContent = thoughts[index];
  fill.style.width = (((index + 1) / thoughts.length) * 100) + "%";
}, 650);
setTimeout(() => {
  clearInterval(ticker);
  window.location.href = "/results";
}, 3100);
</script>`,
  );
}

function resultsPage() {
  return shell(
    "globtrek - Your Reveal",
    `<main class="results-split"><section class="results-copy"><a class="brand" href="/" style="font-size:20px;letter-spacing:.18em">GLOBTREK</a><div class="results-copy-inner"><p class="micro">Your result</p><h1 id="resultName"></h1><p class="results-meta" id="resultMeta"></p><p class="results-summary" id="answerSummary"></p><div class="results-facts"><div><p class="micro">Estimated trip</p><p id="resultPrice"></p></div><div><p class="micro">Best season</p><p id="resultSeason"></p></div></div><p class="note" id="resultWhy" style="max-width:600px;margin-top:38px;line-height:1.8"></p><div class="hero-actions" style="justify-content:space-between;align-items:center"><a href="/discover">← Retake quiz</a><a class="cream-btn" href="/demo-booking">View the trip</a></div></div></section><section class="results-photo" aria-label="A coastal villa surrounded by greenery beside clear blue water"></section></main>`,
    `<script>
const destinations = ${JSON.stringify(aiDestinations)};
const stored = JSON.parse(window.localStorage.getItem("globtrekQuiz") || '{"answers":{}}');
function score(destination) {
  return Object.values(stored.answers || {}).reduce((total, answer) => {
    return total + (destination.tags.includes(answer) ? 3 : 0);
  }, 0);
}
const localMatches = destinations.map((destination) => ({ ...destination, score: score(destination) + Math.random() * 4.5 }))
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
const picked = Object.values(stored.answers || {}).slice(0, 5);
function renderMatches(matches) {
  const primary = matches[0];
  document.getElementById("resultName").textContent = primary.name;
  document.getElementById("resultMeta").textContent = primary.nights + ' · ' + (stored.isFlexible ? (stored.answers.season || 'Flexible dates') : 'Your dates');
  document.getElementById("resultPrice").textContent = primary.price;
  document.getElementById("resultSeason").textContent = primary.season;
  document.getElementById("answerSummary").textContent = picked.join(" / ") || primary.style;
  document.getElementById("resultWhy").textContent = primary.why;
}
renderMatches(localMatches);
fetch("/api/match", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(stored)
})
  .then((response) => response.json())
  .then((data) => {
    if (Array.isArray(data.matches) && data.matches.length) {
      renderMatches(data.matches);
    }
  })
  .catch(() => {});
</script>`,
  );
}

function editorialPage({ title, eyebrow, heading, intro, sections }) {
  const rows = sections
    .map(
      ([number, sectionTitle, copy]) => `<section class="editorial-row">
  <p class="micro">${number}</p>
  <div><h2>${sectionTitle}</h2><p class="editorial-copy">${copy}</p></div>
</section>`,
    )
    .join("");

  return shell(
    `${title} | GlobTrek`,
    `${nav()}<main class="editorial-page"><div class="editorial-inner">
  <header class="editorial-head"><p class="eyebrow">${eyebrow}</p><h1>${heading}</h1><p class="editorial-intro">${intro}</p></header>
  <div class="editorial-sections">${rows}</div>
</div></main>${footer()}`,
  );
}

function informationPage(pathname) {
  const pages = {
    "/how-it-works": {
      title: "How It Works",
      eyebrow: "The process",
      heading: "How it works",
      intro: "A considered route from personal preferences to a trip that makes sense.",
      sections: [
        ["01", "Tell us how you travel", "Answer a short set of questions about pace, interests, destination preferences, accommodation style, budget, and timing."],
        ["02", "GlobTrek builds your match", "Your preferences are compared with the character of each destination so the recommendation reflects the way you want the trip to feel."],
        ["03", "Book with the provider", "When an option is bookable through an external travel service, continue there to review final availability, pricing, terms, and complete the reservation."],
      ],
    },
    "/about": {
      title: "About",
      eyebrow: "About GlobTrek",
      heading: "Start with the traveler.",
      intro: "Travel planning has become a collection of tabs. GlobTrek is being built around a simpler, more considered starting point.",
      sections: [
        ["01", "A coherent recommendation", "GlobTrek uses travel preferences to organize destination, stay, and experience options around fit rather than volume."],
        ["02", "A clear booking handoff", "When an option can be booked externally, final pricing, availability, payment, and the reservation are handled by that provider."],
      ],
    },
    "/contact": {
      title: "Contact",
      eyebrow: "Contact",
      heading: "A direct line, thoughtfully opened.",
      intro: "A verified public support address has not yet been configured, so GlobTrek will not send you to an unmonitored inbox.",
      sections: [["01", "Contact details to complete", "Product owner TODO: provide the public support email and responsible business identity before support is offered."]],
    },
    "/privacy": {
      title: "Privacy",
      eyebrow: "Privacy",
      heading: "What the current product handles.",
      intro: "This notice describes the code and services used by the current early-access version of GlobTrek.",
      sections: [
        ["01", "Quiz preferences", "Quiz answers and optional dates are stored in browser localStorage and sent to GlobTrek’s matching endpoint. OpenAI may process those preferences server-side when configured."],
        ["02", "Travelpayouts Drive", "Travelpayouts may use scripts, cookies, or similar technologies to recognize eligible referrals and measure qualifying activity according to its policies."],
        ["03", "External services", "Unsplash serves editorial imagery. External booking providers control their own data collection, pricing, payment, reservations, and privacy practices."],
        ["04", "Details to complete", "Product owner TODO: add the responsible legal entity, public privacy contact, and any business retention practices introduced beyond browser storage."],
      ],
    },
    "/terms": {
      title: "Terms",
      eyebrow: "Terms",
      heading: "Using GlobTrek.",
      intro: "Practical early-access terms for a travel discovery and recommendation product.",
      sections: [
        ["01", "Travel discovery", "Recommendations are informational and depend on the preferences and limited destination information available to the product."],
        ["02", "Information can change", "Trip estimates, destination information, and suggested itineraries may change. Confirm important details before relying on them."],
        ["03", "External bookings", "Final pricing, availability, fees, payment, and booking terms are controlled by the external provider. GlobTrek is not represented as the merchant of record."],
        ["04", "Details to complete", "Product owner TODO: insert the responsible entity, notice address, governing law, dispute process, and counsel-approved effective date."],
      ],
    },
    "/affiliate-disclosure": {
      title: "Affiliate Disclosure",
      eyebrow: "Affiliate disclosure",
      heading: "A clear route to booking.",
      intro: "Some links may be affiliate links. That relationship should be understandable before you leave GlobTrek.",
      sections: [
        ["01", "How affiliate links work", "GlobTrek may receive compensation after an eligible link leads to a qualifying action or booking with an external provider."],
        ["02", "Where booking happens", "The external provider controls final pricing, availability, payment, reservations, customer service, and terms."],
      ],
    },
  };

  return pages[pathname] ? editorialPage(pages[pathname]) : null;
}

function footer() {
  return `<footer>
  <div class="footer-inner">
    <div><a class="brand" href="/">globtrek<img class="brand-mark" src="/globtrek-mark.png" alt=""></a></div>
    <div class="footer-grid">
      <div><p><a href="/#discover">Discover</a></p><p><a href="/discover">Quiz</a></p></div>
      <div><p><a href="/how-it-works">How It Works</a></p><p><a href="/about">About</a></p></div>
      <div><p><a href="/contact">Contact</a></p><p><a href="/privacy">Privacy</a></p><p><a href="/terms">Terms</a></p></div>
      <div><p><a href="/affiliate-disclosure">Affiliate Disclosure</a></p></div>
    </div>
  </div>
  <div class="footer-inner footer-meta"><span>© 2026 GlobTrek</span><span>Travel recommendations and booking links may be provided through third-party travel services.</span></div>
</footer>`;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
  let html;

  if (url.pathname === "/api/match" && request.method === "POST") {
    await matchResponse(request, response);
    return;
  } else if (["/globtrek-mark.png", "/kyoto-feature.jpg", "/amalfi-feature.jpg", "/banff-feature.jpg", "/luxury-snow.jpg", "/luxury-coast.jpg", "/luxury-pin.jpg", "/luxury-paris-bw.jpg", "/results-feature.jpg"].includes(url.pathname)) {
    const asset = await readFile(new URL(`../public/${url.pathname.slice(1)}`, import.meta.url));
    response.writeHead(200, {
      "Content-Type": url.pathname.endsWith(".png") ? "image/png" : "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    });
    response.end(asset);
    return;
  } else if (url.pathname === "/" || url.pathname === "/index.html") {
    html = homePage();
  } else if (url.pathname === "/discover" || url.pathname === "/discover/") {
    html = quizPage();
  } else if (url.pathname === "/thinking" || url.pathname === "/thinking/") {
    html = thinkingPage();
  } else if (url.pathname === "/results" || url.pathname === "/results/") {
    html = resultsPage();
  } else if (url.pathname === "/demo-booking" || url.pathname === "/demo-booking/") {
    html = demoBookingPage();
  } else if (informationPage(url.pathname.replace(/\/$/, ""))) {
    html = informationPage(url.pathname.replace(/\/$/, ""));
  } else {
    response.writeHead(302, { Location: "/" });
    response.end();
    return;
  }

  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(html);
});

server.listen(port, host, () => {
  console.log(`globtrek dev server ready at http://${host}:${port}`);
});

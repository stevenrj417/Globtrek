import http from "node:http";

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
  { name: "Kyoto, Japan", image: photos.kyoto, price: "Est. $4,850-$6,400", note: "Culture, food, slow mornings" },
  { name: "Amalfi Coast", image: photos.amalfi, price: "Est. $5,900-$8,200", note: "Sea cliffs, villas, long lunches" },
  { name: "Banff", image: photos.banff, price: "Est. $3,750-$5,600", note: "Lodges, alpine air, big views" },
];

const aiDestinations = [
  {
    name: "KYOTO, JAPAN",
    image: photos.kyoto,
    price: "Estimated $4,850-$6,400 per person",
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
    price: "Estimated $5,900-$8,200 per person",
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
    price: "Estimated $3,750-$5,600 per person",
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
    price: "Estimated $4,250-$6,100 per person",
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
    price: "Estimated $2,950-$4,800 per person",
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
    price: "Estimated $4,600-$6,900 per person",
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
      ["Ocean", photos.beach],
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
                "You are Globtrek's premium travel matching AI. Rank only the provided destinations. Choose a strong fit, but if several options are close, vary the reveal instead of always choosing the same destination. Include realistic trip-planning rationale and mock costs. Return strict JSON with rankedNames, why, and itinerary. No markdown.",
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
    html { scroll-behavior: smooth; }
    body { margin: 0; background: #080807; color: #efe6dc; font-family: "Avenir Next", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-rendering: geometricPrecision; -webkit-font-smoothing: antialiased; }
    a { color: inherit; text-decoration: none; }
    button, input { font: inherit; }
    .bar { background: #7f634d; color: #fff7ef; text-align: center; padding: 12px 20px; font-size: 10px; letter-spacing: .26em; text-transform: uppercase; border-bottom: 1px solid rgba(239,230,220,.1); }
    .nav { border-bottom: 1px solid rgba(239,230,220,.08); background: rgba(8,8,7,.88); }
    .nav-inner { max-width: 2200px; margin: 0 auto; padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .brand { font-size: clamp(32px, 4vw, 44px); line-height: .95; font-weight: 900; letter-spacing: -.035em; }
    .nav-links { display: flex; gap: 54px; color: #d8c7b6; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; }
    .cream-btn { display: inline-flex; align-items: center; justify-content: center; background: #efe6dc; color: #050505; padding: 16px 30px; font-weight: 700; border: 0; cursor: pointer; transition: .28s ease; text-transform: uppercase; letter-spacing: .14em; font-size: 13px; }
    .cream-btn:hover { background: #fff; transform: translateY(-1px); }
    .ghost { display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.28); color: #efe6dc; padding: 16px 30px; background: rgba(0,0,0,.12); backdrop-filter: blur(10px); cursor: pointer; }
    .hero { min-height: 780px; height: 96vh; position: relative; overflow: hidden; }
    .hero img, .world img, .result-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .shade { position: absolute; inset: 0; background: linear-gradient(to top, #050505, rgba(0,0,0,.28), rgba(0,0,0,.42)); }
    .hero-content { position: absolute; inset: auto 0 0 0; padding: clamp(36px, 6vw, 84px); }
    .eyebrow { color: #d8c7b6; font-size: 10px; letter-spacing: .34em; text-transform: uppercase; }
    .hero-brand { margin: 0; color: #f4eadf; font-size: clamp(48px, 7vw, 112px); line-height: .9; font-weight: 300; letter-spacing: .04em; text-transform: uppercase; max-width: 1000px; }
    .micro { color: #8f857b; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; }
    .badge { display: inline-flex; border: 1px solid rgba(239,230,220,.2); padding: 8px 11px; color: #b8a796; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 26px 0 0; font-size: clamp(44px, 7vw, 88px); line-height: .92; font-weight: 300; letter-spacing: 0; max-width: 900px; }
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
    .price { color: #d8c7b6; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; text-align: right; white-space: nowrap; }
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
    @media (max-width: 900px) {
      .nav-links { display: none; }
      .dest-grid, .match-grid, .date-step, .result-panel { grid-template-columns: 1fr; }
      .footer-inner, .quiz-head { flex-direction: column; align-items: stretch; }
      .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .choice, .choice:nth-child(1), .choice:nth-child(2) { grid-column: span 6; }
      .hero, .world { min-height: 680px; }
    }
    @media (max-width: 560px) {
      .nav-inner { padding: 24px 20px; }
      .cream-btn { width: 100%; }
      .date-grid { grid-template-columns: 1fr; }
      .bar { letter-spacing: .16em; }
      .answers div, .detail-row { display: grid; }
      .answers strong, .detail-row strong { text-align: left; max-width: none; }
    }
  </style>
</head>
<body>${body}${extraScript}</body>
</html>`;
}

function nav() {
  return `<div class="bar">One Tab Travel · Coming Soon</div>
<nav class="nav">
  <div class="nav-inner">
    <a class="brand" href="/">globtrek</a>
    <span class="badge">Coming soon</span>
    <div class="nav-links">
      <a href="/#discover">Discover</a>
      <a href="/discover">Quiz</a>
      <a href="/#collections">Collections</a>
      <a href="/#journal">Journal</a>
    </div>
    <a class="ghost" href="/discover">Begin · Coming Soon</a>
  </div>
</nav>`;
}

function homePage() {
  const destinationCards = destinations
    .map(
      ({ name, image, price, note }) => `<article class="destination">
  <div class="photo-box"><img src="${img(image, 1800)}" alt="${name}"></div>
  <div class="dest-meta">
    <div><h3>${name}</h3><span class="badge" style="margin-top:12px">Coming soon</span><div class="note">${note}</div></div>
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
    <img src="${img(photos.road, 3000)}" alt="A warm road running through a desert landscape">
    <div class="shade"></div>
    <div class="hero-content">
      <h1 class="hero-brand">One Tab Travel</h1>
      <span class="badge" style="margin-top:22px">Coming soon</span>
      <div class="hero-actions">
        <a class="cream-btn" href="/discover">Take the Quiz · Coming Soon</a>
        <a class="ghost" href="/#collections">View Trips</a>
      </div>
    </div>
  </section>
  <section id="collections" class="section">
    <div class="section-inner">
      <div class="section-kicker">
        <div class="section-title">Collections <span class="badge" style="margin-left:14px">Coming soon</span></div>
      </div>
      <div class="dest-grid">${destinationCards}</div>
    </div>
  </section>
  <section id="journal" class="world">
    <img src="${img(photos.mountain, 3000)}" alt="A dramatic mountain lake landscape">
    <div class="shade"></div>
    <div class="world-content">
      <div class="section-title">Journal <span class="badge" style="margin-left:14px">Coming soon</span></div>
      <div class="hero-actions" style="justify-content:center"><a class="cream-btn" href="/discover">Begin Discovery</a></div>
    </div>
  </section>
</main>
${footer()}`,
  );
}

function quizPage() {
  const quizQuestions = questions.map(([eyebrow, question, choices]) => [
    eyebrow,
    question,
    choices.map(([label, image]) => [label, image]),
  ]);

  return shell(
    "globtrek - Discovery Quiz",
    `${nav()}
<main class="quiz-wrap">
  <section class="quiz">
    <div class="quiz-head">
      <div class="progress"><div class="progress-row"><span id="stepLabel">Question 01</span><span id="progressText">0%</span></div><div class="track"><div class="fill" id="fill"></div></div></div>
    </div>
    <form id="quizForm">
      <div id="questionStep">
        <p class="eyebrow" id="eyebrow">Question 01</p>
        <h1 class="question-title" id="questionTitle"></h1>
        <div class="choice-grid" id="choices"></div>
        <div class="quiz-nav">
          <button class="ghost" id="backBtn" type="button">Back</button>
          <button class="cream-btn" id="nextBtn" type="button">Next</button>
        </div>
      </div>
      <div class="date-step" id="dateStep" hidden>
        <div>
          <p class="eyebrow">Final Step</p>
          <h2>When are you leaving?</h2>
          <p style="color:#d8c7b6;font-size:18px;font-weight:300">Flexible dates are welcome.</p>
          <p id="summary" style="max-width:620px;border-left:1px solid #8b6d57;padding-left:22px;color:#d8c7b6;letter-spacing:.12em;text-transform:uppercase;font-size:13px;line-height:1.8"></p>
        </div>
        <div class="date-card">
          <div class="date-grid">
            <button class="ghost season-chip" data-season="Spring (Mar-May)" type="button">Spring<br><span>Mar-May</span></button>
            <button class="ghost season-chip" data-season="Summer (Jun-Aug)" type="button">Summer<br><span>Jun-Aug</span></button>
            <button class="ghost season-chip" data-season="Fall (Sep-Nov)" type="button">Fall<br><span>Sep-Nov</span></button>
          </div>
          <div class="date-grid">
            <label><span>Depart</span><input id="tripStart" required type="date"></label>
            <label><span>Return</span><input id="tripEnd" required type="date"></label>
          </div>
          <label class="flex-row"><input id="flexible" type="checkbox">I'm flexible</label>
          <div class="answers" id="answers"></div>
          <div class="quiz-nav">
            <button class="ghost" id="dateBackBtn" type="button">Back</button>
            <button class="cream-btn" type="submit">Reveal My Trip</button>
          </div>
        </div>
      </div>
    </form>
  </section>
</main>`,
    `<script>
const questions = ${JSON.stringify(quizQuestions)};
let step = 0;
const answers = {};
const els = {
  stepLabel: document.getElementById("stepLabel"),
  progressText: document.getElementById("progressText"),
  fill: document.getElementById("fill"),
  eyebrow: document.getElementById("eyebrow"),
  questionTitle: document.getElementById("questionTitle"),
  choices: document.getElementById("choices"),
  backBtn: document.getElementById("backBtn"),
  nextBtn: document.getElementById("nextBtn"),
  questionStep: document.getElementById("questionStep"),
  dateStep: document.getElementById("dateStep"),
  dateBackBtn: document.getElementById("dateBackBtn"),
  answers: document.getElementById("answers"),
  summary: document.getElementById("summary"),
  form: document.getElementById("quizForm"),
  tripStart: document.getElementById("tripStart"),
  tripEnd: document.getElementById("tripEnd"),
  flexible: document.getElementById("flexible")
};
function render() {
  const dateStep = step === questions.length;
  const progress = Math.round((Math.min(step, questions.length) / questions.length) * 100);
  els.stepLabel.textContent = dateStep ? "Reveal" : questions[step][0];
  els.progressText.textContent = progress + "%";
  els.fill.style.width = progress + "%";
  els.questionStep.hidden = dateStep;
  els.dateStep.hidden = !dateStep;
  if (dateStep) {
    els.answers.innerHTML = questions.map((q) => '<div><span>' + q[1] + '</span><strong>' + (answers[q[1]] || "") + '</strong></div>').join("");
    els.summary.textContent = Object.values(answers).slice(0, 4).join(" / ");
    return;
  }
  const [eyebrow, question, choices] = questions[step];
  els.eyebrow.textContent = eyebrow;
  els.questionTitle.textContent = question;
  els.backBtn.disabled = step === 0;
  els.nextBtn.disabled = !answers[question];
  els.choices.innerHTML = choices.map(([label, image]) => {
    const selected = answers[question] === label ? " selected" : "";
    return '<button class="choice' + selected + '" type="button" data-label="' + label + '"><img alt="" src="' + image + '?q=82&w=1400&auto=format&fit=crop"><span class="choice-copy"><h4>' + label + '</h4></span></button>';
  }).join("");
  els.choices.querySelectorAll(".choice").forEach((button) => {
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
    <p class="eyebrow">Globtrek AI · Coming Soon</p>
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
    `${nav()}
<main class="quiz-wrap">
  <section class="quiz">
    <div class="result-hero">
      <img id="resultImage" src="" alt="">
      <div class="shade"></div>
      <div class="result-copy">
        <p class="eyebrow">Your AI Reveal</p>
        <div class="result-name" id="resultName"></div>
      </div>
    </div>
    <div class="result-panel">
      <div>
        <div class="trip-facts" id="tripFacts">
        </div>
        <div class="trip-facts" id="costFacts" style="margin-top:24px"></div>
        <p class="why" id="answerSummary"></p>
        <p class="why"><span class="micro">Why we chose it</span><br><span id="resultWhy"></span></p>
        <div class="hero-actions">
          <button class="cream-btn" type="button">Begin Planning · Coming Soon</button>
          <a class="ghost" href="/discover">Retake Quiz</a>
        </div>
      </div>
      <div class="itinerary">
        <p class="micro" style="border-bottom:0">Suggested itinerary</p>
        <div id="itinerary"></div>
      </div>
    </div>
    <div style="margin-top:64px">
      <h2>Other matches</h2>
      <div class="match-grid" id="otherMatches" style="margin-top:34px"></div>
    </div>
  </section>
</main>`,
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
function renderMatches(matches, source) {
  const primary = matches[0];
  document.getElementById("resultImage").src = primary.image + "?q=82&w=2400&auto=format&fit=crop";
  document.getElementById("resultImage").alt = primary.name;
  document.getElementById("resultName").textContent = primary.name;
  document.getElementById("tripFacts").innerHTML =
    '<p>Your trip: <strong>' + primary.nights + '</strong></p>' +
    '<p>Price: <strong>' + primary.price + '</strong></p>' +
    '<p>Style: <strong>' + primary.style + '</strong></p>' +
    '<p>Best season: <strong>' + primary.season + '</strong></p>';
  document.getElementById("costFacts").innerHTML = (primary.costs || []).map((item) => '<p><strong>' + item + '</strong></p>').join("");
  document.getElementById("answerSummary").innerHTML = picked.length ? '<span class="micro">Matched from</span><br>' + picked.join(" / ") + '<br>Engine: ' + source : "";
  document.getElementById("resultWhy").textContent = primary.why;
  document.getElementById("itinerary").innerHTML = primary.itinerary.map((item) => '<p>' + item + '</p>').join("");
  document.getElementById("otherMatches").innerHTML = matches.slice(1, 4).map((match) => (
    '<article class="match-card">' +
      '<div class="photo-box"><img src="' + match.image + '?q=82&w=1300&auto=format&fit=crop" alt="' + match.name + '"></div>' +
      '<div class="dest-meta"><h3>' + match.name + '</h3><div class="price">' + match.price + '</div></div>' +
      '<div class="note">' + match.why + '</div>' +
      '<a class="discover-link" href="/discover" style="display:inline-block;margin-top:22px">Discover -></a>' +
    '</article>'
  )).join("");
}
renderMatches(localMatches, "local");
fetch("/api/match", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(stored)
})
  .then((response) => response.json())
  .then((data) => {
    if (Array.isArray(data.matches) && data.matches.length) {
      renderMatches(data.matches, data.source === "openai" ? "OpenAI" : "local");
    }
  })
  .catch(() => {});
</script>`,
  );
}

function footer() {
  return `<footer>
  <div class="footer-inner">
    <div><a class="brand" href="/">globtrek</a></div>
    <div class="footer-grid">
      <div><p>Discover</p><p>Quiz</p><p>Collections</p></div>
      <div><p>Journal</p><p>Contact</p></div>
      <div><p>One Tab Travel</p><p>Private</p><p>Planning</p></div>
      <div><p>Culture</p><p>Nature</p><p>Escape</p></div>
    </div>
  </div>
</footer>`;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
  let html;

  if (url.pathname === "/api/match" && request.method === "POST") {
    await matchResponse(request, response);
    return;
  } else if (url.pathname === "/" || url.pathname === "/index.html") {
    html = homePage();
  } else if (url.pathname === "/discover" || url.pathname === "/discover/") {
    html = quizPage();
  } else if (url.pathname === "/thinking" || url.pathname === "/thinking/") {
    html = thinkingPage();
  } else if (url.pathname === "/results" || url.pathname === "/results/") {
    html = resultsPage();
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

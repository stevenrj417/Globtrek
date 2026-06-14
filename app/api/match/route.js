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
  return Object.values(answers || {}).reduce(
    (score, answer) => score + (destination.tags.includes(answer) ? 3 : 0),
    0,
  );
}

function fallbackMatches(answers) {
  return [...destinations]
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
  const primary = {
    ...matches[0],
    why: aiResult?.why || matches[0].why,
    itinerary: Array.isArray(aiResult?.itinerary)
      ? aiResult.itinerary
      : matches[0].itinerary,
  };

  return [primary, ...matches.slice(1)];
}

export async function POST(request) {
  const body = await request.json();
  const answers = body.answers || {};
  const fallback = fallbackMatches(answers);

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ source: "fallback", matches: fallback });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
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
              destinations: destinations.map(
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

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResult = JSON.parse(extractOutputText(data));

    return Response.json({
      source: "openai",
      matches: normalizeAiResult(aiResult, fallback),
    });
  } catch {
    return Response.json({ source: "fallback", matches: fallback });
  }
}

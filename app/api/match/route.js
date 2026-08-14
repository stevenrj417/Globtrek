import { destinations, scoreDestination } from "../../data/destinations";
import { hotelsFor } from "../../data/hotels";

/*const legacyDestinations = [
  {
    name: "KYOTO, JAPAN",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186",
    price: "Est. $4,850–$6,400 per person",
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
    price: "Est. $5,900–$8,200 per person",
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
    price: "Est. $3,750–$5,600 per person",
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
    price: "Est. $4,250–$6,100 per person",
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
    price: "Est. $2,950–$4,800 per person",
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
    price: "Est. $4,600–$6,900 per person",
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
];*/

function fallbackMatches(answers) {
  return [...destinations]
    .map((destination) => ({
      ...destination,
      score: scoreDestination(destination, answers),
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
  const matches = fallback;
  const primary = {
    ...matches[0],
    why: aiResult?.why || matches[0].why,
    itinerary: Array.isArray(aiResult?.itinerary)
      ? aiResult.itinerary
      : matches[0].itinerary,
    plan: aiResult?.plan && typeof aiResult.plan === "object" ? aiResult.plan : null,
  };

  return [primary, ...matches.slice(1)];
}

function tripLength(body) {
  if (body?.isFlexible || !body?.tripStart || !body?.tripEnd) return null;
  const start = Date.parse(`${body.tripStart}T00:00:00Z`);
  const end = Date.parse(`${body.tripEnd}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.min(30, Math.max(1, Math.round((end - start) / 86400000)));
}

export async function POST(request) {
  const body = await request.json();
  const answers = body.answers || {};
  const fallback = fallbackMatches(answers);
  const primaryDestination = fallback[0];
  const stayOptions = hotelsFor(primaryDestination, body).map(({ name, tags }) => ({ name, tags }));
  const nights = tripLength(body);

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ source: "fallback", aiStatus: "missing_key", matches: fallback });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
        reasoning: { effort: "low" },
        max_output_tokens: 1400,
        tools: [{ type: "web_search" }],
        input: [
          {
            role: "system",
            content:
              "You are GlobTrek's invisible trip-planning engine. The destination is already selected. Write like a sharp travel editor, never a chatbot. Personalize from every supplied quiz answer and the requested trip length. Use web search to verify every named restaurant and experience is a real, currently operating place in the supplied destination. Prefer iconic choices when discoveryLevel is high and genuinely under-the-radar local choices when it is low; use a thoughtful mix in the middle. Never invent a venue, airport, flight time, live price, availability, reservation, address, opening hour, or transfer duration. The airport code and hotel shortlist are supplied facts; do not replace them. Return only valid JSON with this exact shape: {\"why\":string,\"itinerary\":[string],\"plan\":{\"headline\":string,\"airport\":{\"code\":string,\"note\":string},\"arrivalWindow\":{\"title\":string,\"steps\":[string]},\"picks\":{\"restaurants\":[{\"name\":string,\"why\":string}],\"experiences\":[{\"name\":string,\"why\":string}]},\"budget\":[{\"category\":string,\"share\":string,\"note\":string}],\"days\":[{\"day\":string,\"title\":string,\"morning\":string,\"afternoon\":string,\"evening\":string}],\"practicalNotes\":[string]}}. Constraints: why is one sentence; headline is under 8 words; airport note is under 12 words; arrivalWindow has exactly 1 step under 18 words; picks has exactly 3 verified restaurants and 3 verified experiences, each why under 12 words; budget has exactly 4 broad categories with percentage shares; days has exactly 3 items and each time-of-day string is under 12 words. Use actual venue names inside the day plan. No markdown.",
          },
          {
            role: "user",
            content: JSON.stringify({
              answers,
              requestedTrip: {
                nights,
                flexible: Boolean(body.isFlexible),
                guests: Number.parseInt(body.guestCount, 10) || 2,
                originAirport: body.originAirport || null,
              },
              destination: (({ name, city, country, style, season, tags, price, nights: suggestedNights, recognition, airport }) => ({ name, city, country, style, season, tags, price, suggestedNights, recognition, airport }))(primaryDestination),
              verifiedHotelShortlist: stayOptions,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`request_${response.status}`);
    }

    const data = await response.json();
    const aiResult = JSON.parse(extractOutputText(data));

    return Response.json({
      source: "openai",
      matches: normalizeAiResult(aiResult, fallback),
    });
  } catch (error) {
    return Response.json({ source: "fallback", aiStatus: error instanceof Error ? error.message : "request_failed", matches: fallback });
  }
}

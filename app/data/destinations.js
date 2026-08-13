const photos = {
  culture: "https://images.unsplash.com/photo-1528360983277-13d401cdc186",
  coast: "https://images.unsplash.com/photo-1533105079780-92b9be482077",
  mountain: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  country: "https://images.unsplash.com/photo-1499002238440-d264edd596ec",
  city: "https://images.unsplash.com/photo-1518659526054-190340b32735",
  tropical: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325",
};

const catalog = [
  ["KYOTO", "JAPAN", "KIX", "culture", "Culture / Food / Slow mornings", "Spring or fall", ["Culture", "Slow mornings", "Balanced days", "Solo", "Couple", "Traditional inn", "Boutique hotel", "Food", "Premium", "One Week"]],
  ["TOKYO", "JAPAN", "HND", "city", "Design / Food / Electric nights", "March to May or October to November", ["Cities", "Packed schedule", "Solo", "Friends", "Design hotel", "Food", "Nightlife", "Shopping", "Premium", "One Week"]],
  ["SEOUL", "SOUTH KOREA", "ICN", "city", "Food / Design / Nightlife", "April to June or September to November", ["Cities", "Packed schedule", "Friends", "Solo", "Design hotel", "Food", "Nightlife", "Shopping", "Smart value"]],
  ["BANGKOK", "THAILAND", "BKK", "city", "Food / Temples / Rooftops", "November to February", ["Cities", "Food", "Nightlife", "Friends", "Solo", "Smart value", "Boutique hotel", "Adventure days"]],
  ["CHIANG MAI", "THAILAND", "CNX", "culture", "Temples / Markets / Mountains", "November to February", ["Culture", "Slow mornings", "Solo", "Couple", "Food", "Nature", "Smart value", "Boutique hotel"]],
  ["BALI", "INDONESIA", "DPS", "tropical", "Wellness / Beaches / Villas", "April to October", ["Ocean", "Mostly relaxing", "Couple", "Honeymoon", "Private villa", "Nature", "Food", "Premium"]],
  ["SINGAPORE", "SINGAPORE", "SIN", "city", "Architecture / Food / Ease", "February to April", ["Cities", "Food", "Design hotel", "Shopping", "Family", "Couple", "Premium", "Long Weekend"]],
  ["HANOI", "VIETNAM", "HAN", "culture", "Street food / History / Lakes", "October to April", ["Culture", "Food", "Solo", "Friends", "Smart value", "Boutique hotel", "Adventure days"]],
  ["MALDIVES", "MALDIVES", "MLE", "tropical", "Water / Privacy / Pure reset", "January to April", ["Ocean", "Mostly relaxing", "Couple", "Honeymoon", "Beach resort", "Blowout", "One Week"]],
  ["DUBAI", "UNITED ARAB EMIRATES", "DXB", "city", "Luxury / Desert / Big nights", "November to March", ["Cities", "Shopping", "Nightlife", "Beach resort", "Family", "Friends", "Blowout", "Five Nights"]],
  ["CAPE TOWN", "SOUTH AFRICA", "CPT", "coast", "Coast / Wine / Mountains", "November to March", ["Ocean", "Mountains", "Food", "Nature", "Adventure days", "Couple", "Friends", "Premium"]],
  ["MARRAKECH", "MOROCCO", "RAK", "culture", "Riads / Markets / Design", "March to May or September to November", ["Culture", "Shopping", "Food", "Couple", "Friends", "Boutique hotel", "Premium", "Five Nights"]],
  ["NAIROBI & THE MAASAI MARA", "KENYA", "NBO", "country", "Safari / Wildlife / Open skies", "July to October", ["Nature", "Adventure days", "Family", "Couple", "Blowout", "Two Weeks", "Surprise Me"]],
  ["PARIS", "FRANCE", "CDG", "city", "Art / Food / Romance", "April to June or September to October", ["Cities", "Culture", "Food", "Shopping", "Couple", "Honeymoon", "Boutique hotel", "Premium"]],
  ["PROVENCE", "FRANCE", "MRS", "country", "Road trips / Markets / Villa days", "June or September", ["Road Trips", "Slow mornings", "Couple", "Family", "Private villa", "Food", "Shopping", "Premium", "Ten Days"]],
  ["AMALFI COAST", "ITALY", "NAP", "coast", "Ocean / Romance / Long lunches", "May, June, or September", ["Ocean", "Mostly relaxing", "Couple", "Honeymoon", "Beach resort", "Private villa", "Food", "Premium", "Blowout"]],
  ["ROME", "ITALY", "FCO", "culture", "History / Food / Street life", "April to June or September to October", ["Cities", "Culture", "Food", "Couple", "Family", "Boutique hotel", "Premium"]],
  ["FLORENCE", "ITALY", "FLR", "culture", "Art / Wine / Renaissance", "April to June or September to October", ["Culture", "Food", "Couple", "Slow mornings", "Boutique hotel", "Premium"]],
  ["SANTORINI", "GREECE", "JTR", "coast", "Caldera / Romance / Sunsets", "May, June, or September", ["Ocean", "Couple", "Honeymoon", "Mostly relaxing", "Private villa", "Blowout"]],
  ["LISBON", "PORTUGAL", "LIS", "city", "Hills / Food / Atlantic light", "March to June or September to October", ["Cities", "Food", "Couple", "Friends", "Boutique hotel", "Smart value", "Nightlife"]],
  ["BARCELONA", "SPAIN", "BCN", "city", "Design / Beach / Late dinners", "April to June or September to October", ["Cities", "Ocean", "Food", "Nightlife", "Friends", "Couple", "Design hotel"]],
  ["ICELAND RING ROAD", "ICELAND", "KEF", "mountain", "Road trip / Waterfalls / Wild light", "June to September", ["Road Trips", "Nature", "Adventure days", "Friends", "Couple", "One Week", "Two Weeks"]],
  ["LONDON", "UNITED KINGDOM", "LHR", "city", "Culture / Theatre / Neighborhoods", "May to September", ["Cities", "Culture", "Food", "Shopping", "Solo", "Family", "Premium"]],
  ["NEW YORK CITY", "UNITED STATES", "JFK", "city", "Culture / Food / Momentum", "April to June or September to December", ["Cities", "Packed schedule", "Food", "Nightlife", "Shopping", "Solo", "Friends", "Premium"]],
  ["MEXICO CITY", "MEXICO", "MEX", "city", "Food / Art / Design", "October through April", ["Cities", "Packed schedule", "Friends", "Solo", "Design hotel", "Food", "Nightlife", "Shopping", "Smart value"]],
  ["TULUM", "MEXICO", "TQO", "tropical", "Caribbean / Wellness / Ruins", "November to April", ["Ocean", "Mostly relaxing", "Couple", "Friends", "Beach resort", "Nature", "Premium"]],
  ["COSTA RICA", "COSTA RICA", "SJO", "tropical", "Rainforest / Surf / Wildlife", "December to April", ["Nature", "Adventure days", "Ocean", "Family", "Friends", "Private villa", "One Week"]],
  ["RIO DE JANEIRO", "BRAZIL", "GIG", "tropical", "Beach / Music / Mountains", "May through September", ["Surprise Me", "Adventure days", "Friends", "Beach resort", "Nightlife", "Nature", "Mixed"]],
  ["BUENOS AIRES", "ARGENTINA", "EZE", "city", "Food / Architecture / Late nights", "March to May or September to November", ["Cities", "Food", "Nightlife", "Couple", "Friends", "Boutique hotel", "Smart value"]],
  ["PATAGONIA", "ARGENTINA & CHILE", "FTE", "mountain", "Hiking / Glaciers / Vast silence", "November to March", ["Mountains", "Nature", "Adventure days", "Solo", "Friends", "Two Weeks", "Blowout"]],
  ["BANFF", "CANADA", "YYC", "mountain", "Mountains / Lodge / Big views", "Late summer or early fall", ["Mountains", "Adventure days", "Family", "Friends", "Mountain lodge", "Nature", "Comfortable", "One Week"]],
  ["VANCOUVER", "CANADA", "YVR", "coast", "Ocean / Mountains / Food", "May to September", ["Cities", "Ocean", "Mountains", "Food", "Family", "Couple", "Nature"]],
  ["MAUI", "UNITED STATES", "OGG", "tropical", "Beach / Road trips / Soft adventure", "April to May or September to November", ["Ocean", "Mostly relaxing", "Couple", "Family", "Beach resort", "Road Trips", "Premium"]],
  ["SYDNEY", "AUSTRALIA", "SYD", "coast", "Harbor / Beaches / Food", "September to November or March to May", ["Cities", "Ocean", "Food", "Friends", "Couple", "Premium", "One Week"]],
  ["NEW ZEALAND SOUTH ISLAND", "NEW ZEALAND", "CHC", "mountain", "Road trip / Lakes / Adventure", "December to March", ["Road Trips", "Mountains", "Nature", "Adventure days", "Couple", "Friends", "Two Weeks"]],
  ["TAHITI & MOOREA", "FRENCH POLYNESIA", "PPT", "tropical", "Lagoons / Privacy / Island time", "May to October", ["Ocean", "Mostly relaxing", "Couple", "Honeymoon", "Beach resort", "Blowout"]],
];

function estimate(tags) {
  if (tags.includes("Blowout")) return "Luxury trip · compare live options";
  if (tags.includes("Smart value")) return "Smart-value trip · compare live options";
  return "Flexible trip · compare live options";
}

export const destinations = catalog.map(([city, country, airport, photo, style, season, tags]) => ({
  name: `${city}, ${country}`,
  city,
  country,
  airport,
  image: photos[photo],
  price: estimate(tags),
  costs: ["Flights: check live fares", "Stay: check live rooms", "Dining: plan by neighborhood", "Experiences: check live options"],
  nights: tags.includes("Long Weekend") ? "3–4 nights" : tags.includes("Two Weeks") ? "10–14 nights" : "5–8 nights",
  style,
  season,
  tags,
  why: `${city} matches your mix of ${style.toLowerCase()}. It offers a strong base for a trip shaped around your pace, travel companions, and priorities without locking you into unverified prices or availability.`,
  itinerary: [
    `Day 1: Arrive in ${city} and settle in`,
    `Day 2: Signature sights and a neighborhood dinner`,
    `Day 3: A deeper culture, food, or nature day`,
    `Day 4: A flexible experience matched to your pace`,
    `Day 5: Local favorites and an unhurried evening`,
    `Final day: One last walk, meal, and departure`,
  ],
  dining: ["A destination-defining local meal", "A neighborhood favorite", "One memorable reservation-worthy dinner"],
}));

export function scoreDestination(destination, answers) {
  return Object.values(answers || {}).reduce(
    (score, answer) => score + (destination.tags.includes(answer) ? 3 : 0),
    0,
  );
}

export const bookingLinks = {
  stays: "https://www.dpbolvw.net/click-101801755-17293132",
  flights: "https://www.dpbolvw.net/click-101801755-17288982",
  activities: "https://www.dpbolvw.net/click-101801755-17288984",
  cars: "https://www.dpbolvw.net/click-101801755-17314628",
  taxis: "https://www.dpbolvw.net/click-101801755-17322565",
};

export function diningSearchUrl(destination) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`restaurants in ${destination.city}, ${destination.country}`)}`;
}

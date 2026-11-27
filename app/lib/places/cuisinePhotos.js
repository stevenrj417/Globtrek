// A food photo for restaurants that have no photo of their own: a dish of the
// restaurant's cuisine (or, for a plain "restaurant", the country's food), from
// the dish's Wikipedia article on Wikimedia Commons (free licenses, credited).
// Marked imageIsExample so the card and details say it is not this restaurant.
//
// Within one list no photo is used twice: each restaurant takes the first unused
// photo from its cuisine, then from the country's food, then from the general pool.
import cuisinePhotos from "../../data/cuisinePhotos.json" with { type: "json" };

const CATEGORY_RULES = [
  [/bar and grill|sports bar/, "american"],
  [/pizza/, "pizza"],
  [/taco|burrito|tex mex|mexican|southwestern/, "mexican"],
  [/italian/, "italian"],
  [/seafood|oyster|fish and chips/, "seafood"],
  [/steak|argentinian|asado|churrasc/, "steak"],
  [/sushi|ramen|izakaya|japanese|tonkatsu|yakiniku|udon/, "japanese"],
  [/korean/, "korean"],
  [/thai/, "thai"],
  [/vietnamese|pho\b/, "vietnamese"],
  [/chinese|dim sum|cantonese|dumpling|taiwanese|hot pot|noodle/, "chinese"],
  [/indian|sri lankan|pakistani/, "indian"],
  [/indonesian|malaysian|filipino|cambodian|asian/, "southeastasian"],
  [/moroccan/, "moroccan"],
  [/greek/, "greek"],
  [/middle eastern|lebanese|turkish|israeli|persian|falafel|kebab|shawarma|halal|mediterranean/, "middleeastern"],
  [/spanish|tapas|basque|portuguese/, "spanish"],
  [/peruvian|colombian|chilean|brazilian|latin american|south american/, "southamerican"],
  [/caribbean|cuban|jamaican|cajun|soul food/, "caribbean"],
  [/scandinavian|danish|swedish|norwegian|finnish|nordic/, "nordic"],
  [/eastern european|german|bavarian|austrian|polish|czech|hungarian|romanian|ukrainian|swiss|croatian|fondue/, "centraleurope"],
  [/french|bistro|belgian/, "french"],
  [/fine dining/, "finedining"],
  [/vegetarian|vegan/, "vegetarian"],
  [/breakfast|brunch|diner/, "breakfast"],
  [/bakery|dessert/, "bakery"],
  [/cafe|coffee/, "cafe"],
  [/bar\b|pub|brew|lounge|wine/, "bar"],
  [/american|hamburger|burger|barbecue|bbq|chicken|grill|hot dog|sandwich|deli|fast food|gastropub|hawaiian|californian/, "american"],
];

const COUNTRY_CUISINE = {
  mexico: "mexican", italy: "italian", "san marino": "italian", japan: "japanese", thailand: "thai", china: "chinese", "hong kong": "chinese", taiwan: "chinese",
  vietnam: "vietnamese", "south korea": "korean", korea: "korean", india: "indian", "sri lanka": "indian", nepal: "indian", morocco: "moroccan", greece: "greek",
  cyprus: "greek", spain: "spanish", portugal: "spanish", peru: "southamerican", colombia: "southamerican", brazil: "southamerican", chile: "southamerican",
  argentina: "steak", uruguay: "steak", ecuador: "southamerican", bolivia: "southamerican", jamaica: "caribbean", cuba: "caribbean", "dominican republic": "caribbean",
  "puerto rico": "caribbean", bahamas: "caribbean", barbados: "caribbean", "trinidad and tobago": "caribbean", france: "french", belgium: "french",
  germany: "centraleurope", austria: "centraleurope", poland: "centraleurope", "czech republic": "centraleurope", czechia: "centraleurope", hungary: "centraleurope",
  romania: "centraleurope", croatia: "centraleurope", slovenia: "centraleurope", slovakia: "centraleurope", switzerland: "centraleurope", ukraine: "centraleurope",
  denmark: "nordic", sweden: "nordic", norway: "nordic", finland: "nordic", iceland: "nordic", turkey: "middleeastern", türkiye: "middleeastern",
  lebanon: "middleeastern", israel: "middleeastern", jordan: "middleeastern", egypt: "middleeastern", "united arab emirates": "middleeastern", oman: "middleeastern",
  tunisia: "moroccan", indonesia: "southeastasian", malaysia: "southeastasian", singapore: "southeastasian", philippines: "southeastasian", cambodia: "southeastasian",
  laos: "southeastasian", "costa rica": "southamerican", guatemala: "mexican", honduras: "southamerican", nicaragua: "southamerican", "el salvador": "southamerican",
  panama: "southamerican", belize: "caribbean", curaçao: "caribbean", dominica: "caribbean", "saint lucia": "caribbean", grenada: "caribbean",
  "antigua and barbuda": "caribbean", "turks and caicos islands": "caribbean", "cayman islands": "caribbean", martinique: "caribbean", guyana: "caribbean", suriname: "caribbean",
  latvia: "centraleurope", estonia: "centraleurope", lithuania: "centraleurope", bulgaria: "centraleurope", serbia: "centraleurope", "bosnia and herzegovina": "centraleurope",
  "north macedonia": "centraleurope", kosovo: "centraleurope", netherlands: "centraleurope", luxembourg: "french", monaco: "french", montenegro: "greek", albania: "greek",
  georgia: "middleeastern", armenia: "middleeastern", azerbaijan: "middleeastern", qatar: "middleeastern", "saudi arabia": "middleeastern", "faroe islands": "nordic",
  "argentina & chile": "steak", "argentina and brazil": "steak", "malaysia and indonesia": "southeastasian", bhutan: "indian", "united states": "american", usa: "american", canada: "american", "united kingdom": "seafood", ireland: "seafood",
};

// Where to look next when a cuisine's own photos are used up.
const RELATED = {
  pizza: "italian", steak: "american", moroccan: "middleeastern", greek: "middleeastern", nordic: "centraleurope", bakery: "cafe", cafe: "bakery",
  breakfast: "cafe", vegetarian: "middleeastern", finedining: "french", seafood: "spanish", korean: "japanese", vietnamese: "thai", thai: "southeastasian",
  southeastasian: "thai", caribbean: "southamerican", southamerican: "mexican", mexican: "southamerican", italian: "pizza", japanese: "chinese", chinese: "japanese",
};

export const CUISINE_LABELS = {
  mexican: "Mexican food", italian: "Italian food", pizza: "Pizza", seafood: "Seafood", american: "American food", steak: "Steak and grill", french: "French food",
  japanese: "Japanese food", thai: "Thai food", chinese: "Chinese food", vietnamese: "Vietnamese food", korean: "Korean food", indian: "Indian food",
  middleeastern: "Middle Eastern food", moroccan: "Moroccan food", greek: "Greek food", spanish: "Spanish food", southamerican: "South American food",
  caribbean: "Caribbean food", centraleurope: "Central European food", nordic: "Nordic food", cafe: "Coffee and pastries", bakery: "Bakery",
  breakfast: "Breakfast", vegetarian: "Vegetarian food", southeastasian: "Southeast Asian food", bar: "Drinks", finedining: "Fine dining", restaurant: "Restaurant food",
};

export function cuisineOf(item, destination) {
  const category = String(item?.category || "").toLowerCase().replace(/_/g, " ");
  for (const [pattern, cuisine] of CATEGORY_RULES) if (pattern.test(category)) return cuisine;
  const country = String(destination?.country || "").toLowerCase().trim();
  return COUNTRY_CUISINE[country] || "restaurant";
}

// Stable order per place, so the same restaurant tends to keep its photo.
function hash(text) {
  let value = 2166136261;
  for (const char of String(text)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

export function withCuisinePhotos(items, destination) {
  const used = new Set(items.map((item) => item.imageUrl).filter(Boolean));
  const pools = cuisinePhotos.pools || {};
  const countryCuisine = COUNTRY_CUISINE[String(destination?.country || "").toLowerCase().trim()];
  return items.map((item) => {
    if (item.imageUrl) return item;
    const cuisine = cuisineOf(item, destination);
    const order = [cuisine, RELATED[cuisine], countryCuisine, "restaurant", ...Object.keys(pools)].filter((key, index, all) => key && pools[key] && all.indexOf(key) === index);
    for (const key of order) {
      const pool = pools[key];
      const start = hash(item.id || item.googlePlaceId || item.name) % pool.length;
      for (let step = 0; step < pool.length; step += 1) {
        const photo = pool[(start + step) % pool.length];
        if (used.has(photo.url)) continue;
        used.add(photo.url);
        return { ...item, imageUrl: photo.url, imageSourceUrl: photo.page, imageCredit: `${photo.author}, ${photo.license}`, imageProvider: "wikimedia", imageIsExample: true, cuisineLabel: CUISINE_LABELS[key] || "Restaurant food", exampleDish: photo.dish };
      }
    }
    return item;
  });
}

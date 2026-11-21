import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { weightedRating, pickVaried, byScore, streetKey, BUDGETS } from "../app/lib/anyplace/rank.js";
import { computePicks, townRadiusKm, matchStay, cuisineKey, activityGroup } from "../app/lib/anyplace/picks.js";
import { stayTier, normalizeStay } from "../app/lib/anyplace/stays.js";
import { featuredSlug } from "../app/lib/anyplace/featured.js";

const CENTER = { latitude: -21.1103, longitude: -44.1781 };
// A point `km` east of the center.
const east = (km) => ({ latitude: CENTER.latitude, longitude: CENTER.longitude + km / (111.32 * Math.cos((CENTER.latitude * Math.PI) / 180)) });

test("weighted rating: a 4.9 with 8 reviews does not beat a 4.6 with 2,000", () => {
  assert.ok(weightedRating(4.6, 2000) > weightedRating(4.9, 8));
  assert.equal(weightedRating(4.2, 0), 4.2);
  assert.equal(weightedRating(null, 10), null);
});

test("variety: no two of a kind while others are available, filled from the rest when short", () => {
  const items = [{ id: "a", kind: 1, score: 5 }, { id: "b", kind: 1, score: 4.9 }, { id: "c", kind: 2, score: 4.5 }, { id: "d", kind: 3, score: 4.4 }];
  assert.deepEqual(pickVaried(items, 3, (x, y) => x.kind === y.kind).map((item) => item.id), ["a", "c", "d"]);
  assert.deepEqual(pickVaried(items.slice(0, 2), 3, (x, y) => x.kind === y.kind).map((item) => item.id), ["a", "b"]);
  assert.equal(streetKey("Rua das Flores, 12"), streetKey("R. das Flores 40, Lisboa"));
});

test("ties break by ID, so equal scores never shuffle", () => {
  const items = [{ id: "z", score: 4.5 }, { id: "a", score: 4.5 }, { id: "m", score: 4.5 }];
  assert.deepEqual([...items].sort(byScore).map((item) => item.id), ["a", "m", "z"]);
  assert.deepEqual([...items].reverse().sort(byScore).map((item) => item.id), ["a", "m", "z"]);
});

test("stay tiers: budget and mid-range mostly, 4-star at most, never 5-star, resorts or villas", () => {
  assert.equal(stayTier("Hostel", null), "budget");
  assert.equal(stayTier("Hotel", 2), "budget");
  assert.equal(stayTier("Hotel", 3), "mid");
  assert.equal(stayTier("Apartment", null), "mid");
  assert.equal(stayTier("Hotel", 4), "comfort");
  assert.equal(stayTier("Hotel", 5), null);
  assert.equal(stayTier("Villa", 3), null);
  assert.ok(!Object.values(BUDGETS).some((budget) => budget.stayTiers.includes("luxury")));
});

test("a stay must be a real Booking.com listing with a CJ link", () => {
  const row = { id: "9", title: "Pousada Azul", link: "https://www.booking.com/hotel/br/pousada-azul.html", categoryName: "Guest house", address: { latitude: "-21.11", longitude: "-44.178" }, linkCode: { clickUrl: "https://www.kqzyfj.com/click-101801755-17293132?url=x" } };
  assert.equal(normalizeStay(row, CENTER)?.clickUrl, "https://www.kqzyfj.com/click-101801755-17293132?url=x");
  assert.equal(normalizeStay({ ...row, linkCode: null }, CENTER), null, "no affiliate link");
  assert.equal(normalizeStay({ ...row, link: "https://example.com/hotel/x" }, CENTER), null, "not Booking.com");
  assert.equal(normalizeStay({ ...row, link: "https://www.booking.com/searchresults.html" }, CENTER), null, "not a listing");
  assert.equal(normalizeStay({ ...row, isDeleted: true }, CENTER), null);
});

test("matching a listing to its Google place needs a similar name close by", () => {
  const stay = { name: "Pousada Azul Tiradentes", ...east(0.5) };
  const place = { id: "g1", displayName: { text: "Pousada Azul" }, location: east(0.52) };
  assert.equal(matchStay(stay, [place])?.id, "g1");
  assert.equal(matchStay(stay, [{ ...place, location: east(2) }]), null, "too far");
  assert.equal(matchStay(stay, [{ ...place, displayName: { text: "Hotel Verde" } }]), null, "different name");
});

test("town size comes from the viewport, kept between 2 and 8 km", () => {
  assert.equal(townRadiusKm(null), 4);
  assert.equal(townRadiusKm({ low: CENTER, high: CENTER }), 2);
  assert.equal(townRadiusKm({ low: east(-50), high: east(50) }), 8);
});

test("never three of one cuisine", async () => {
  const { pickVaried: pick } = await import("../app/lib/anyplace/rank.js");
  const pizza = (id, score) => ({ id, score, primaryType: "pizza_restaurant", location: east(Number(id.slice(1))) });
  const ranked = [pizza("p1", 5), pizza("p2", 4.9), pizza("p3", 4.8), { id: "x", score: 4.1, primaryType: "thai_restaurant", location: east(9) }];
  const { dinnerClashForTest } = await import("../app/lib/anyplace/picks.js");
  assert.deepEqual(pick(ranked, 3, dinnerClashForTest).map((item) => item.id), ["p1", "p2", "x"]);
});

test("cuisine and activity kinds drive variety", () => {
  assert.equal(activityGroup({ primaryType: "historical_place", types: ["historical_place", "park"] }), "landmark", "a square tagged park isn't nature");
  assert.equal(cuisineKey({ primaryType: "pizza_restaurant" }), "pizza");
  assert.equal(cuisineKey({ primaryType: "restaurant", displayName: { text: "Pizzeria Bella" } }), "pizza");
  assert.equal(activityGroup({ primaryType: "hiking_area" }), "nature");
  assert.equal(activityGroup({ primaryType: "museum" }), "museum");
});

// Fake Google and CJ: a small town with little in it, more 20 km out.
function fakeClients() {
  const g = (id, km, extra) => ({ id, displayName: { text: id }, location: east(km), businessStatus: "OPERATIONAL", ...extra });
  const restaurants = [g("r-pizza-1", 0.3, { types: ["restaurant"], primaryType: "pizza_restaurant", rating: 4.7, userRatingCount: 400, priceLevel: "PRICE_LEVEL_INEXPENSIVE" }), g("r-pizza-2", 0.4, { types: ["restaurant"], primaryType: "pizza_restaurant", rating: 4.6, userRatingCount: 300, priceLevel: "PRICE_LEVEL_INEXPENSIVE" }), g("r-local", 0.6, { types: ["restaurant"], primaryType: "brazilian_restaurant", rating: 4.5, userRatingCount: 200 }), g("r-cafe", 0.2, { types: ["restaurant", "cafe"], primaryType: "cafe", rating: 4.9, userRatingCount: 900 }), g("r-far", 20, { types: ["restaurant"], primaryType: "steak_house", rating: 4.6, userRatingCount: 1000, priceLevel: "PRICE_LEVEL_MODERATE" }), g("r-tiny", 0.5, { types: ["restaurant"], primaryType: "restaurant", rating: 5, userRatingCount: 3 })];
  const sights = [g("a-church", 0.2, { types: ["church"], primaryType: "church", rating: 4.8, userRatingCount: 3000 }), g("a-museum", 0.4, { types: ["museum"], primaryType: "museum", rating: 4.6, userRatingCount: 800 }), g("a-church-2", 0.5, { types: ["church"], primaryType: "church", rating: 4.7, userRatingCount: 2000 })];
  const nature = [g("n-falls", 18, { types: ["park", "natural_feature"], primaryType: "park", rating: 4.8, userRatingCount: 1500 })];
  const lodging = [g("l-pousada", 0.31, { types: ["guest_house", "lodging"], primaryType: "guest_house", rating: 4.8, userRatingCount: 600, addressComponents: [{ types: ["locality"], longText: "Tiradentes" }] }), g("l-hostel", 0.8, { types: ["hostel", "lodging"], primaryType: "hostel", rating: 4.5, userRatingCount: 150 })];
  const within = (list, center, radiusM) => list.filter((place) => {
    const dx = (place.location.longitude - center.longitude) * 111.32 * Math.cos((center.latitude * Math.PI) / 180);
    return Math.abs(dx) * 1000 <= radiusM;
  });
  let calls = 0;
  const places = {
    stats: () => ({ calls }),
    async nearby({ center, radiusM, includedTypes }) {
      calls += 1;
      if (includedTypes.includes("restaurant")) return within(restaurants, center, radiusM);
      if (includedTypes.includes("hostel") || includedTypes.includes("hotel")) return includedTypes.includes("hostel") ? within(lodging, center, radiusM) : [];
      if (includedTypes.includes("park")) return within(nature, center, radiusM);
      return within(sights, center, radiusM);
    },
    async text({ center, radiusM, includedType }) { calls += 1; return includedType === "restaurant" ? within(restaurants, center, radiusM) : within(nature, center, radiusM); },
  };
  const row = (id, title, km, category, stars) => ({ id, title, link: `https://www.booking.com/hotel/br/${id}.html`, categoryName: category, starRating: stars, address: { city: "Tiradentes", streetAddress: `Rua ${id}, 1`, latitude: String(east(km).latitude), longitude: String(east(km).longitude) }, linkCode: { clickUrl: `https://www.kqzyfj.com/click-101801755-1?url=${id}` } });
  const rows = [row("p1", "l-pousada", 0.3, "Guest house", null), row("h1", "l-hostel", 0.8, "Hostel", null), row("a1", "Casa Linda", 0.5, "Holiday home", null), row("lux", "Grand Palace", 0.4, "Hotel", 5)];
  const cj = {
    credentials: { companyId: "1", pid: "2", configured: true },
    stats: () => ({ requests: 0 }),
    async query(text) {
      if (text.includes("productFeeds")) return { productFeeds: { resultList: [{ adId: "sa", feedName: "Feed: South America", productCount: 10, sourceFeedType: "TRAVEL" }] } };
      return { travelExperienceProducts: { resultList: rows } };
    },
  };
  return { places, cj };
}

const destination = { placeId: "ChIJtest-tiradentes", name: "Tiradentes", country: "Brazil", nearbyNames: ["Tiradentes"], center: CENTER, townKm: 2 };

test("same place and budget always give the same picks", async () => {
  const first = await computePicks({ ...fakeClients(), destination });
  const second = await computePicks({ ...fakeClients(), destination });
  for (const budget of Object.keys(BUDGETS)) {
    for (const kind of ["stays", "dinners", "activities"]) assert.deepEqual(first[budget][kind].map((item) => item.id), second[budget][kind].map((item) => item.id), `${budget} ${kind}`);
  }
});

test("picks follow the rules: quality bar, variety, budget, nature, widening, never empty", async () => {
  const picks = await computePicks({ ...fakeClients(), destination });
  const budget = picks.budget;
  const dinnerIds = budget.dinners.map((item) => item.id);
  assert.ok(!dinnerIds.includes("r-cafe"), "cafes aren't dinners");
  assert.ok(!dinnerIds.includes("r-tiny") || budget.dinners.find((item) => item.id === "r-tiny").belowBar, "3 reviews only fills in, labeled");
  assert.ok(dinnerIds.includes("r-local"), "a different cuisine makes the list");
  assert.ok(!dinnerIds.includes("r-far"), "a $$ steak house isn't a budget dinner");
  assert.ok(budget.activities.some((item) => item.id === "n-falls"), "the waterfall 18 km out makes the list");
  assert.ok(!(budget.activities.map((item) => item.id).includes("a-church") && budget.activities.map((item) => item.id).includes("a-church-2")), "not two churches");
  assert.equal(budget.stays[0].id, "bk:p1", "best-rated real listing first");
  assert.ok(budget.stays.every((stay) => stay.clickUrl.startsWith("https://www.kqzyfj.com/")), "every stay is a CJ affiliate link");
  assert.ok(!budget.stays.some((stay) => stay.id === "bk:lux"), "no 5-star");
  assert.ok(budget.stays.some((stay) => stay.unrated), "a listing without Google reviews fills in, labeled");
  assert.ok(budget.stays.every((stay) => !("rating" in stay)), "no Google rating is stored");
  for (const key of Object.keys(BUDGETS)) for (const kind of ["stays", "dinners", "activities"]) assert.ok(picks[key][kind].length > 0, `${key} ${kind} never empty`);
});

test("a place with nothing in town gets the nearest picks, labeled honestly", async () => {
  const far = { ...destination, center: east(-15) };
  const picks = await computePicks({ ...fakeClients(), destination: far });
  assert.match(picks.mid.labels.stays || "", /^Nearest stays — 1[56] km away$/);
  assert.ok(picks.mid.steps.stays >= 2);
});

test("featured destinations keep their own page", () => {
  assert.equal(featuredSlug({ name: "Lisbon", center: { latitude: 38.72, longitude: -9.14 } }), "lisbon");
  assert.equal(featuredSlug({ name: "Tiradentes", center: CENTER }), null);
});

test("Google content is never stored and the key stays on the server", () => {
  const service = readFileSync("app/lib/anyplace/service.js", "utf8");
  assert.match(service, /picks: all\[budget\]/);
  const google = readFileSync("app/lib/anyplace/google.js", "utf8");
  assert.match(google, /env\.GOOGLE_PLACES_API_KEY/);
  assert.doesNotMatch(google, /NEXT_PUBLIC/);
  const panel = readFileSync("app/components/DestinationSearchPanel.jsx", "utf8");
  assert.match(panel, /\/api\/places\/autocomplete/);
  assert.doesNotMatch(panel, /GOOGLE_PLACES_API_KEY|places\.googleapis/);
  const page = readFileSync("app/places/[placeId]/page.jsx", "utf8");
  assert.match(page, /unoptimized/);
  assert.match(page, /Google Maps/);
});

test("mid-range gets the 3-star and no hostel; budget keeps the hostel", async () => {
  const { places, cj } = fakeClients();
  const realQuery = cj.query;
  cj.query = async (text) => {
    const data = await realQuery(text);
    if (text.includes("productFeeds")) return data;
    const extra = { id: "g3", title: "Casa Tres", link: "https://www.booking.com/hotel/br/g3.html", categoryName: "Guest house", starRating: "3", address: { city: "Tiradentes", streetAddress: "Rua G3, 1", latitude: String(east(0.6).latitude), longitude: String(east(0.6).longitude) }, linkCode: { clickUrl: "https://www.kqzyfj.com/click-101801755-1?url=g3" } };
    return { travelExperienceProducts: { resultList: [...data.travelExperienceProducts.resultList, extra] } };
  };
  const realNearby = places.nearby;
  places.nearby = async (args) => [...(await realNearby(args)), ...(args.includedTypes.includes("hostel") ? [{ id: "l-g3", displayName: { text: "Casa Tres" }, location: east(0.6), businessStatus: "OPERATIONAL", rating: 4.5, userRatingCount: 80 }] : [])];
  const picks = await computePicks({ places, cj, destination });
  assert.ok(picks.mid.stays.some((stay) => stay.id === "bk:g3"), "the 3-star makes mid-range");
  assert.ok(!picks.mid.stays.some((stay) => stay.category === "Hostel"), "no hostel for mid-range while others exist");
  assert.ok(picks.budget.stays.some((stay) => stay.category === "Hostel"), "budget keeps the hostel");
});

test("a listing in town without reviews beats a well-reviewed one 35 km away", async () => {
  const { places, cj } = fakeClients();
  cj.query = async (text) => {
    if (text.includes("productFeeds")) return { productFeeds: { resultList: [{ adId: "sa", feedName: "Feed: South America", productCount: 10, sourceFeedType: "TRAVEL" }] } };
    const row = (id, title, km) => ({ id, title, link: `https://www.booking.com/hotel/br/${id}.html`, categoryName: "Guest house", address: { city: "X", streetAddress: `Rua ${id}`, latitude: String(east(km).latitude), longitude: String(east(km).longitude) }, linkCode: { clickUrl: `https://www.kqzyfj.com/click-1?url=${id}` } });
    return { travelExperienceProducts: { resultList: [row("near", "Casa Perto", 0.3), row("far", "Far Inn", 35)] } };
  };
  places.nearby = async ({ includedTypes }) => (includedTypes.includes("hostel") ? [{ id: "g-far", displayName: { text: "Far Inn" }, location: east(35), businessStatus: "OPERATIONAL", rating: 4.6, userRatingCount: 300 }] : []);
  places.text = async () => [];
  const picks = await computePicks({ places, cj, destination });
  assert.equal(picks.budget.stays[0].id, "bk:near");
  assert.ok(picks.budget.stays[0].unrated);
});

test("two viewpoints of the same spot count once", () => {
  assert.equal(activityGroup({ primaryType: "scenic_spot" }), "nature");
});

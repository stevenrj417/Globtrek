// Free facts for a curated restaurant or sight, filling what the saved Google
// check left blank: a price level ($ to $$$$, or Free), a one-line "what it
// is", and a Wikipedia introduction when Wikidata links one.
//
// Sources, all free: Wikidata (app/data/placeWikidata.json, from
// scripts/places/fetch-wikidata-facts.mjs) and the kind of place. A price read
// from the kind of place is labeled as typical for that kind, never as the
// place's own price; a fee Wikidata lists is labeled as such.
import placeWikidata from "../../data/placeWikidata.json" with { type: "json" };
import placeAbout from "../../data/placeAbout.json" with { type: "json" };

// Rough USD value of one unit, only to pick $/$$/$$$ (Wikidata currency IDs).
const USD = { Q4917: 1, Q4916: 1.08, Q25224: 1.27, Q25344: 1.13, Q8146: 0.0067, Q177882: 0.028, Q4730: 0.055, Q131016: 0.043, Q123213: 0.25, Q47190: 0.0027, Q25417: 0.145, Q122922: 0.095, Q132643: 0.093, Q259502: 0.65, Q1104069: 0.72, Q39099: 0.14, Q80524: 0.012, Q172872: 0.03, Q173117: 0.18, Q199578: 0.001, Q192090: 0.00004, Q41588: 0.000063, Q202040: 0.00072, Q1472704: 0.27, Q200294: 0.084, Q4597: 0.6, Q181907: 0.054, Q209792: 0.0094, Q203722: 0.0049, Q4608: 0.027 };
const SYMBOL = { Q4917: "$", Q4916: "€", Q25224: "£", Q8146: "¥", Q177882: "฿" };

// What a ticket usually costs for this kind of place. Order matters: the first
// match wins, so "amusement park" is paid before "park" is free.
const KINDS = [
  [/amusement park|theme park|water ?park|ski (resort|area)|adventure sports/, "$$$", "Paid entry, usually over $50"],
  [/\bzoo\b|aquarium|observation deck|ferris wheel|cable car|wildlife park|safari park|opera|theat(er|re)|concert hall|performing arts|go.?kart|bowling|amusement cent(er|re)|escape room/, "$$", "Paid entry, usually $20–50"],
  [/museum|castle|palace|fortress|\bfort\b|citadel|botanical garden|historic house|archaeological site|ruins|lighthouse|tower|winery|vineyard|brewery|distillery|\bcave\b|\bspa\b|public bath|thermal|onsen|stadium|arena/, "$", "Paid entry, usually under $20"],
  [/church|cathedral|basilica|mosque|temple|shrine|synagogue|monastery|chapel|abbey|place of worship/, "Free–$", "Usually free to enter; some charge visitors"],
  [/national park|state park|national (monument|reserve)|provincial park|nature reserve|protected area/, "$", "Park entry fee often charged"],
  [/park|garden|plaza|square|scenic|viewpoint|lookout|bridge|fountain|monument|memorial|sculpture|statue|beach|market|street|promenade|boardwalk|neighbou?rhood|district|hiking|trail|picnic|playground|pier|waterfront|shopping (center|centre|mall)|\bmall\b|mountain|\blake\b|waterfall|river|cliff|\bhill\b|wildlife refuge|preserve|casino|art gallery|city hall/, "Free", "Free to visit"],
];
// Google's catch-all categories say nothing about entry; use Wikidata's kind.
const VAGUE = /^(tourist attraction|historical landmark|historical place|landmark|cultural landmark|point of interest|establishment|service|store)$/i;

function kindPrice(text) {
  for (const [pattern, sign, label] of KINDS) if (pattern.test(text)) return { sign, label, basis: "kind" };
  return null;
}

function feePrice(fee) {
  if (!fee) return null;
  if (fee.amount === 0) return { sign: "Free", label: "Free entry", basis: "wikidata" };
  const rate = USD[fee.unit];
  if (!rate) return null;
  const usd = fee.amount * rate;
  const sign = usd < 20 ? "$" : usd <= 50 ? "$$" : "$$$";
  const amount = Number.isInteger(fee.amount) ? fee.amount.toLocaleString("en-US") : fee.amount.toFixed(2);
  return { sign, label: `Entry ${SYMBOL[fee.unit] ? `${SYMBOL[fee.unit]}${amount}` : `about $${Math.round(usd)}`}`, basis: "wikidata" };
}

// Restaurants whose kind says the price: fine dining is a splurge, a bakery isn't.
const RESTAURANT_KINDS = [
  [/fine dining/, "$$$$", "Fine dining"],
  [/steak ?house|oyster bar/, "$$$", "Usually pricier"],
  [/cafe|café|coffee|bakery|snack bar|fast food|food court|sandwich|kebab|falafel|shawarma|noodle shop|hot dog|\bdeli\b|takeaway|meal delivery|food store|convenience|taco|burrito|dumpling/, "$", "Usually inexpensive"],
];

export function placeFacts(item, kind) {
  const wikidata = item?.googlePlaceId ? placeWikidata.facts?.[item.googlePlaceId] : null;
  const facts = {};

  if (kind === "restaurant") {
    if (!item.priceLevel && !item.priceRange) {
      const text = String(item.category || "").toLowerCase();
      const match = RESTAURANT_KINDS.find(([pattern]) => pattern.test(text));
      if (match) facts.priceInfo = { sign: match[1], label: match[2], basis: "kind" };
    }
  } else if (item.tier === "ticketed") {
    // Known to need a ticket: add how much, when the kind says it.
    const known = [item.category, wikidata?.description, ...(wikidata?.classes || [])].filter(Boolean).join(" ").replace(/_/g, " ").toLowerCase();
    const paid = feePrice(wikidata?.fee) || kindPrice(known);
    if (paid && /^\$+$/.test(paid.sign)) facts.priceInfo = paid;
  } else if (!item.tier && !item.isFree) {
    const category = String(item.category || "").replace(/_/g, " ").toLowerCase();
    const known = [wikidata?.description, ...(wikidata?.classes || [])].filter(Boolean).join(" ").toLowerCase();
    // Wikidata's kind first (Google calls Bangkok's Sanam Luang square a state
    // park), but when Google's kind needs a ticket or a temple visit and
    // Wikidata's says free, warn rather than promise free entry.
    const fromWikidata = known ? kindPrice(known) : null;
    const fromGoogle = category && !VAGUE.test(category) ? kindPrice(category) : null;
    const googleStronger = fromGoogle && fromWikidata?.sign === "Free" && fromGoogle.sign !== "Free" && !/^Park/.test(fromGoogle.label);
    facts.priceInfo = feePrice(wikidata?.fee) || (googleStronger ? fromGoogle : fromWikidata || fromGoogle) || null;
  }
  if (facts.priceInfo) facts.priceSign = facts.priceInfo.sign;

  if (wikidata?.description && !item.description) {
    const line = wikidata.description.trim();
    facts.description = `${line.charAt(0).toUpperCase()}${line.slice(1)}${/[.!?]$/.test(line) ? "" : "."}`;
    facts.descriptionSource = `https://www.wikidata.org/wiki/${wikidata.qid}`;
  }
  if (!item.about && wikidata?.article) {
    const about = String(placeAbout.about?.[wikidata.article] || "").replace(/\s*\[[^\]]*\],?/g, "").replace(/:\s*,/g, ":").replace(/\(\s*[;,]?\s*\)/g, "").replace(/ {2,}/g, " ");
    if (about) {
      facts.about = about;
      facts.aboutSourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikidata.article.replace(/ /g, "_"))}`;
    }
  }
  return facts;
}

export const withPlaceFacts = (items, kind) => items.map((item) => ({ ...item, ...placeFacts(item, kind) }));

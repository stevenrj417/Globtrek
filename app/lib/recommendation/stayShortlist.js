// Three meaningfully different stays for a trip:
//   Our pick    the strongest overall match
//   Best value  the best fit for the lodging budget
//   Upgrade     a step up in comfort or privacy
//
// Built from catalog facts (property type, rooms, amenities, accessibility,
// location, data freshness, identity) plus a price only when one is trustworthy
// (see stayPrice.js). A property without a price is never called "within budget".
// Fewer than three trustworthy properties → fewer cards and a plain explanation.

import { bookingPath, stayPrice } from "../pricing/stayPrice.js";

const TYPE_RANK = { Hostel: 1, "Capsule hotel": 1, Motel: 2, "Guest house": 2, "Bed and breakfast": 3, Inn: 3, Lodge: 3, Hotel: 4 };
const CALM_TYPES = new Set(["Guest house", "Bed and breakfast", "Inn"]);
const SOCIAL = /bar|nightclub|pub crawl|happy hour|games room|karaoke/i;
const ACCESSIBLE = /wheelchair|accessible|step-free|roll-in|elevator|lift/i;
const DAY = 86400000;

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

function distanceKm(a, b) {
  if (![a?.latitude, a?.longitude, b?.latitude, b?.longitude].every(Number.isFinite)) return null;
  const rad = Math.PI / 180;
  const h = Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function stayType(property) {
  if (property.dorms || property.priceTier === "hostel") return property.category && property.category !== "Hotel" ? property.category : "Hostel";
  return property.category || (property.priceTier === "budget" ? "Hotel" : "Hotel");
}

function comfortRank(property) {
  const type = TYPE_RANK[stayType(property)] || 3;
  return type + (Number(property.starRating) || 0) * 0.6 + (property.dorms ? -1 : 0);
}

function hasAmenity(property, pattern) {
  return (property.amenities || []).some((amenity) => pattern.test(amenity));
}

export function isAccessible(property) {
  return (property.accessibility || []).some((item) => ACCESSIBLE.test(item)) || hasAmenity(property, /wheelchair accessible|facilities for disabled/i);
}

// Merge records that are the same Booking.com property; hand-verified details win.
export function mergeCandidates(groups) {
  const byPath = new Map();
  for (const property of groups.flat()) {
    const key = bookingPath(property.bookingUrl) || `${property.name}`.toLowerCase();
    const existing = byPath.get(key);
    byPath.set(key, existing ? { ...property, ...existing, photos: existing.photos?.length ? existing.photos : property.photos, amenities: existing.amenities?.length ? existing.amenities : property.amenities, accessibility: existing.accessibility?.length ? existing.accessibility : property.accessibility, roomTypes: existing.roomTypes?.length ? existing.roomTypes : property.roomTypes } : property);
  }
  return [...byPath.values()].filter((property) => property.name && bookingPath(property.bookingUrl));
}

export function scoreStay(property, { profile, destination, price, accessibleOnly = false, now = Date.now() }) {
  const travelers = profile.travelers;
  const type = stayType(property);
  const lodging = profile.lodging || "either";
  const typeFit = lodging === "hostel" ? (property.dorms ? 100 : type === "Hostel" ? 70 : 25)
    : lodging === "private" ? (property.dorms && !(property.roomTypes || []).some((room) => !/dorm|shared|bunk|bed in/i.test(room)) ? 15 : 95)
      : profile.spendStyle === "comfortable" ? (property.dorms ? 20 : TYPE_RANK[type] >= 3 ? 95 : 75)
      : profile.spendStyle === "value" ? (property.dorms ? 60 : TYPE_RANK[type] <= 3 ? 90 : 75)
        : property.dorms ? 90 : TYPE_RANK[type] <= 2 ? 85 : 65;
  const groupFit = travelers >= 3 ? (Number(property.maxGuests) >= travelers || property.dorms ? 90 : 55) : travelers === 1 ? (property.dorms ? 90 : 70) : 80;
  const calm = profile.relaxationPreference === "high";
  const energetic = profile.relaxationPreference === "low";
  const social = hasAmenity(property, SOCIAL);
  const paceFit = calm ? (CALM_TYPES.has(type) ? 95 : social ? 35 : 65) : energetic ? (social || property.dorms ? 95 : 60) : 75;
  const amenityFit = clamp(40 + (property.catalogFreeWifi ? 15 : 0) + (property.catalogFreeBreakfast ? 15 : 0) + (property.catalogFreeCancellation ? 15 : 0) + (hasAmenity(property, /24-hour front desk/i) ? 8 : 0) + (hasAmenity(property, /air conditioning/i) ? 7 : 0));
  const distance = distanceKm(property, destination);
  const locationFit = distance === null ? (property.verified ? 85 : 65) : clamp(100 - Math.max(0, distance - 1.5) * 9);
  const completeness = clamp(((property.photos?.length || (property.image ? 1 : 0)) >= 3 ? 30 : 10) + ((property.amenities?.length || 0) >= 5 ? 25 : 10) + (property.address ? 20 : 0) + (property.roomTypes?.length ? 15 : 0) + (Number.isFinite(property.latitude) ? 10 : 0));
  const updated = Date.parse(property.dataUpdatedAt || property.importedAt || property.verifiedAt || "");
  const ageDays = Number.isFinite(updated) ? (now - updated) / DAY : null;
  const freshness = ageDays === null ? 50 : ageDays <= 14 ? 100 : ageDays <= 60 ? 75 : 45;
  const identity = property.verified ? 100 : property.source === "catalog" ? 85 : clamp((Number(property.identityConfidence) || 0.6) * 100);
  const accessibility = accessibleOnly ? (isAccessible(property) ? 100 : 0) : 70;
  const allowance = profile.includedBudgetCategories?.hotel === false ? null : Number(profile.hotelBudget) || null;
  const budgetFit = price.kind === "unavailable" || !allowance ? 55 : price.total <= allowance ? 100 : clamp(100 - ((price.total - allowance) / allowance) * 120);
  // Booking.com scores are out of 10, Google's out of 5; unknown is neutral.
  const rating = Number(property.rating);
  const reviews = Number.isFinite(rating) && rating > 0 ? clamp(rating > 5 ? (rating - 5) * 20 : (rating - 2.5) * 40) : 50;
  const score = typeFit * 0.2 + groupFit * 0.07 + paceFit * 0.07 + amenityFit * 0.08 + locationFit * 0.11 + completeness * 0.07 + freshness * 0.05 + identity * 0.09 + accessibility * 0.05 + budgetFit * 0.14 + reviews * 0.07;
  return { score: Math.round(score), distanceKm: distance === null ? null : Math.round(distance * 10) / 10, budgetFit, typeFit };
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function whyLine(choice, role, profile) {
  const facts = [];
  const privateRooms = (choice.roomTypes || []).some((room) => !/dorm|shared|bunk|bed in/i.test(room));
  if (choice.dorms && !(profile.lodging === "private" && privateRooms)) facts.push("dorm beds");
  else if (choice.dorms) facts.push("private rooms as well as dorms");
  else facts.push(`private ${stayType(choice).toLowerCase() === "hotel" ? "hotel rooms" : "rooms"}`);
  if (choice.catalogFreeBreakfast) facts.push("breakfast on some rates");
  if (choice.catalogFreeWifi) facts.push("free Wi-Fi");
  if (choice.distanceKm !== null && choice.distanceKm !== undefined && choice.distanceKm <= 3) facts.push(`${choice.distanceKm} km from the center`);
  const list = facts.slice(0, 3).join(", ");
  const who = profile.travelers === 1 ? "a solo trip" : profile.travelers === 2 ? "two travelers" : `a group of ${profile.travelers}`;
  if (role === "Our pick") return `Best overall fit for ${who}: ${list}.`;
  if (role === "Best value") return choice.price.kind === "unavailable" ? `A simpler, usually lower-cost style of stay (${list}); check the current price on Booking.com.` : `Lowest estimated stay cost on this list: ${list}.`;
  return choice.price.kind === "unavailable" ? `A step up in comfort and privacy (${list}); price not available, so check it on Booking.com.` : `A step up in comfort and privacy (${list}) for ${plural(profile.tripLength, "night")}.`;
}

export function buildStayShortlist({ candidates, profile, destination, budgetPlan, accessibleOnly = false, now = Date.now() }) {
  const month = budgetPlan?.lodging?.month ?? null;
  const context = { ...profile, hotelBudget: budgetPlan?.hotelBudget };
  const pool = mergeCandidates([candidates]).map((property) => {
    const price = stayPrice(property, { airport: destination.airport, nights: profile.tripLength, travelers: profile.travelers, month, privateRoom: profile.lodging === "private" || budgetPlan?.lodging?.unit === "room" });
    return { ...property, price, ...scoreStay(property, { profile: context, destination, price, accessibleOnly, now }) };
  }).filter((property) => !accessibleOnly || isAccessible(property));
  const ranked = [...pool].sort((a, b) => b.score - a.score || Number(Boolean(b.verified)) - Number(Boolean(a.verified)) || a.name.localeCompare(b.name));
  const choices = [];
  const pick = ranked[0];
  if (pick) choices.push({ ...pick, role: "Our pick" });
  const rest = () => ranked.filter((property) => !choices.some((choice) => choice.bookingUrl === property.bookingUrl));
  const priced = rest().filter((property) => property.price.kind !== "unavailable").sort((a, b) => a.price.total - b.price.total);
  const valueByType = rest().filter((property) => property.typeFit >= 50).sort((a, b) => (Number(b.budgetScore) || 0) - (Number(a.budgetScore) || 0) || comfortRank(a) - comfortRank(b) || b.score - a.score);
  const value = priced[0] && (!pick || pick.price.kind === "unavailable" || priced[0].price.total <= pick.price.total * 1.25) ? priced[0] : valueByType.find((property) => stayType(property) !== stayType(pick || {})) || valueByType[0];
  if (value) choices.push({ ...value, role: "Best value" });
  const base = pick ? comfortRank(pick) : 0;
  const ceiling = budgetPlan?.hotelBudget > 0 ? budgetPlan.hotelBudget * 1.3 : Infinity;
  // An upgrade is private (no dorms, hostels or capsules) and a step above the pick.
  const upgrades = rest().filter((property) => !property.dorms && property.priceTier !== "hostel" && (TYPE_RANK[stayType(property)] || 3) >= 2 && comfortRank(property) > base && (property.price.kind === "unavailable" || property.price.total <= Math.max(ceiling, (pick?.price.total || 0) * 1.8)));
  const upgrade = upgrades.find((property) => stayType(property) !== stayType(pick || {})) || upgrades[0];
  if (upgrade) choices.push({ ...upgrade, role: "Upgrade" });
  const finished = choices.map((choice) => ({ ...choice, why: whyLine(choice, choice.role, profile) }));
  const notice = finished.length >= 3 ? null : finished.length
    ? `Only ${plural(finished.length, "stay")} here ${finished.length === 1 ? "meets" : "meet"} GlobTrek's standard for this trip${accessibleOnly ? " with accessibility details listed" : ""}. We'd rather show fewer than pad the list.`
    : accessibleOnly ? "No stay here lists accessibility features in Booking.com's catalog. Check accessibility details directly on Booking.com." : "No stay here meets GlobTrek's standard yet.";
  return { choices: finished, notice, considered: pool.length };
}

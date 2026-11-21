import assert from "node:assert/strict";
import test from "node:test";
import { destinations } from "../app/data/destinations.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";
import { buildBudgetPlan } from "../app/lib/recommendation/budgetEngine.js";
import { buildStayShortlist } from "../app/lib/recommendation/stayShortlist.js";
import { nightlyLine } from "../app/lib/format.js";

const lisbon = destinations.find((item) => item.id === "LIS" || item.airport === "LIS");
const profileFor = (hotel, guests) => normalizeTravelerProfile({ tripStart: "2027-02-01", tripEnd: "2027-02-06", guestCount: String(guests), answers: { hotel, spendStyle: "value" } });
const stay = (id, extra = {}) => ({ id, name: `Stay ${id}`, bookingUrl: `https://www.booking.com/hotel/pt/${id}.html`, source: "catalog", importedAt: "2026-11-20", photos: ["https://cf.bstatic.com/a.jpg"], amenities: [], ...extra });

test("a whole place is one booking for the group, priced per bedroom needed", () => {
  const rooms = buildBudgetPlan(profileFor("Private room", 5), lisbon).lodging;
  const home = buildBudgetPlan(profileFor("Whole place", 5), lisbon).lodging;
  assert.equal(home.unit, "home");
  assert.equal(home.units, 1);
  assert.equal(home.bedrooms, 3, "five people need three bedrooms");
  assert.equal(home.perNight, rooms.perNight, "same as the rooms it replaces: no made-up rental discount");
  assert.equal(home.priceKind, "home_estimate");
  assert.equal(nightlyLine(home.perUnit, "home"), `$${home.perUnit.toLocaleString("en-US")} a night for the whole place`);
});

test("asking for a whole place picks houses and apartments that sleep the group", () => {
  const profile = profileFor("Whole place", 4);
  const budgetPlan = buildBudgetPlan(profile, lisbon);
  const candidates = [
    stay("hostel", { category: "Hostel", dorms: true, roomTypes: ["Bed in 6-bed dorm"] }),
    stay("hotel3", { category: "Hotel", starRating: 3 }),
    stay("flat2", { category: "Apartment", bedrooms: 2, maxGuests: 4 }),
    stay("house3", { category: "Holiday home", bedrooms: 3, maxGuests: 6 }),
    stay("tiny", { category: "Apartment", bedrooms: 1, maxGuests: 2 }),
  ];
  const { choices } = buildStayShortlist({ candidates, profile, destination: lisbon, budgetPlan });
  assert.ok(["flat2", "house3"].includes(choices[0].id), "our pick sleeps everyone");
  assert.ok(choices.every((choice) => !choice.dorms), "never a dorm");
  assert.match(choices[0].why, /^Whole place/);
});

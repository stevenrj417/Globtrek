import test from "node:test";
import assert from "node:assert/strict";
import perDiemLodging from "../app/data/pricing/perDiemLodging.json" with { type: "json" };
import { destinations } from "../app/data/destinations.js";
import { buildBudgetPlan } from "../app/lib/recommendation/budgetEngine.js";
import { normalizeTravelerProfile } from "../app/lib/recommendation/travelerProfile.js";

const byId = (id) => destinations.find((item) => item.id === id);

test("per diem rates are 12 positive nightly prices with a source and area", () => {
  const entries = Object.entries(perDiemLodging);
  assert.ok(entries.length >= 500, `${entries.length} destinations`);
  for (const [id, rate] of entries) {
    assert.equal(rate.lodgingByMonth.length, 12, id);
    assert.ok(rate.lodgingByMonth.every((night) => Number.isFinite(night) && night > 0), id);
    assert.ok(["gsa", "state_department"].includes(rate.source), id);
    assert.ok(["city", "rate_area", "country_other", "state_standard"].includes(rate.matchType), id);
    assert.ok(rate.area, id);
  }
});

test("a town is never priced at its country's capital rate", () => {
  for (const id of ["sayulita-41937", "boquete-1e36b", "vang-vieng-7998b", "interlaken-77dcd", "alula-6f49c"]) {
    const rate = perDiemLodging[id];
    if (!rate) continue;
    assert.equal(rate.matchType, "country_other", `${id} matched ${rate.area}`);
  }
});

test("Key West carries GSA's seasonal rate as the standard hotel and the room's seasonal shape", () => {
  const keyWest = byId("key-west-76868");
  const months = keyWest.planningAverages.monthly;
  assert.deepEqual(months.map((month) => month.standardHotelNight), perDiemLodging["key-west-76868"].lodgingByMonth);
  assert.equal(keyWest.planningAverages.standardHotel.source, "gsa");
  assert.equal(keyWest.planningAverages.seasonality.source, "government_lodging_rates");
  // GSA's Key West peak is February to April; the good-value room follows it.
  assert.ok(months[2].hotelNight > months[6].hotelNight, "March costs more than July");
});

test("a comfortable US trip prices the room at no less than the GSA rate", () => {
  const keyWest = byId("key-west-76868");
  const profile = normalizeTravelerProfile({ origin: "JFK", budget: 6000, travelers: 1, tripLength: 4, spendStyle: "comfortable", travelMonth: "2027-03" });
  const plan = buildBudgetPlan(profile, keyWest);
  const month = plan.lodging?.month || 3;
  const gsa = perDiemLodging["key-west-76868"].lodgingByMonth[month - 1];
  assert.ok(plan.lodging.perUnit >= gsa, `${plan.lodging.perUnit} vs GSA ${gsa}`);
});

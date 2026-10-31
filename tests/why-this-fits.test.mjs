import test from "node:test";
import assert from "node:assert/strict";
import { whyThisFits } from "../app/lib/recommendation/whyThisFits.js";

const lisbon = { city: "LISBON", style: "Hills / Food / Atlantic light", tags: ["Cities", "Food", "Couple", "Smart value"] };

test("explains a result with only the answers the trip matches", () => {
  const text = whyThisFits({
    answers: { alive: "Cities", escape: "Balanced days", luxury: "Food" },
    exactBudget: 2500,
    budgetPlan: { withinHardBudget: true, estimatedTripAverage: 2140 },
    trip: lisbon,
  });
  assert.equal(text, "Lisbon matches city life and your focus on food, with a typical estimate of $2,140 against your $2,500 budget. Known for hills, food and Atlantic light.");
});

test("does not claim a setting the trip lacks", () => {
  const text = whyThisFits({ answers: { alive: "Ocean" }, exactBudget: 0, trip: { city: "MARRAKECH", style: "Riads / Markets / Design", tags: ["Culture", "Shopping"] } });
  assert.doesNotMatch(text, /coast/);
  assert.match(text, /^Marrakech is the closest fit to your answers\./);
});

test("never mentions the budget when the estimate is over it", () => {
  const text = whyThisFits({ answers: {}, exactBudget: 900, budgetPlan: { withinHardBudget: false, estimatedTripAverage: 1200 }, trip: lisbon });
  assert.doesNotMatch(text, /budget/);
});

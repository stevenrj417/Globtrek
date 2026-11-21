import test from "node:test";
import assert from "node:assert/strict";
import { SLEEP_OPTIONS, sleepBand } from "../app/lib/quiz/sleepOptions.js";

test("the sleep question follows the budget", () => {
  assert.equal(sleepBand({ exactBudget: 500, duration: "One Week" }), "tight");
  assert.equal(sleepBand({ exactBudget: 1500, duration: "One Week" }), "middle");
  assert.equal(sleepBand({ exactBudget: 5000, duration: "One Week" }), "roomy");
  assert.equal(sleepBand({ exactBudget: 700, duration: "Long Weekend" }), "middle");
  assert.equal(sleepBand({}), "tight", "no budget yet");
  assert.equal(sleepBand({ exactBudget: 300, duration: "One Week", includedBudgetCategories: { hotel: false } }), "middle", "lodging paid separately");
  assert.ok(!SLEEP_OPTIONS.roomy.some((option) => option.label === "Hostel bed"), "big budgets aren't offered a hostel bed");
  assert.ok(SLEEP_OPTIONS.tight.some((option) => option.display === "Cheap private room"));
  for (const options of Object.values(SLEEP_OPTIONS)) assert.ok(options.every((option) => ["Whatever's cheapest", "Hostel bed", "Private room"].includes(option.label)), "answers keep the values the engine knows");
});

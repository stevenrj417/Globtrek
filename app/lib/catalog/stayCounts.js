// The small per-destination summary of the feed snapshot that the browser
// reads: how many stays, how many with dorm beds, and how many are budget
// properties (hostels, capsule hotels, motels, simple guest houses, inns and
// B&Bs, and hotels of two stars or fewer). The budget count is the evidence
// that a cheap room exists there at all.
const BUDGET_ALWAYS = new Set(["Hostel", "Capsule hotel", "Motel"]);
const BUDGET_SIMPLE = new Set(["Guest house", "Bed and breakfast", "Inn", "Homestay"]);

export function isBudgetStay(stay) {
  const stars = Number(stay.starRating) || 0;
  if (BUDGET_ALWAYS.has(stay.category) || stay.dorms) return true;
  if (BUDGET_SIMPLE.has(stay.category)) return stars <= 3;
  return stars > 0 && stars <= 2;
}

export function stayCounts(snapshot) {
  const entries = Object.entries(snapshot.stays || {}).sort(([a], [b]) => a.localeCompare(b));
  const pick = (test) => Object.fromEntries(entries.map(([id, stays]) => [id, stays.filter(test).length]).filter(([, count]) => count));
  return {
    checkedAt: snapshot.checkedAt,
    counts: Object.fromEntries(entries.map(([id, stays]) => [id, stays.length])),
    dorms: pick((stay) => stay.dorms),
    budget: pick(isBudgetStay),
  };
}

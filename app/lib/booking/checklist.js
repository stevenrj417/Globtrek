const ORDER = ["hotel", "flight", "experience", "restaurant"];

// What goes on the booking checklist: the stay, the flight, bookable activities,
// and restaurants only when they take reservations online. https links only.
export function checklistItems(entries) {
  return entries
    .filter((entry) => entry.type !== "restaurant" || entry.reservation)
    .filter((entry) => /^https:\/\//.test(entry.exactUrl || ""))
    .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
}

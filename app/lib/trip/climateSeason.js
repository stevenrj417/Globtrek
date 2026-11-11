// Best months to visit from monthly climate averages (NASA POWER, 2001–2025):
// mean temperature t2m (°C) and precipitation (mm/day) for January–December.
//
// Pleasant: mean 12–25 °C and under 4 mm of rain a day. Where fewer than three
// months are pleasant (tropics, deserts, far north), the drier-than-average
// months between 5 and 30 °C count instead. Avoid: monsoon-level rain (over 8 mm a day), mean
// heat over 33 °C, or mean cold under −8 °C.

const NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function climateMonths({ t2m, precip }) {
  if (!Array.isArray(t2m) || t2m.length !== 12 || !Array.isArray(precip) || precip.length !== 12) return null;
  const months = [...Array(12).keys()];
  let best = months.filter((index) => t2m[index] >= 12 && t2m[index] <= 25 && precip[index] < 4);
  let basis = "mild and fairly dry";
  if (best.length < 3) {
    const mean = precip.reduce((sum, value) => sum + value, 0) / 12;
    best = months.filter((index) => precip[index] <= mean && t2m[index] >= 5 && t2m[index] <= 30);
    basis = "driest months";
  }
  if (!best.length) {
    const warmest = Math.max(...t2m);
    best = months.filter((index) => t2m[index] >= warmest - 4);
    basis = "warmest months";
  }
  const avoid = months.filter((index) => precip[index] > 8 || t2m[index] > 33 || t2m[index] < -8).map((index) => index + 1);
  return { best: best.map((index) => index + 1), avoid: avoid.filter((month) => !best.includes(month)), basis };
}

// "May to October" or "April to June, or September to October", wrapping the year.
export function monthRanges(months) {
  if (!months.length) return "";
  if (months.length === 12) return "Year-round";
  const set = new Set(months);
  const runs = [];
  for (let month = 1; month <= 12; month += 1) {
    if (!set.has(month) || set.has(month === 1 ? 12 : month - 1)) continue;
    let end = month;
    while (set.has(end === 12 ? 1 : end + 1) && (end === 12 ? 1 : end + 1) !== month) end = end === 12 ? 1 : end + 1;
    runs.push(end === month ? NAMES[month - 1] : `${NAMES[month - 1]} to ${NAMES[end - 1]}`);
  }
  return runs.length > 1 ? `${runs.slice(0, -1).join(", ")}, or ${runs[runs.length - 1]}` : runs[0];
}

export function climateSeason(climate) {
  const result = climateMonths(climate || {});
  if (!result) return null;
  return { ...result, text: monthRanges(result.best) };
}

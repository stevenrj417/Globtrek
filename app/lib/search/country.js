// "PT" → "Portugal". Falls back to the code itself.
const regionNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
export function countryName(code) {
  try { return /^[A-Z]{2}$/.test(code || "") ? regionNames?.of(code) || code : code || ""; } catch { return code || ""; }
}

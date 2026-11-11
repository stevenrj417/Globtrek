import airalo from "../../data/airaloEsims.json" with { type: "json" };

// Optional eSIM suggestion for international trips, from Airalo's product feed.
// Only plans valid for the whole trip are offered: the cheapest, and the
// cheapest with at least 5 GB when that's a different plan.

const slug = (value) => String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ALIASES = { "north-macedonia": "macedonia", "puerto-rico": "puerto-rico-us" };

export function esimCountry(countryName) {
  const key = slug(countryName);
  return airalo.countries?.[ALIASES[key] || key] || null;
}

export function esimPlans(countryName, nights, { homeCountry } = {}) {
  const country = esimCountry(countryName);
  if (!country || (homeCountry && slug(homeCountry) === slug(countryName))) return [];
  const needed = Math.max(1, Number(nights) || 1) + 1;
  const valid = country.plans.filter((plan) => plan.days >= needed).sort((a, b) => a.price - b.price || a.days - b.days);
  const cheapest = valid[0];
  const roomy = valid.find((plan) => plan.unlimited || plan.gb >= 5);
  return [cheapest, roomy && roomy.id !== cheapest?.id ? roomy : null].filter(Boolean).map((plan) => ({ ...plan, country: country.name, checkedAt: airalo.checkedAt }));
}

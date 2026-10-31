// Tiny cookie-based A/B helper. Every flag ships off; turn one on by giving it
// variants and a non-zero `enabled`, then read it with variantFor().
export const FLAGS = Object.freeze({
  heroHeadline: { enabled: false, variants: ["control"] },
  heroCta: { enabled: false, variants: ["control"] },
  tripCard: { enabled: false, variants: ["control"] },
});

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function variantFor(flag, random = Math.random) {
  const config = FLAGS[flag];
  if (!config?.enabled || config.variants.length < 2) return "control";
  const cookie = `gt_flag_${flag}`;
  const existing = readCookie(cookie);
  if (existing && config.variants.includes(existing)) return existing;
  const variant = config.variants[Math.floor(random() * config.variants.length)];
  if (typeof document !== "undefined") document.cookie = `${cookie}=${encodeURIComponent(variant)}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  return variant;
}

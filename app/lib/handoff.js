import { track } from "./analytics.js";

// Partner hosts the /go interstitial is allowed to forward to. Anything else is refused,
// so /go can never be used as an open redirect.
const PARTNER_HOSTS = ["booking.com", "kqzyfj.com", "dpbolvw.net", "anrdoezrs.net", "jdoqocy.com", "tkqlhce.com", "qksrv.net"];

export function isPartnerUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && PARTNER_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

// Affiliate links wrap the partner URL in ?url=; read trip context from whichever layer has it.
export function handoffContext(value) {
  try {
    const outer = new URL(value);
    const inner = outer.searchParams.get("url") ? new URL(outer.searchParams.get("url")) : outer;
    const params = inner.searchParams;
    return {
      checkin: params.get("checkin"),
      checkout: params.get("checkout"),
      adults: Number(params.get("group_adults")) || null,
    };
  } catch {
    return { checkin: null, checkout: null, adults: null };
  }
}

export function handoffHref({ url, partner = "Booking.com", name = "" }) {
  return `/go?${new URLSearchParams({ to: url, partner, name }).toString()}`;
}

// Click handler for outbound partner links. The anchor keeps its real href, so if the
// new tab is blocked or JS fails, the browser simply follows the link as normal.
export function openHandoff(event, { url, partner = "Booking.com", name = "", position, hotelId }) {
  track("outbound_click", { partner, position, hotel_id: hotelId });
  if (!isPartnerUrl(url) || event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
  // "noopener" would make window.open return null, so open normally and cut the opener by hand.
  const tab = window.open(handoffHref({ url, partner, name }), "_blank");
  if (!tab) return;
  tab.opener = null;
  event.preventDefault();
}

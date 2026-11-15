import ResultsClient from "../../results/ResultsClient";
import { openShareToken } from "../../lib/results/shareToken";
import { destinations } from "../../data/destinations";
import { nightsBetween } from "../../lib/trip/schedule";
import { sizedPhoto } from "../../lib/format";

// A shared trip's short link. It shows the same trip page as /results?s=…, and
// gives link previews (iMessage, WhatsApp, Slack) the real destination, length,
// estimate and photo instead of the generic site card.
const TOKEN = /^v1\.[A-Za-z0-9_-]{20,16000}$/;

function titleCase(value) {
  return String(value || "").toLowerCase().replace(/(^|[\s&'(-])\p{L}/gu, (letter) => letter.toUpperCase());
}

function shareSummary(token) {
  if (!TOKEN.test(token || "")) return null;
  const opened = openShareToken(token);
  if (opened.error || !opened.payload) return null;
  const { quiz = {}, destination: id, snapshot } = opened.payload;
  const place = destinations.find((item) => (item.id || item.airport) === id);
  if (!place) return null;
  const city = titleCase(place.city);
  const country = titleCase(place.country);
  const nights = nightsBetween(quiz.tripStart, quiz.tripEnd) || Number(quiz.tripNights) || null;
  const total = Number(snapshot?.estimate?.total) > 0 ? Math.round(snapshot.estimate.total) : null;
  const travelers = Math.max(1, Number(quiz.guestCount) || 1);
  const parts = [nights ? `${nights} ${nights === 1 ? "night" : "nights"}` : null, total ? `about $${total.toLocaleString("en-US")}` : null].filter(Boolean);
  return {
    title: `${city} trip${parts.length ? ` · ${parts.join(" · ")}` : ""}`,
    description: `A ${city}, ${country} trip for ${travelers} ${travelers === 1 ? "traveler" : "travelers"}, planned on GlobTrek. Prices are estimates; the booking sites confirm the final price.`,
    image: place.image ? sizedPhoto(place.image, 1280) : null,
    alt: place.imageAlt || `${city}, ${country}`,
  };
}

export async function generateMetadata({ params }) {
  const { token } = await params;
  const summary = shareSummary(token);
  const robots = { index: false, follow: false };
  if (!summary) return { title: "Shared trip", robots };
  const images = summary.image ? [{ url: summary.image, alt: summary.alt }] : null;
  return {
    title: summary.title,
    description: summary.description,
    robots,
    openGraph: { type: "website", siteName: "GlobTrek", title: summary.title, description: summary.description, ...(images ? { images } : {}) },
    twitter: { card: images ? "summary_large_image" : "summary", title: summary.title, description: summary.description, ...(images ? { images: images.map((image) => image.url) } : {}) },
  };
}

export default async function SharedTripPage({ params }) {
  const { token } = await params;
  return <ResultsClient shareToken={TOKEN.test(token || "") ? token : null} />;
}

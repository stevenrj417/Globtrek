import { photoData } from "../../lib/ogImage.jsx";
import { sharedRateLimit } from "../../lib/security/rateLimit.js";
import { renderStory, STORY_STYLES } from "../../lib/share/storyImage.jsx";
import { storyPhoto } from "../../lib/share/storyPhoto.js";
import { cleanLine, storyText } from "../../lib/share/storyText.js";

export const runtime = "nodejs";

// GET /api/story: a 1080 x 1920 PNG share story. Everything on it comes from the
// query string (no account data), and the photo is chosen here from freely
// licensed sources only: callers can't pass an image URL.
//   s style · n place · c country · r region · t headline · dep/ret dates ·
//   today the traveler's date · cd=0 no countdown · dt=1 show dates ·
//   co=1 country only · dest quiz destination id · ll "lat,lng"
export async function GET(request) {
  const limited = await sharedRateLimit(request, { name: "story", limit: 20 });
  if (limited) return limited;
  const url = new URL(request.url);
  const q = (key) => url.searchParams.get(key) || "";
  const style = Object.hasOwn(STORY_STYLES, q("s")) ? q("s") : "minimal";
  const [lat, lng] = q("ll").split(",").map(Number);
  const point = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { latitude: lat, longitude: lng } : {};
  const name = cleanLine(q("n"), 40);
  const country = cleanLine(q("c"), 40);
  const destinationId = /^[a-z0-9-]{1,60}$/.test(q("dest")) ? q("dest") : null;

  const chosen = await storyPhoto({ destinationId, name, country, region: cleanLine(q("r"), 40), ...point }).catch(() => null);
  const photo = chosen ? await photoData(chosen.local ? new URL(chosen.url, url.origin).toString() : chosen.url) : null;
  const text = storyText({
    name, country,
    departure: q("dep"), returnDate: q("ret"), today: q("today"),
    headline: q("t"), showCountdown: q("cd") !== "0", showDate: q("dt") === "1", countryOnly: q("co") === "1",
    credit: photo && !chosen?.local ? chosen.credit : null,
  });
  const image = await renderStory({ style, photo, text });
  // Same query, same picture for the day; "today" is in the query, so it rolls over.
  image.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  image.headers.set("Content-Disposition", `inline; filename="globtrek-story-${(name || "trip").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png"`);
  return image;
}

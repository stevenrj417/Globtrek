import { destinations } from "../../data/destinations.js";

// The photo behind a share story. A story is downloaded and posted, so it may use
// only photos licensed for that: Wikimedia Commons under Creative Commons or
// public domain (credited on the image), or Unsplash (free to use). Never Google
// Places photos (their terms don't allow it) and never Booking.com's.
const HEADERS = { "User-Agent": "GlobTrekStories/1.0 (https://www.glob-trek.com/contact)" };
const FREE = /^(CC0|CC BY|CC-BY|Public domain|PD)/i;

const strip = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function json(url) {
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000), next: { revalidate: 86400 * 7 } });
  if (!response.ok) throw new Error(`wiki_${response.status}`);
  return response.json();
}

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// A Commons file's license and a 1080px-wide copy, or null when it isn't free to reuse.
export async function commonsPhoto(fileName, width = 1080) {
  const data = await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=${width}&titles=${encodeURIComponent(`File:${fileName}`)}`);
  const page = Object.values(data?.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  const meta = info?.extmetadata || {};
  const license = meta.LicenseShortName?.value;
  if (!info?.thumburl || !license || !FREE.test(license) || (info.width || 0) < 800) return null;
  if ((info.height || 0) > (info.width || 0) * 2.2) return null; // too narrow to crop well
  const artist = strip(meta.Artist?.value).split(/;|Camera location/)[0].trim().slice(0, 60) || null;
  return { url: info.thumburl, credit: [artist, license].filter(Boolean).join(" · "), source: info.descriptionurl };
}

// The lead photo of the place's Wikipedia article, when the article is really
// about this place (within 60 km of it, when we know where it is).
export async function wikipediaPhoto({ name, region, country, latitude, longitude }) {
  const query = [name, region, country].filter(Boolean).join(" ");
  if (!name) return null;
  const data = await json(`https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=10&gsrsearch=${encodeURIComponent(query)}&prop=pageimages|coordinates&piprop=name`);
  const pages = Object.values(data?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  const here = Number.isFinite(latitude) && Number.isFinite(longitude) ? { lat: latitude, lon: longitude } : null;
  for (const page of pages) {
    if (!page.pageimage) continue;
    const point = page.coordinates?.[0];
    if (here && (!point || distanceKm(here, point) > 60)) continue;
    // Without coordinates, only an article titled for the place itself ("Tiradentes"
    // or "Tiradentes, Minas Gerais"), never one that merely mentions it ("Palácio Tiradentes").
    if (!here) {
      const title = String(page.title || "").toLowerCase();
      const place = String(name).toLowerCase().split(",")[0].trim();
      if (!page.coordinates?.length || (title !== place && !title.startsWith(`${place},`) && !title.startsWith(`${place} (`))) continue;
    }
    const photo = await commonsPhoto(page.pageimage).catch(() => null);
    if (photo) return photo;
  }
  return null;
}

const FALLBACKS = [
  { url: "/quiz/v2/ocean.jpg", credit: "Atrani, Amalfi Coast" },
  { url: "/quiz/v2/mountains.jpg", credit: "Lago di Carezza, Dolomites" },
  { url: "/quiz/v2/cities.jpg", credit: "Paris from above" },
];

// destinationId: a quiz destination (its own licensed hero photo). Otherwise the
// place's Wikipedia photo, then a GlobTrek photo so a story always has one.
export async function storyPhoto({ destinationId, name, region, country, latitude, longitude }) {
  const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  const known = destinationId ? destinations.find((item) => item.id === destinationId) : name ? destinations.find((item) => same(item.city, name) && (!country || same(item.country, country))) : null;
  if (known?.image && /^https:\/\/(upload\.wikimedia\.org|images\.unsplash\.com)\//.test(known.image)) {
    const commons = known.image.match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/);
    if (commons) {
      const photo = await commonsPhoto(decodeURIComponent(commons[1])).catch(() => null);
      if (photo) return photo;
    } else {
      return { url: `${known.image.split("?")[0]}?w=1080&h=1920&fit=crop&fm=jpg&q=80`, credit: "Unsplash" };
    }
  }
  const wiki = await wikipediaPhoto({ name: name || known?.city, region, country: country || known?.country, latitude: latitude ?? known?.latitude, longitude: longitude ?? known?.longitude }).catch(() => null);
  if (wiki) return wiki;
  const index = [...String(name || "")].reduce((sum, character) => sum + character.charCodeAt(0), 0) % FALLBACKS.length;
  return { ...FALLBACKS[index], local: true };
}

// Food photos for restaurants without their own photo: the lead photo of each
// dish's English Wikipedia article (free licenses only, via Wikimedia Commons;
// no key, no cost). Lead photos show the dish itself, unlike a keyword search.
// Writes scripts/places/cuisine-candidates.json for review; the reviewed set is
// app/data/cuisinePhotos.json (scripts/places/build-cuisine-photos.mjs).
//   node scripts/places/fetch-cuisine-candidates.mjs
import { writeFile } from "node:fs/promises";

const UA = "GlobTrekPhotoMatcher/1.1 (https://www.glob-trek.com)";
// Wikipedia article titles, a handful of well-known dishes per cuisine.
export const CUISINE_DISHES = {
  mexican: ["Taco", "Enchilada", "Mole (sauce)", "Chilaquiles", "Pozole", "Guacamole", "Tamale", "Quesadilla", "Chiles en nogada", "Elote", "Tostada (tortilla)", "Al pastor"],
  italian: ["Spaghetti", "Risotto", "Lasagna", "Tagliatelle", "Carbonara", "Ravioli", "Gnocchi", "Tiramisu", "Bruschetta", "Ossobuco", "Pesto", "Caprese salad"],
  pizza: ["Pizza", "Pizza Margherita", "Neapolitan pizza", "Pizza marinara"],
  seafood: ["Oyster", "Fish and chips", "Grilled fish", "Moules-frites", "Seafood boil", "Lobster roll", "Cioppino", "Bouillabaisse", "Shrimp and grits", "Clam chowder"],
  american: ["Hamburger", "Barbecue in the United States", "Fried chicken", "Pancake", "Macaroni and cheese", "Buffalo wing", "Cheeseburger", "Hot dog", "Pulled pork", "Apple pie"],
  steak: ["Steak", "Asado", "Ribeye steak", "T-bone steak", "Steak frites", "Churrasco"],
  french: ["Coq au vin", "Ratatouille", "Crème brûlée", "French onion soup", "Croque monsieur", "Bœuf bourguignon", "Quiche", "Crêpe", "Escargot", "Tarte Tatin", "Cassoulet"],
  japanese: ["Sushi", "Ramen", "Tempura", "Sashimi", "Yakitori", "Udon", "Okonomiyaki", "Tonkatsu", "Donburi", "Gyoza"],
  thai: ["Pad thai", "Green curry", "Tom yum", "Som tam", "Massaman curry", "Khao soi", "Pad see ew", "Mango sticky rice"],
  chinese: ["Dim sum", "Jiaozi", "Peking duck", "Mapo tofu", "Xiaolongbao", "Kung Pao chicken", "Char siu", "Chow mein", "Hot pot", "Wonton"],
  vietnamese: ["Pho", "Bánh mì", "Bún chả", "Gỏi cuốn", "Bún bò Huế", "Cơm tấm", "Bánh xèo", "Cao lầu"],
  korean: ["Bibimbap", "Korean barbecue", "Kimchi", "Tteok-bokki", "Bulgogi", "Japchae", "Kimchi-jjigae", "Samgyeopsal"],
  indian: ["Biryani", "Thali", "Butter chicken", "Dosa (food)", "Chicken tikka masala", "Naan", "Palak paneer", "Samosa", "Chana masala", "Tandoori chicken", "Idli"],
  middleeastern: ["Hummus", "Falafel", "Meze", "Shawarma", "Kebab", "Tabbouleh", "Baba ghanoush", "Shakshouka", "Manakish", "Baklava"],
  moroccan: ["Tajine", "Couscous", "Pastilla", "Harira", "Mechoui"],
  greek: ["Greek salad", "Souvlaki", "Moussaka", "Gyros", "Spanakopita", "Tzatziki", "Dolma", "Pastitsio"],
  spanish: ["Tapas", "Paella", "Jamón ibérico", "Patatas bravas", "Spanish omelette", "Gazpacho", "Churro", "Pintxo", "Croquette"],
  southamerican: ["Ceviche", "Empanada", "Arepa", "Feijoada", "Lomo saltado", "Picanha", "Anticucho", "Pão de queijo", "Bandeja paisa"],
  caribbean: ["Jerk (cooking)", "Tostones", "Rice and peas", "Mofongo", "Ackee and saltfish", "Ropa vieja", "Conch fritters"],
  centraleurope: ["Wiener schnitzel", "Pierogi", "Goulash", "Borscht", "Sauerkraut", "Bratwurst", "Spätzle", "Pretzel", "Apfelstrudel", "Svíčková"],
  nordic: ["Smørrebrød", "Gravlax", "Cinnamon roll", "Swedish meatballs", "Herring as food", "Kanelbulle"],
  cafe: ["Cappuccino", "Croissant", "Espresso", "Latte art", "Caffè latte", "Flat white", "Pain au chocolat"],
  bakery: ["Bread", "Pastry", "Sourdough", "Baguette", "Danish pastry", "Bagel", "Brioche"],
  breakfast: ["Eggs Benedict", "Full breakfast", "Avocado toast", "French toast", "Waffle", "Huevos rancheros", "Omelette"],
  vegetarian: ["Salad", "Buddha bowl", "Falafel", "Vegetable soup", "Grain bowl", "Stuffed peppers", "Poke (dish)"],
  southeastasian: ["Nasi goreng", "Satay", "Laksa", "Rendang", "Nasi lemak", "Adobo", "Hainanese chicken rice", "Gado-gado"],
  bar: ["Cocktail", "Beer", "Margarita", "Mojito", "Negroni", "Wine", "Old fashioned (cocktail)"],
  finedining: ["Haute cuisine", "Amuse-bouche", "Tasting menu", "Foie gras", "Beef Wellington", "Soufflé", "Carpaccio"],
  restaurant: ["Roast chicken", "Soup", "Roasted vegetables", "Grilled cheese", "Fish taco", "Meatball", "Pasta", "Burrito", "Club sandwich", "Pot roast", "Chicken parmigiana", "Stew"],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getJson(url) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } }).catch(() => null);
    if (response?.ok) return response.json();
    await sleep(Math.max(Number(response?.headers.get("retry-after")) || 0, 2 ** attempt) * 1000);
  }
  return null;
}
const plain = (value) => String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = {};
  for (const [cuisine, dishes] of Object.entries(CUISINE_DISHES)) {
    out[cuisine] = [];
    const pages = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&pilicense=free&redirects=1&titles=${encodeURIComponent(dishes.join("|"))}`);
    const files = Object.values(pages?.query?.pages || {}).filter((page) => page.pageimage).map((page) => ({ dish: page.title, file: page.pageimage }));
    if (!files.length) continue;
    const info = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1200&iiextmetadatafilter=Artist|LicenseShortName&titles=${encodeURIComponent(files.map((item) => `File:${item.file}`).join("|"))}`);
    const byFile = {};
    for (const page of Object.values(info?.query?.pages || {})) byFile[page.title.replace(/^File:/, "").replace(/ /g, "_")] = page.imageinfo?.[0];
    for (const { dish, file } of files) {
      const image = byFile[file.replace(/ /g, "_")];
      const license = plain(image?.extmetadata?.LicenseShortName?.value);
      if (!image || image.width < 800 || /\.svg$/i.test(file) || !license || /fair use|non-free/i.test(license) || (/GFDL/i.test(license) && !/CC|public domain/i.test(license))) continue;
      out[cuisine].push({ dish, url: String(image.thumburl || image.url).replace(/^https:\/\/thumb\.wikimedia\.org\//, "https://upload.wikimedia.org/").replace(/\?.*$/, ""), page: image.descriptionurl, author: plain(image.extmetadata?.Artist?.value).slice(0, 80) || "Wikimedia Commons", license, width: image.width, height: image.height });
    }
    console.log(cuisine, out[cuisine].length);
    await sleep(400);
  }
  await writeFile(new URL("./cuisine-candidates.json", import.meta.url), `${JSON.stringify(out, null, 1)}\n`);
}

import { destinations as catalog } from "../../data/destinations";
import { displayName } from "../../data/trending";

const destinations = {
  KIX: { name: "Kyoto", answers: { alive: "Culture", escape: "Balanced days", hotel: "Traditional inn", luxury: "Culture" } },
  NAP: { name: "Amalfi Coast", answers: { alive: "Ocean", escape: "Mostly relaxing", hotel: "Beach resort", luxury: "Food" } },
  YYC: { name: "Banff", answers: { alive: "Mountains", escape: "Adventure days", hotel: "Mountain lodge", luxury: "Nature" } },
  MEX: { name: "Mexico City", answers: { alive: "Cities", escape: "Balanced days", hotel: "Boutique hotel", luxury: "Food" } },
  HAN: { name: "Hanoi", answers: { alive: "Culture", escape: "Balanced days", hotel: "Boutique hotel", luxury: "Food" } },
  LIS: { name: "Lisbon", answers: { alive: "Cities", escape: "Slow mornings", hotel: "Boutique hotel", luxury: "Food" } },
};
// Any catalog destination can be planned; the ones above keep their hand-set answers.
export function destinationFor(id) {
  if (destinations[id]) return destinations[id];
  const item = id ? catalog.find((entry) => entry.id === id) : null;
  if (!item) return null;
  const tags = item.tags || [];
  return { name: displayName(item.city), answers: { alive: tags.includes("Ocean") ? "Ocean" : tags.includes("Mountains") ? "Mountains" : tags.includes("Culture") ? "Culture" : "Cities", escape: "Balanced days", hotel: "Boutique hotel", luxury: tags.includes("Food") ? "Food" : tags.includes("Nature") ? "Nature" : "Culture" } };
}

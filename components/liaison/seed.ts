import type { House } from "./types";

// 10 OG Houses. Names + accent colours; OL and OG names are placeholders to edit.
const HOUSES: { name: string; color: string }[] = [
  { name: "Khiljis", color: "#D85503" },
  { name: "Vikings", color: "#3D66A9" },
  { name: "Romans", color: "#8F3410" },
  { name: "Mongols", color: "#2A5290" },
  { name: "Ottomans", color: "#4B8FB3" },
  { name: "Spartans", color: "#7D848F" },
  { name: "Samurai", color: "#E58A4E" },
  { name: "Seljuks", color: "#1B3155" },
  { name: "Mughals", color: "#B8860B" },
  { name: "Achaeans", color: "#4FB49A" },
];

const OGS_PER_HOUSE = 9;

export function seedHouses(): House[] {
  return HOUSES.map((h, hi) => ({
    id: `house-${hi + 1}`,
    name: h.name,
    color: h.color,
    ol: `OL — ${h.name}`,
    ogs: Array.from({ length: OGS_PER_HOUSE }, (_, gi) => ({
      id: `house-${hi + 1}-og-${gi + 1}`,
      name: `OG ${gi + 1}`,
      group: gi + 1,
    })),
  }));
}

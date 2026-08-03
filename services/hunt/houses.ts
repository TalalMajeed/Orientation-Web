// The 10 OG Houses, same names/colors used across the site (Liaison, etc).
// Kept as a small self-contained constant here rather than imported from the
// Liaison feature — Hunt has its own real backend and shouldn't couple to a
// client-only, locally-stored feature for something this core.
export interface HuntHouse {
  id: string;
  name: string;
  color: string;
}

export const HUNT_HOUSES: HuntHouse[] = [
  { id: "house-1", name: "Khiljis", color: "#D85503" },
  { id: "house-2", name: "Vikings", color: "#3D66A9" },
  { id: "house-3", name: "Romans", color: "#8F3410" },
  { id: "house-4", name: "Mongols", color: "#2A5290" },
  { id: "house-5", name: "Ottomans", color: "#4B8FB3" },
  { id: "house-6", name: "Spartans", color: "#7D848F" },
  { id: "house-7", name: "Samurai", color: "#E58A4E" },
  { id: "house-8", name: "Seljuks", color: "#1B3155" },
  { id: "house-9", name: "Mughals", color: "#B8860B" },
  { id: "house-10", name: "Achaeans", color: "#4FB49A" },
];

export function findHouse(houseId: string): HuntHouse | null {
  return HUNT_HOUSES.find((h) => h.id === houseId) ?? null;
}

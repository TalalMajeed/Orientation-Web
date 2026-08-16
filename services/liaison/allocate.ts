import type { Config, Gender, House, LogEntry, Student } from "./types";

// Gender-balanced allocation: snake-distribute each gender across houses (keeps
// house sizes + gender ratios even), then round-robin each gender into the
// house's OG groups. Respects an optional per-house capacity.
export function allocate(
  students: Student[],
  houses: House[],
  config: Config
): { students: Student[]; log: LogEntry[] } {
  const log: LogEntry[] = [];
  const houseIds = houses.map((h) => h.id);
  const cap = config.houseCapacity;
  const counts: Record<string, number> = Object.fromEntries(houseIds.map((id) => [id, 0]));
  const pool = students.map((s) => ({ ...s, houseId: null as string | null, ogId: null as string | null }));

  // Sort each gender by school (department) first, then merit. Snake-distributing
  // this order spreads every school evenly across the houses too — so no house
  // ends up all-SEECS or all-NBS, and gender stays balanced on top of it.
  const byDeptThenMerit = (a: Student, b: Student) =>
    a.department.localeCompare(b.department) || (b.merit ?? 0) - (a.merit ?? 0);
  const males = pool.filter((s) => s.gender === "male").sort(byDeptThenMerit);
  const females = pool.filter((s) => s.gender === "female").sort(byDeptThenMerit);

  const snake = (list: Student[]) => {
    let idx = 0;
    let dir = 1;
    for (const s of list) {
      let tries = 0;
      while (cap != null && counts[houseIds[idx]] >= cap && tries <= houseIds.length) {
        idx = (idx + 1) % houseIds.length;
        tries++;
      }
      if (cap != null && counts[houseIds[idx]] >= cap) {
        log.push({ type: "overflow", row: null, message: `No capacity left for ${s.name} (${s.cmsId})` });
        continue;
      }
      s.houseId = houseIds[idx];
      counts[houseIds[idx]]++;
      idx += dir;
      if (idx >= houseIds.length) {
        idx = houseIds.length - 1;
        dir = -1;
      } else if (idx < 0) {
        idx = 0;
        dir = 1;
      }
    }
  };
  snake(males);
  snake(females);

  for (const house of houses) {
    if (!house.ogs.length) continue;
    const members = pool.filter((s) => s.houseId === house.id);
    (["male", "female"] as Gender[]).forEach((g) => {
      members
        .filter((s) => s.gender === g)
        .sort(byDeptThenMerit)
        .forEach((s, i) => {
          s.ogId = house.ogs[i % house.ogs.length].id;
        });
    });
  }

  return { students: pool, log };
}

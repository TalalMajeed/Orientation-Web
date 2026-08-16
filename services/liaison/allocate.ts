import type { Config, Gender, House, LogEntry, Student } from "@/services/liaison/types";

const byDepartmentThenMerit = (a: Student, b: Student) =>
  a.department.localeCompare(b.department) || (b.merit ?? 0) - (a.merit ?? 0);

export function allocate(
  students: Student[],
  houses: House[],
  config: Config
): { students: Student[]; log: LogEntry[] } {
  const log: LogEntry[] = [];
  const houseIds = houses.map((house) => house.id);
  const cap = config.houseCapacity;
  const counts: Record<string, number> = Object.fromEntries(houseIds.map((id) => [id, 0]));
  const pool = students.map((student) => ({
    ...student,
    houseId: null as string | null,
    ogId: null as string | null,
  }));

  const snake = (list: Student[]) => {
    let index = 0;
    let direction = 1;

    for (const student of list) {
      let tries = 0;

      while (cap != null && counts[houseIds[index]] >= cap && tries <= houseIds.length) {
        index = (index + 1) % houseIds.length;
        tries++;
      }

      if (cap != null && counts[houseIds[index]] >= cap) {
        log.push({
          type: "overflow",
          row: null,
          message: `No capacity left for ${student.name} (${student.cmsId})`,
        });
        continue;
      }

      student.houseId = houseIds[index];
      counts[houseIds[index]]++;
      index += direction;

      if (index >= houseIds.length) {
        index = houseIds.length - 1;
        direction = -1;
      } else if (index < 0) {
        index = 0;
        direction = 1;
      }
    }
  };

  snake(pool.filter((student) => student.gender === "male").sort(byDepartmentThenMerit));
  snake(pool.filter((student) => student.gender === "female").sort(byDepartmentThenMerit));

  for (const house of houses) {
    if (!house.ogs.length) continue;

    const members = pool.filter((student) => student.houseId === house.id);

    (["male", "female"] as Gender[]).forEach((gender) => {
      members
        .filter((student) => student.gender === gender)
        .sort(byDepartmentThenMerit)
        .forEach((student, index) => {
          student.ogId = house.ogs[index % house.ogs.length].id;
        });
    });
  }

  return { students: pool, log };
}

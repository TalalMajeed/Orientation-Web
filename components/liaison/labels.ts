import type { House, Student } from "@/components/liaison/types";

export function houseName(houses: House[], houseId: string | null): string {
  return houses.find((house) => house.id === houseId)?.name ?? "—";
}

export function ogLabel(houses: House[], student: Student): string {
  const house = houses.find((candidate) => candidate.id === student.houseId);
  const og = house?.ogs.find((candidate) => candidate.id === student.ogId);

  return house && og ? `${house.name} ${og.group}` : "—";
}

export function exportRows(houses: House[], students: Student[]) {
  return students.map((student) => ({
    Name: student.name,
    "CMS ID": student.cmsId,
    Department: student.department,
    Gender: student.gender,
    Merit: student.merit,
    House: houseName(houses, student.houseId),
    Group: ogLabel(houses, student),
  }));
}

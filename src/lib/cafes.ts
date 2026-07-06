import cafesData from "@/data/cafes.json";
import { cafesSchema, type Cafe } from "./schema";

export const cafes = cafesSchema.parse(cafesData);

export const cafesByNewest = [...cafes].sort(
  (a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt) || b.id - a.id,
);

export const areasByPopularity = countAreas(cafes);

export function latestCafes(limit: number): Cafe[] {
  return cafesByNewest.slice(0, limit);
}

export function topAreas(limit: number): Array<[string, number]> {
  return areasByPopularity.slice(0, limit);
}

function countAreas(entries: Cafe[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const cafe of entries) {
    counts.set(cafe.area, (counts.get(cafe.area) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

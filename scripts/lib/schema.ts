export { cafeSchema, cafesSchema, directionsUrl, type Cafe } from "@/src/lib/schema";

// Minimum favorite_count a source tweet needs to qualify for the list.
export const MIN_LIKES = 100;

export function tweetIdFromSource(source: string): string {
  const match = source.match(/\/status\/(\d+)$/);
  if (!match) throw new Error(`source is not a status URL: ${source}`);
  return match[1];
}

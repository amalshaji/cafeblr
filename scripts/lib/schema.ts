import { z } from "zod";

// Minimum favorite_count a source tweet needs to qualify for the list.
export const MIN_LIKES = 100;

export const cafeSchema = z.strictObject({
  id: z.number().int().positive(),
  name: z.string().min(1),
  area: z.string().min(1),
  knownFor: z.string().min(1),
  image: z.url({ protocol: /^https$/ }),
  video: z.url({ protocol: /^https$/ }).nullable(),
  source: z
    .string()
    .regex(
      /^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/,
      "source must be a canonical x.com/twitter.com status URL",
    ),
  author: z.string().regex(/^@[A-Za-z0-9_]{1,15}$/, "author must look like @handle"),
  likes: z.number().int().nonnegative(),
  mapsUrl: z.url({ protocol: /^https$/ }).nullable(),
  addedAt: z.iso.date(),
});

export const cafesSchema = z.array(cafeSchema);

export type Cafe = z.infer<typeof cafeSchema>;

export function directionsUrl(cafe: Cafe): string {
  if (cafe.mapsUrl) return cafe.mapsUrl;
  const destination = encodeURIComponent(`${cafe.name}, ${cafe.area}, Bengaluru`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function tweetIdFromSource(source: string): string {
  return source.split("/status/")[1]!;
}

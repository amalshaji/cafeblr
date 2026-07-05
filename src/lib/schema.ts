import { z } from "zod";

const httpsUrl = z.url({ protocol: /^https$/ });

export const cafeSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    area: z.string().min(1),
    knownFor: z.string().min(1),
    image: httpsUrl,
    video: httpsUrl.nullable(),
    mapsUrl: httpsUrl.nullable(),
    source: z
      .string()
      .regex(
        /^https:\/\/(x|twitter)\.com\/\w{1,15}\/status\/\d+$/,
        "must be a https://x.com/<user>/status/<id> URL",
      ),
    author: z.string().regex(/^@\w{1,15}$/, "must be an @handle"),
    likes: z.number().int().nonnegative(),
    addedAt: z.iso.date(),
  })
  .strict();

export const cafesSchema = z.array(cafeSchema);

export type Cafe = z.infer<typeof cafeSchema>;

/** Google Maps directions link — explicit mapsUrl wins, otherwise search by name + area. */
export function directionsUrl(cafe: Cafe): string {
  return (
    cafe.mapsUrl ??
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${cafe.name}, ${cafe.area}, Bengaluru`,
    )}`
  );
}

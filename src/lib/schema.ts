import { z } from "zod";

const httpsUrl = z.url({ protocol: /^https$/ });
const cleanString = z.string().refine((value) => value.trim() === value, {
  message: "must not have leading or trailing whitespace",
});

const googleMapsHosts = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
]);

export const cafeSchema = z
  .object({
    id: z.number().int().positive(),
    name: cleanString.min(1),
    area: cleanString.min(1),
    knownFor: cleanString.min(8).max(140),
    image: httpsUrl.refine((url) => new URL(url).hostname === "pbs.twimg.com", {
      message: "must be a pbs.twimg.com image URL",
    }),
    video: httpsUrl.nullable(),
    mapsUrl: httpsUrl
      .refine((url) => googleMapsHosts.has(new URL(url).hostname), {
        message: "must be a Google Maps URL",
      })
      .nullable(),
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

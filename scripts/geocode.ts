/**
 * Build data/geo.json — cafe id → { lat, lng } — for the homepage map.
 *
 * Coordinates come from each entry's Google Maps place page (the page HTML
 * embeds the place coordinates), with a Nominatim search fallback. Only ids
 * missing from geo.json are fetched, so rerun after adding cafes:
 *
 *   bun scripts/geocode.ts          # fetch missing entries
 *   bun scripts/geocode.ts --force  # refetch everything
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { cafesSchema } from "../src/lib/schema";

const GEO_PATH = new URL("../data/geo.json", import.meta.url).pathname;
const CAFES_PATH = new URL("../data/cafes.json", import.meta.url).pathname;

// Generous Bengaluru bounding box — rejects parses that grabbed the wrong number.
const BLR = { latMin: 12.6, latMax: 13.4, lngMin: 77.2, lngMax: 78.0 };

type Point = { lat: number; lng: number };

function inBengaluru(p: Point): boolean {
  return p.lat >= BLR.latMin && p.lat <= BLR.latMax && p.lng >= BLR.lngMin && p.lng <= BLR.lngMax;
}

function round(p: Point): Point {
  return { lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) };
}

/** Pull place coordinates out of a Google Maps place page. */
function coordsFromMapsHtml(html: string): Point | null {
  // APP_INITIALIZATION_STATE=[[[zoom,lng,lat],...
  const init = html.match(/APP_INITIALIZATION_STATE=\[\[\[[-\d.]+,([-\d.]+),([-\d.]+)\]/);
  if (init) {
    const p = { lat: Number(init[2]), lng: Number(init[1]) };
    if (inBengaluru(p)) return p;
  }
  // /maps/place/…/@lat,lng,zoom
  const at = html.match(/@([-\d.]+),([-\d.]+),\d+/);
  if (at) {
    const p = { lat: Number(at[1]), lng: Number(at[2]) };
    if (inBengaluru(p)) return p;
  }
  // og:image static map: center=lat%2Clng
  const og = html.match(/center=([-\d.]+)%2C([-\d.]+)/);
  if (og) {
    const p = { lat: Number(og[1]), lng: Number(og[2]) };
    if (inBengaluru(p)) return p;
  }
  return null;
}

async function fromMapsUrl(mapsUrl: string): Promise<Point | null> {
  try {
    const res = await fetch(mapsUrl, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    });
    if (!res.ok) return null;
    return coordsFromMapsHtml(await res.text());
  } catch {
    return null;
  }
}

async function fromNominatim(name: string, area: string): Promise<Point | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${name}, ${area}, Bengaluru, India`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  try {
    const res = await fetch(url, { headers: { "user-agent": "cafeblr-geocoder (github.com/amalshaji/cafeblr)" } });
    if (!res.ok) return null;
    const hits = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!hits.length) return null;
    const p = { lat: Number(hits[0].lat), lng: Number(hits[0].lon) };
    return inBengaluru(p) ? p : null;
  } catch {
    return null;
  }
}

const force = process.argv.includes("--force");
const cafes = cafesSchema.parse(JSON.parse(readFileSync(CAFES_PATH, "utf8")));
const geo: Record<string, Point> = force || !existsSync(GEO_PATH) ? {} : JSON.parse(readFileSync(GEO_PATH, "utf8"));

const misses: string[] = [];
for (const cafe of cafes) {
  const key = String(cafe.id);
  if (geo[key]) continue;

  let point = cafe.mapsUrl ? await fromMapsUrl(cafe.mapsUrl) : null;
  let via = "maps";
  if (!point) {
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim rate limit
    point = await fromNominatim(cafe.name, cafe.area);
    via = "nominatim";
  }

  if (point) {
    geo[key] = round(point);
    console.log(`✓ #${cafe.id} ${cafe.name} → ${geo[key].lat},${geo[key].lng} (${via})`);
  } else {
    misses.push(`#${cafe.id} ${cafe.name} (${cafe.area})`);
    console.warn(`✗ #${cafe.id} ${cafe.name} — no coordinates found`);
  }
}

const sorted = Object.fromEntries(
  Object.entries(geo).sort(([a], [b]) => Number(a) - Number(b)),
);
writeFileSync(GEO_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`\nWrote ${Object.keys(sorted).length}/${cafes.length} entries to data/geo.json`);
if (misses.length) console.warn(`Missing: ${misses.join(", ")}`);

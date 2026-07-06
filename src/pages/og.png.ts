import type { APIRoute } from "astro";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import satori from "satori";
import { SEO, seoStats } from "../lib/seo";

export const prerender = true;

const width = SEO.ogImageWidth;
const height = SEO.ogImageHeight;
const displayHost = new URL(SEO.siteUrl).host;

const colors = {
  canvas: "#ffffff",
  ink: "#201914",
  muted: "#75695f",
  line: "#ece6e0",
  wash: "#faf8f6",
  accent: SEO.accentColor,
  accentDeep: "#14432f",
};

type SatoriChild = string | number | SatoriNode;
type SatoriNode = {
  type: string;
  props: Record<string, unknown> & {
    children?: SatoriChild | SatoriChild[];
  };
};

function el(
  type: string,
  props: Record<string, unknown>,
  children?: SatoriChild | SatoriChild[],
): SatoriNode {
  return {
    type,
    props: {
      ...props,
      ...(children === undefined ? {} : { children }),
    },
  };
}

const fontFiles = {
  figtreeRegular:
    "node_modules/@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf",
  figtreeSemiBold:
    "node_modules/@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf",
  figtreeBold:
    "node_modules/@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf",
  frauncesRegular:
    "node_modules/@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf",
  frauncesSemiBold:
    "node_modules/@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf",
};

const fontsPromise = Promise.all(
  Object.entries(fontFiles).map(async ([name, path]) => {
    const data = await readFile(join(process.cwd(), path));
    return [name, data] as const;
  }),
);
const faviconPromise = readFile(join(process.cwd(), "public/favicon.svg"), "utf8");

async function loadFonts() {
  const fonts = Object.fromEntries(await fontsPromise);
  return [
    {
      name: "Figtree",
      data: fonts.figtreeRegular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Figtree",
      data: fonts.figtreeSemiBold,
      weight: 600 as const,
      style: "normal" as const,
    },
    {
      name: "Figtree",
      data: fonts.figtreeBold,
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Fraunces",
      data: fonts.frauncesRegular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Fraunces",
      data: fonts.frauncesSemiBold,
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

async function loadFaviconDataUrl() {
  const svg = await faviconPromise;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function stat(label: string, value: string) {
  return el(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "15px 18px",
        border: `1px solid ${colors.line}`,
        borderRadius: 18,
        backgroundColor: colors.canvas,
      },
    },
    [
      el("div", { style: { fontSize: 31, fontWeight: 700, color: colors.ink } }, value),
      el("div", { style: { fontSize: 17, color: colors.muted } }, label),
    ],
  );
}

function areaChip(area: string, count: number) {
  return el(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "10px 16px",
        border: `1px solid ${colors.line}`,
        borderRadius: 999,
        backgroundColor: colors.canvas,
        fontSize: 18,
        fontWeight: 600,
      },
    },
    [
      area,
      el("span", { style: { color: colors.muted, fontWeight: 400 } }, String(count)),
    ],
  );
}

function cafeRow(cafe: (typeof seoStats.latestCafes)[number], index: number) {
  return el(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "18px 20px",
        border: `1px solid ${colors.line}`,
        borderRadius: 18,
        backgroundColor: colors.canvas,
        boxShadow: "0 2px 8px rgba(32, 25, 20, 0.05)",
      },
    },
    [
      el(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
          },
        },
        [
          el(
            "div",
            {
              style: {
                fontSize: 25,
                fontWeight: 700,
                color: colors.ink,
                lineHeight: 1.1,
              },
            },
            cafe.name,
          ),
          el(
            "div",
            {
              style: {
                flexShrink: 0,
                fontSize: 16,
                fontWeight: 600,
                color: colors.accent,
              },
            },
            cafe.area,
          ),
        ],
      ),
      el(
        "div",
        {
          style: {
            display: "flex",
            color: colors.muted,
            fontSize: 16,
            lineHeight: 1.3,
          },
        },
        `${index === 0 ? "Latest find" : "Internet loved"}: ${cafe.knownFor}`,
      ),
    ],
  );
}

function ogMarkup(iconSrc: string) {
  const areaChips = seoStats.topAreas.map(([area, count]) => areaChip(area, count));
  const latestRows = seoStats.latestCafes
    .slice(0, 2)
    .map((cafe, index) => cafeRow(cafe, index));

  return el(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width,
        height,
        padding: "52px 62px",
        backgroundColor: colors.wash,
        color: colors.ink,
        fontFamily: "Figtree",
      },
    },
    [
      el("div", {
        style: {
          position: "absolute",
          left: 62,
          right: 62,
          top: 122,
          height: 1,
          backgroundColor: colors.line,
        },
      }),
      el(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 28,
          },
        },
        [
          el(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 14,
              },
            },
            [
              el(
                "img",
                {
                  src: iconSrc,
                  width: 46,
                  height: 46,
                  style: {
                    display: "flex",
                    width: 46,
                    height: 46,
                    flexShrink: 0,
                  },
                },
              ),
              el(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    fontFamily: "Fraunces",
                    fontSize: 36,
                    fontWeight: 600,
                  },
                },
                [
                  "Cafe",
                  el("span", { style: { color: colors.accent } }, "BLR"),
                ],
              ),
            ],
          ),
          el(
            "div",
            {
              style: {
                fontSize: 20,
                color: colors.muted,
              },
            },
            "Sourced from posts Bengaluru loved",
          ),
        ],
      ),
      el(
        "div",
        {
          style: {
            display: "flex",
            flex: 1,
            gap: 42,
            paddingTop: 46,
          },
        },
        [
          el(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                width: 630,
              },
            },
            [
              el(
                "div",
                {
                  style: {
                    display: "flex",
                    fontFamily: "Fraunces",
                    fontSize: 65,
                    fontWeight: 400,
                    lineHeight: 1.04,
                    color: colors.ink,
                  },
                },
                "Nice cafes in Bengaluru, found by the internet.",
              ),
              el(
                "div",
                {
                  style: {
                    display: "flex",
                    marginTop: 22,
                    maxWidth: 620,
                    fontSize: 25,
                    lineHeight: 1.34,
                    color: colors.muted,
                  },
                },
                "Every spot comes with directions and the receipts.",
              ),
              el(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 12,
                    marginTop: 30,
                    flexWrap: "wrap",
                  },
                },
                areaChips,
              ),
            ],
          ),
          el(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                width: 390,
                gap: 16,
              },
            },
            [
              el(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 14,
                  },
                },
                [
                  stat("cafes", String(seoStats.cafeCount)),
                  stat("areas", String(seoStats.areaCount)),
                ],
              ),
              ...latestRows,
            ],
          ),
        ],
      ),
      el(
        "div",
        {
          style: {
            position: "absolute",
            left: 62,
            right: 62,
            bottom: 38,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: colors.muted,
            fontSize: 18,
          },
        },
        [
          displayHost,
          el(
            "span",
            { style: { color: colors.accentDeep, fontWeight: 600 } },
            "Directions + receipts for every spot",
          ),
        ],
      ),
    ],
  );
}

export const GET: APIRoute = async () => {
  const svg = await satori(ogMarkup(await loadFaviconDataUrl()), {
    width,
    height,
    fonts: await loadFonts(),
  });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
